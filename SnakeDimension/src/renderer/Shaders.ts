export const vertexShaderCode = `
struct Uniforms {
  viewMatrix: mat4x4<f32>,
  projMatrix: mat4x4<f32>,
  viewProjMatrix: mat4x4<f32>,
  invViewMatrix: mat4x4<f32>,
  invProjMatrix: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  lightCount: u32,
  padding: vec3<f32>,
};

struct InstanceData {
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  materialIndex: u32,
  padding: vec3<f32>,
};

struct MaterialData {
  baseColor: vec4<f32>,
  metallicRoughness: vec4<f32>,
  emissiveColor: vec4<f32>,
  materialType: u32,
  padding: vec3<f32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) fragPosition: vec4<f32>,
  @location(1) fragNormal: vec3<f32>,
  @location(2) fragUV: vec2<f32>,
  @location(3) fragColor: vec4<f32>,
  @location(4) materialIndex: u32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> instances: array<InstanceData>;
@group(0) @binding(2) var<storage, read> materials: array<MaterialData>;

@vertex
fn main(
  @location(0) position: vec3<f32>,
  @location(1) normal: vec3<f32>,
  @location(2) uv: vec2<f32>,
  @location(3) color: vec4<f32>,
  @builtin(instance_index) instanceIndex: u32
) -> VertexOutput {
  let instance = instances[instanceIndex];
  let modelMatrix = instance.modelMatrix;
  let normalMatrix = instance.normalMatrix;
  
  let worldPosition = modelMatrix * vec4<f32>(position, 1.0);
  let clipPosition = uniforms.projMatrix * uniforms.viewMatrix * worldPosition;
  
  var output: VertexOutput;
  output.position = clipPosition;
  output.fragPosition = worldPosition;
  output.fragNormal = normalize((normalMatrix * vec4<f32>(normal, 0.0)).xyz);
  output.fragUV = uv;
  output.fragColor = color;
  output.materialIndex = instance.materialIndex;
  
  return output;
}
`;

export const fragmentShaderCode = `
struct Uniforms {
  viewMatrix: mat4x4<f32>,
  projMatrix: mat4x4<f32>,
  viewProjMatrix: mat4x4<f32>,
  invViewMatrix: mat4x4<f32>,
  invProjMatrix: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  lightCount: u32,
  padding: vec3<f32>,
};

struct LightData {
  position: vec4<f32>,
  color: vec4<f32>,
  direction: vec4<f32>,
  params: vec4<f32>,
};

struct MaterialData {
  baseColor: vec4<f32>,
  metallicRoughness: vec4<f32>,
  emissiveColor: vec4<f32>,
  materialType: u32,
  padding: vec3<f32>,
};

struct TileData {
  lightCount: u32,
  lightIndices: array<u32, 32>,
};

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) fragPosition: vec4<f32>,
  @location(1) fragNormal: vec3<f32>,
  @location(2) fragUV: vec2<f32>,
  @location(3) fragColor: vec4<f32>,
  @location(4) materialIndex: u32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> lights: array<LightData>;
@group(0) @binding(2) var<storage, read> tiles: array<TileData>;
@group(0) @binding(3) var<storage, read> materials: array<MaterialData>;

fn calculateDirectionalLight(
  lightDir: vec3<f32>,
  lightColor: vec3<f32>,
  normal: vec3<f32>,
  viewDir: vec3<f32>,
  metallic: f32,
  roughness: f32
) -> vec3<f32> {
  let N = normalize(normal);
  let L = normalize(-lightDir);
  let V = normalize(viewDir);
  let H = normalize(V + L);
  
  let NdotL = max(dot(N, L), 0.0);
  let NdotH = max(dot(N, H), 0.0);
  
  let F0 = mix(vec3<f32>(0.04), vec3<f32>(1.0), metallic);
  
  let alpha = roughness * roughness;
  let alpha2 = alpha * alpha;
  let denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
  let D = alpha2 / (3.14159 * denom * denom);
  
  let F = F0 + (1.0 - F0) * pow(clamp(1.0 - max(dot(H, V), 0.0), 0.0, 1.0), 5.0);
  
  let k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  let G1V = max(dot(N, V), 0.0) / (max(dot(N, V), 0.0) * (1.0 - k) + k);
  let G1L = max(dot(N, L), 0.0) / (max(dot(N, L), 0.0) * (1.0 - k) + k);
  let G = G1V * G1L;
  
  let specular = (D * F * G) / (4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001);
  
  let diffuse = (1.0 - F) * (1.0 - metallic) / 3.14159;
  
  return (diffuse + specular) * lightColor * NdotL;
}

fn calculatePointLight(
  lightPos: vec3<f32>,
  lightColor: vec3<f32>,
  intensity: f32,
  range: f32,
  worldPos: vec3<f32>,
  normal: vec3<f32>,
  viewDir: vec3<f32>,
  metallic: f32,
  roughness: f32
) -> vec3<f32> {
  let toLight = lightPos - worldPos;
  let distance = length(toLight);
  
  if (distance > range) {
    return vec3<f32>(0.0);
  }
  
  let attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
  let lightDir = normalize(-toLight);
  
  let contribution = calculateDirectionalLight(
    lightDir,
    lightColor,
    normal,
    viewDir,
    metallic,
    roughness
  );
  
  return contribution * intensity * attenuation;
}

fn calculateSpotLight(
  lightPos: vec3<f32>,
  lightDir: vec3<f32>,
  lightColor: vec3<f32>,
  intensity: f32,
  range: f32,
  spotAngle: f32,
  spotInnerAngle: f32,
  worldPos: vec3<f32>,
  normal: vec3<f32>,
  viewDir: vec3<f32>,
  metallic: f32,
  roughness: f32
) -> vec3<f32> {
  let toLight = lightPos - worldPos;
  let distance = length(toLight);
  
  if (distance > range) {
    return vec3<f32>(0.0);
  }
  
  let spotDir = normalize(lightDir);
  let lightToFrag = normalize(-toLight);
  let spotCos = dot(lightToFrag, spotDir);
  let outerCos = cos(spotAngle);
  let innerCos = cos(spotInnerAngle);
  
  if (spotCos < outerCos) {
    return vec3<f32>(0.0);
  }
  
  let spotFactor = smoothstep(outerCos, innerCos, spotCos);
  let attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
  let lightDirNorm = normalize(-toLight);
  
  let contribution = calculateDirectionalLight(
    lightDirNorm,
    lightColor,
    normal,
    viewDir,
    metallic,
    roughness
  );
  
  return contribution * intensity * attenuation * spotFactor;
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  let material = materials[input.materialIndex];
  let baseColor = material.baseColor * input.fragColor;
  let metallic = material.metallicRoughness.x;
  let roughness = material.metallicRoughness.y;
  
  if (material.materialType == 1u) {
    return baseColor;
  }
  
  let emissive = material.emissiveColor * material.metallicRoughness.z;
  
  let worldPos = input.fragPosition.xyz;
  let normal = normalize(input.fragNormal);
  let viewDir = normalize(uniforms.cameraPosition.xyz - worldPos);
  
  var totalLight = vec3<f32>(0.03);
  
  let screenPos = input.position;
  let tileX = u32(screenPos.x) / 16u;
  let tileY = u32(screenPos.y) / 16u;
  let tileIndex = tileY * (u32(uniforms.cameraPosition.w) / 16u + 1u) + tileX;
  
  let tile = tiles[min(tileIndex, arrayLength(&tiles) - 1u)];
  
  for (var i = 0u; i < tile.lightCount && i < 32u; i = i + 1u) {
    let lightIndex = tile.lightIndices[i];
    let light = lights[lightIndex];
    
    let lightType = u32(light.params.x);
    
    if (lightType == 0u) {
      let dirLightDir = light.direction.xyz;
      let dirLightColor = light.color.rgb;
      let dirLightIntensity = light.params.y;
      
      totalLight = totalLight + calculateDirectionalLight(
        dirLightDir,
        dirLightColor * dirLightIntensity,
        normal,
        viewDir,
        metallic,
        roughness
      );
    } else if (lightType == 1u) {
      let pointLightPos = light.position.xyz;
      let pointLightColor = light.color.rgb;
      let pointLightIntensity = light.params.y;
      let pointLightRange = light.params.z;
      
      totalLight = totalLight + calculatePointLight(
        pointLightPos,
        pointLightColor,
        pointLightIntensity,
        pointLightRange,
        worldPos,
        normal,
        viewDir,
        metallic,
        roughness
      );
    } else if (lightType == 2u) {
      let spotLightPos = light.position.xyz;
      let spotLightDir = light.direction.xyz;
      let spotLightColor = light.color.rgb;
      let spotLightIntensity = light.params.y;
      let spotLightRange = light.params.z;
      let spotAngle = light.params.w;
      let spotInnerAngle = light.direction.w;
      
      totalLight = totalLight + calculateSpotLight(
        spotLightPos,
        spotLightDir,
        spotLightColor,
        spotLightIntensity,
        spotLightRange,
        spotAngle,
        spotInnerAngle,
        worldPos,
        normal,
        viewDir,
        metallic,
        roughness
      );
    }
  }
  
  var finalColor = baseColor.rgb * totalLight + emissive;
  
  if (material.materialType == 2u) {
    finalColor = finalColor + material.emissiveColor * material.metallicRoughness.z;
  }
  
  return vec4<f32>(finalColor, baseColor.a);
}
`;

export const lightCullingComputeShaderCode = `
struct Uniforms {
  viewMatrix: mat4x4<f32>,
  projMatrix: mat4x4<f32>,
  viewProjMatrix: mat4x4<f32>,
  invViewMatrix: mat4x4<f32>,
  invProjMatrix: mat4x4<f32>,
  cameraPosition: vec4<f32>,
  lightCount: u32,
  padding: vec3<f32>,
};

struct LightData {
  position: vec4<f32>,
  color: vec4<f32>,
  direction: vec4<f32>,
  params: vec4<f32>,
};

struct TileData {
  lightCount: u32,
  lightIndices: array<u32, 32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> lights: array<LightData>;
@group(0) @binding(2) var<storage, read_write> tiles: array<TileData>;

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) globalId: vec3<u32>) {
  let tileX = globalId.x;
  let tileY = globalId.y;
  
  let screenWidth = uniforms.cameraPosition.w;
  let screenHeight = uniforms.padding.x;
  
  if (tileX * 16u >= u32(screenWidth) || tileY * 16u >= u32(screenHeight)) {
    return;
  }
  
  let tileIndex = tileY * (u32(screenWidth + 15.0) / 16u) + tileX;
  
  tiles[tileIndex].lightCount = 0u;
  
  let tileMinX = f32(tileX * 16u) / screenWidth * 2.0 - 1.0;
  let tileMaxX = f32(tileX * 16u + 16u) / screenWidth * 2.0 - 1.0;
  let tileMinY = f32(tileY * 16u) / screenHeight * 2.0 - 1.0;
  let tileMaxY = f32(tileY * 16u + 16u) / screenHeight * 2.0 - 1.0;
  
  let tileCorners = array<vec4<f32>, 4>(
    vec4<f32>(tileMinX, tileMinY, 0.0, 1.0),
    vec4<f32>(tileMaxX, tileMinY, 0.0, 1.0),
    vec4<f32>(tileMaxX, tileMaxY, 0.0, 1.0),
    vec4<f32>(tileMinX, tileMaxY, 0.0, 1.0)
  );
  
  var tileFrustumRays: array<vec3<f32>, 4>;
  for (var i = 0u; i < 4u; i = i + 1u) {
    let ray = uniforms.invProjMatrix * tileCorners[i];
    tileFrustumRays[i] = normalize(ray.xyz / ray.w);
  }
  
  var lightCountInTile = 0u;
  
  for (var lightIndex = 0u; lightIndex < uniforms.lightCount; lightIndex = lightIndex + 1u) {
    if (lightCountInTile >= 32u) {
      break;
    }
    
    let light = lights[lightIndex];
    let lightType = u32(light.params.x);
    
    var inTile = false;
    
    if (lightType == 0u) {
      inTile = true;
    } else if (lightType == 1u) {
      let lightPos = light.position.xyz;
      let lightRange = light.params.z;
      
      let viewPos = (uniforms.viewMatrix * vec4<f32>(lightPos, 1.0)).xyz;
      
      if (viewPos.z > -lightRange) {
        let projected = uniforms.projMatrix * vec4<f32>(viewPos, 1.0);
        let screenPos = projected.xy / projected.w;
        
        let radius = lightRange / max(-viewPos.z, 0.1);
        let projRadius = radius * uniforms.projMatrix[0][0];
        
        if (screenPos.x + projRadius > tileMinX &&
            screenPos.x - projRadius < tileMaxX &&
            screenPos.y + projRadius > tileMinY &&
            screenPos.y - projRadius < tileMaxY) {
          inTile = true;
        }
      }
    } else if (lightType == 2u) {
      let lightPos = light.position.xyz;
      let lightRange = light.params.z;
      
      let viewPos = (uniforms.viewMatrix * vec4<f32>(lightPos, 1.0)).xyz;
      
      if (viewPos.z > -lightRange) {
        let projected = uniforms.projMatrix * vec4<f32>(viewPos, 1.0);
        let screenPos = projected.xy / projected.w;
        
        let radius = lightRange / max(-viewPos.z, 0.1);
        let projRadius = radius * uniforms.projMatrix[0][0];
        
        if (screenPos.x + projRadius > tileMinX &&
            screenPos.x - projRadius < tileMaxX &&
            screenPos.y + projRadius > tileMinY &&
            screenPos.y - projRadius < tileMaxY) {
          inTile = true;
        }
      }
    }
    
    if (inTile) {
      tiles[tileIndex].lightIndices[lightCountInTile] = lightIndex;
      lightCountInTile = lightCountInTile + 1u;
    }
  }
  
  tiles[tileIndex].lightCount = lightCountInTile;
}
`;

export const shadowShaderCode = `
struct Uniforms {
  lightViewProj: mat4x4<f32>,
};

struct InstanceData {
  modelMatrix: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  materialIndex: u32,
  padding: vec3<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> instances: array<InstanceData>;

@vertex
fn main(
  @location(0) position: vec3<f32>,
  @builtin(instance_index) instanceIndex: u32
) -> @builtin(position) vec4<f32> {
  let instance = instances[instanceIndex];
  let modelMatrix = instance.modelMatrix;
  let worldPosition = modelMatrix * vec4<f32>(position, 1.0);
  return uniforms.lightViewProj * worldPosition;
}
`;
