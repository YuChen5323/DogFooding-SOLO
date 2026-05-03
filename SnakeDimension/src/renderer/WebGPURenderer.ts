import { mat4, vec3, vec4 } from 'gl-matrix';
import {
  UniformBufferObject,
  PointLight,
  DirectionalLight,
  SpotLight,
  ForwardPlusConfig,
  DEFAULT_FORWARD_PLUS_CONFIG,
} from './Types';
import {
  vertexShaderCode,
  fragmentShaderCode,
  lightCullingComputeShaderCode,
  shadowShaderCode,
} from './Shaders';
import { MeshData } from '../components/Mesh';

export interface RenderMesh {
  vertexBuffer: GPUBuffer;
  indexBuffer: GPUBuffer;
  indexCount: number;
  vertexCount: number;
}

export interface RenderMaterial {
  baseColor: vec4;
  metallic: number;
  roughness: number;
  emissiveColor: vec3;
  emissiveIntensity: number;
  materialType: number;
}

export interface RenderInstance {
  modelMatrix: mat4;
  normalMatrix: mat4;
  meshIndex: number;
  materialIndex: number;
}

export class WebGPURenderer {
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private adapter: GPUAdapter | null = null;
  private device: GPUDevice | null = null;
  private format: GPUTextureFormat;
  private size: { width: number; height: number };

  private config: ForwardPlusConfig;

  private uniformBuffer: GPUBuffer | null = null;
  private lightDataBuffer: GPUBuffer | null = null;
  private tileDataBuffer: GPUBuffer | null = null;
  private materialDataBuffer: GPUBuffer | null = null;
  private instanceDataBuffer: GPUBuffer | null = null;
  private shadowInstanceDataBuffer: GPUBuffer | null = null;

  private renderPipeline: GPURenderPipeline | null = null;
  private shadowPipeline: GPURenderPipeline | null = null;
  private lightCullingPipeline: GPUComputePipeline | null = null;

  private renderBindGroup: GPUBindGroup | null = null;
  private computeBindGroup: GPUBindGroup | null = null;
  private shadowBindGroup: GPUBindGroup | null = null;

  private depthTexture: GPUTexture | null = null;
  private depthTextureView: GPUTextureView | null = null;

  private shadowMapTexture: GPUTexture | null = null;
  private shadowMapView: GPUTextureView | null = null;
  private shadowDepthTexture: GPUTexture | null = null;
  private shadowDepthView: GPUTextureView | null = null;

  private meshes: RenderMesh[] = [];
  private materials: RenderMaterial[] = [];
  private instances: RenderInstance[] = [];

  private directionalLights: DirectionalLight[] = [];
  private pointLights: PointLight[] = [];
  private spotLights: SpotLight[] = [];

  private initialized: boolean = false;

  constructor(canvas: HTMLCanvasElement, config?: Partial<ForwardPlusConfig>) {
    this.canvas = canvas;
    this.context = canvas.getContext('webgpu')!;
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.size = { width: canvas.width, height: canvas.height };
    this.config = { ...DEFAULT_FORWARD_PLUS_CONFIG, ...config };
  }

  async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.error('WebGPU is not supported');
      return false;
    }

    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!this.adapter) {
      console.error('Failed to get GPU adapter');
      return false;
    }

    this.device = await this.adapter.requestDevice({
      requiredFeatures: [],
      requiredLimits: {
        maxStorageBuffersPerShaderStage: 4,
        maxStorageBufferBindingSize: 128 * 1024 * 1024,
        maxComputeWorkgroupSizeX: 16,
        maxComputeWorkgroupSizeY: 16,
      },
    });

    if (!this.device) {
      console.error('Failed to get GPU device');
      return false;
    }

    this.device.lost.then((info) => {
      console.error(`GPU device lost: ${info.message}`);
      this.initialized = false;
    });

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });

    this.createResources();
    this.createPipelines();
    this.createBindGroups();

    this.initialized = true;
    return true;
  }

  private createResources(): void {
    const device = this.device!;

    this.uniformBuffer = device.createBuffer({
      size: 512,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: 'Uniform Buffer',
    });

    this.lightDataBuffer = device.createBuffer({
      size: 256 * 1024,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: 'Light Data Buffer',
    });

    const tileCountX = Math.ceil(this.size.width / this.config.tileSize);
    const tileCountY = Math.ceil(this.size.height / this.config.tileSize);
    const tileDataSize = tileCountX * tileCountY * (4 + 32 * 4);

    this.tileDataBuffer = device.createBuffer({
      size: Math.max(tileDataSize, 65536),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: 'Tile Data Buffer',
    });

    this.materialDataBuffer = device.createBuffer({
      size: 64 * 1024,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: 'Material Data Buffer',
    });

    this.instanceDataBuffer = device.createBuffer({
      size: 256 * 1024,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: 'Instance Data Buffer',
    });

    this.shadowInstanceDataBuffer = device.createBuffer({
      size: 256 * 1024,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: 'Shadow Instance Data Buffer',
    });

    this.createDepthTexture();
    this.createShadowMap();
  }

  private createDepthTexture(): void {
    if (this.depthTexture) {
      this.depthTexture.destroy();
    }

    this.depthTexture = this.device!.createTexture({
      size: [this.size.width, this.size.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      label: 'Depth Texture',
    });

    this.depthTextureView = this.depthTexture.createView();
  }

  private createShadowMap(): void {
    const shadowSize = this.config.shadowMapSize;

    if (this.shadowMapTexture) {
      this.shadowMapTexture.destroy();
    }

    this.shadowMapTexture = this.device!.createTexture({
      size: [shadowSize, shadowSize],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
      label: 'Shadow Map Texture',
    });

    this.shadowMapView = this.shadowMapTexture.createView();

    this.shadowDepthTexture = this.device!.createTexture({
      size: [shadowSize, shadowSize],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
      label: 'Shadow Depth Texture',
    });

    this.shadowDepthView = this.shadowDepthTexture.createView();
  }

  private createPipelines(): void {
    const device = this.device!;

    const vertexShaderModule = device.createShaderModule({
      code: vertexShaderCode,
      label: 'Vertex Shader',
    });

    const fragmentShaderModule = device.createShaderModule({
      code: fragmentShaderCode,
      label: 'Fragment Shader',
    });

    const computeShaderModule = device.createShaderModule({
      code: lightCullingComputeShaderCode,
      label: 'Light Culling Compute Shader',
    });

    const shadowShaderModule = device.createShaderModule({
      code: shadowShaderCode,
      label: 'Shadow Shader',
    });

    const renderBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
      ],
      label: 'Render Bind Group Layout',
    });

    const fragmentBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: { type: 'read-only-storage' },
        },
      ],
      label: 'Fragment Bind Group Layout',
    });

    const computeBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'read-only-storage' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' },
        },
      ],
      label: 'Compute Bind Group Layout',
    });

    const shadowBindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'read-only-storage' },
        },
      ],
      label: 'Shadow Bind Group Layout',
    });

    const renderPipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [renderBindGroupLayout, fragmentBindGroupLayout],
      label: 'Render Pipeline Layout',
    });

    const computePipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [computeBindGroupLayout],
      label: 'Compute Pipeline Layout',
    });

    const shadowPipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [shadowBindGroupLayout],
      label: 'Shadow Pipeline Layout',
    });

    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 4 * (3 + 3 + 2 + 4),
      attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },
        { shaderLocation: 1, offset: 12, format: 'float32x3' },
        { shaderLocation: 2, offset: 24, format: 'float32x2' },
        { shaderLocation: 3, offset: 32, format: 'float32x4' },
      ],
    };

    this.renderPipeline = device.createRenderPipeline({
      layout: renderPipelineLayout,
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'main',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'main',
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      label: 'Main Render Pipeline',
    });

    this.lightCullingPipeline = device.createComputePipeline({
      layout: computePipelineLayout,
      compute: {
        module: computeShaderModule,
        entryPoint: 'main',
      },
      label: 'Light Culling Pipeline',
    });

    this.shadowPipeline = device.createRenderPipeline({
      layout: shadowPipelineLayout,
      vertex: {
        module: shadowShaderModule,
        entryPoint: 'main',
        buffers: [vertexBufferLayout],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      label: 'Shadow Render Pipeline',
    });
  }

  private createBindGroups(): void {
    const device = this.device!;

    this.renderBindGroup = device.createBindGroup({
      layout: this.renderPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer! } },
        { binding: 1, resource: { buffer: this.instanceDataBuffer! } },
        { binding: 2, resource: { buffer: this.materialDataBuffer! } },
      ],
      label: 'Render Bind Group',
    });

    this.computeBindGroup = device.createBindGroup({
      layout: this.lightCullingPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer! } },
        { binding: 1, resource: { buffer: this.lightDataBuffer! } },
        { binding: 2, resource: { buffer: this.tileDataBuffer! } },
      ],
      label: 'Compute Bind Group',
    });

    this.shadowBindGroup = device.createBindGroup({
      layout: this.shadowPipeline!.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer! } },
        { binding: 1, resource: { buffer: this.shadowInstanceDataBuffer! } },
      ],
      label: 'Shadow Bind Group',
    });
  }

  uploadMesh(meshData: MeshData): number {
    const device = this.device!;

    const vertexData = new Float32Array(meshData.vertices.length * (3 + 3 + 2 + 4));
    let offset = 0;

    for (const vertex of meshData.vertices) {
      vertexData.set(vertex.position, offset);
      offset += 3;
      vertexData.set(vertex.normal, offset);
      offset += 3;
      vertexData.set(vertex.uv, offset);
      offset += 2;
      vertexData.set(vertex.color, offset);
      offset += 4;
    }

    const vertexBuffer = device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      label: `Vertex Buffer ${this.meshes.length}`,
    });

    device.queue.writeBuffer(vertexBuffer, 0, vertexData);

    const indexData = new Uint32Array(meshData.indices);
    const indexBuffer = device.createBuffer({
      size: indexData.byteLength,
      usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
      label: `Index Buffer ${this.meshes.length}`,
    });

    device.queue.writeBuffer(indexBuffer, 0, indexData);

    const renderMesh: RenderMesh = {
      vertexBuffer,
      indexBuffer,
      indexCount: meshData.indexCount,
      vertexCount: meshData.vertices.length,
    };

    this.meshes.push(renderMesh);
    return this.meshes.length - 1;
  }

  uploadMaterial(material: RenderMaterial): number {
    this.materials.push(material);
    return this.materials.length - 1;
  }

  addInstance(instance: RenderInstance): void {
    this.instances.push(instance);
  }

  clearInstances(): void {
    this.instances = [];
  }

  addDirectionalLight(light: DirectionalLight): void {
    this.directionalLights.push(light);
  }

  addPointLight(light: PointLight): void {
    this.pointLights.push(light);
  }

  addSpotLight(light: SpotLight): void {
    this.spotLights.push(light);
  }

  clearLights(): void {
    this.directionalLights = [];
    this.pointLights = [];
    this.spotLights = [];
  }

  updateUniforms(ubo: UniformBufferObject): void {
    const device = this.device!;

    const data = new Float32Array(128);
    let offset = 0;

    data.set(ubo.viewMatrix as Float32Array, offset);
    offset += 16;
    data.set(ubo.projMatrix as Float32Array, offset);
    offset += 16;
    data.set(ubo.viewProjMatrix as Float32Array, offset);
    offset += 16;
    data.set(ubo.invViewMatrix as Float32Array, offset);
    offset += 16;
    data.set(ubo.invProjMatrix as Float32Array, offset);
    offset += 16;
    data.set(ubo.cameraPosition as Float32Array, offset);
    offset += 4;

    const lightCount =
      this.directionalLights.length +
      this.pointLights.length +
      this.spotLights.length;

    data[offset] = lightCount;
    data[offset + 1] = this.size.width;
    data[offset + 2] = this.size.height;

    device.queue.writeBuffer(this.uniformBuffer!, 0, data);
  }

  updateLightData(): void {
    const device = this.device!;

    const lightCount =
      this.directionalLights.length +
      this.pointLights.length +
      this.spotLights.length;

    if (lightCount === 0) return;

    const lightData = new Float32Array(lightCount * 16);
    let lightIndex = 0;
    let offset = 0;

    for (const light of this.directionalLights) {
      lightData.set([0, 0, 0, 0], offset);
      offset += 4;
      lightData.set(light.color as Float32Array, offset);
      lightData[offset + 3] = 1.0;
      offset += 4;
      lightData.set(light.direction as Float32Array, offset);
      offset += 4;
      lightData[offset] = 0;
      lightData[offset + 1] = light.intensity;
      lightData[offset + 2] = 0;
      lightData[offset + 3] = 0;
      offset += 4;
      lightIndex++;
    }

    for (const light of this.pointLights) {
      lightData.set(light.position as Float32Array, offset);
      lightData[offset + 3] = 1.0;
      offset += 4;
      lightData.set(light.color as Float32Array, offset);
      lightData[offset + 3] = 1.0;
      offset += 4;
      lightData.set([0, 0, 0, 0], offset);
      offset += 4;
      lightData[offset] = 1;
      lightData[offset + 1] = light.intensity;
      lightData[offset + 2] = light.range;
      lightData[offset + 3] = 0;
      offset += 4;
      lightIndex++;
    }

    for (const light of this.spotLights) {
      lightData.set(light.position as Float32Array, offset);
      lightData[offset + 3] = 1.0;
      offset += 4;
      lightData.set(light.color as Float32Array, offset);
      lightData[offset + 3] = 1.0;
      offset += 4;
      lightData.set(light.direction as Float32Array, offset);
      lightData[offset + 3] = light.spotInnerAngle;
      offset += 4;
      lightData[offset] = 2;
      lightData[offset + 1] = light.intensity;
      lightData[offset + 2] = light.range;
      lightData[offset + 3] = light.spotAngle;
      offset += 4;
      lightIndex++;
    }

    device.queue.writeBuffer(this.lightDataBuffer!, 0, lightData);
  }

  updateMaterialData(): void {
    const device = this.device!;

    if (this.materials.length === 0) return;

    const materialData = new Float32Array(this.materials.length * 16);
    let offset = 0;

    for (const material of this.materials) {
      materialData.set(material.baseColor as Float32Array, offset);
      offset += 4;
      materialData[offset] = material.metallic;
      materialData[offset + 1] = material.roughness;
      materialData[offset + 2] = material.emissiveIntensity;
      offset += 4;
      materialData.set(material.emissiveColor as Float32Array, offset);
      offset += 4;
      materialData[offset] = material.materialType;
      offset += 4;
    }

    device.queue.writeBuffer(this.materialDataBuffer!, 0, materialData);
  }

  updateInstanceData(): void {
    const device = this.device!;

    if (this.instances.length === 0) return;

    const instanceData = new Float32Array(this.instances.length * 36);
    let offset = 0;

    for (const instance of this.instances) {
      instanceData.set(instance.modelMatrix as Float32Array, offset);
      offset += 16;
      instanceData.set(instance.normalMatrix as Float32Array, offset);
      offset += 16;
      instanceData[offset] = instance.materialIndex;
      offset += 4;
    }

    device.queue.writeBuffer(this.instanceDataBuffer!, 0, instanceData);
    device.queue.writeBuffer(this.shadowInstanceDataBuffer!, 0, instanceData);
  }

  resize(width: number, height: number): void {
    if (this.size.width === width && this.size.height === height) {
      return;
    }

    this.size = { width, height };
    this.canvas.width = width;
    this.canvas.height = height;

    this.context.configure({
      device: this.device!,
      format: this.format,
      alphaMode: 'opaque',
    });

    this.createDepthTexture();

    const tileCountX = Math.ceil(this.size.width / this.config.tileSize);
    const tileCountY = Math.ceil(this.size.height / this.config.tileSize);
    const tileDataSize = tileCountX * tileCountY * (4 + 32 * 4);

    if (this.tileDataBuffer) {
      this.tileDataBuffer.destroy();
    }

    this.tileDataBuffer = this.device!.createBuffer({
      size: Math.max(tileDataSize, 65536),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      label: 'Tile Data Buffer',
    });
  }

  render(
    viewMatrix: mat4,
    projMatrix: mat4,
    cameraPosition: vec3
  ): void {
    if (!this.initialized) return;

    const device = this.device!;
    const commandEncoder = device.createCommandEncoder({
      label: 'Main Command Encoder',
    });

    const viewProjMatrix = mat4.create();
    mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

    const invViewMatrix = mat4.create();
    mat4.invert(invViewMatrix, viewMatrix);

    const invProjMatrix = mat4.create();
    mat4.invert(invProjMatrix, projMatrix);

    const ubo: UniformBufferObject = {
      viewMatrix,
      projMatrix,
      viewProjMatrix,
      invViewMatrix,
      invProjMatrix,
      cameraPosition: vec4.fromValues(
        cameraPosition[0],
        cameraPosition[1],
        cameraPosition[2],
        this.size.width
      ),
      lightCount: 0,
      padding: [this.size.height, 0, 0],
    };

    this.updateUniforms(ubo);
    this.updateLightData();
    this.updateMaterialData();
    this.updateInstanceData();

    const tileCountX = Math.ceil(this.size.width / this.config.tileSize);
    const tileCountY = Math.ceil(this.size.height / this.config.tileSize);

    const computePass = commandEncoder.beginComputePass({
      label: 'Light Culling Compute Pass',
    });

    computePass.setPipeline(this.lightCullingPipeline!);
    computePass.setBindGroup(0, this.computeBindGroup!);
    computePass.dispatchWorkgroups(tileCountX, tileCountY, 1);
    computePass.end();

    const shadowPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.shadowMapView!,
          clearValue: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.shadowDepthView!,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
      label: 'Shadow Render Pass',
    });

    shadowPass.setPipeline(this.shadowPipeline!);
    shadowPass.setBindGroup(0, this.shadowBindGroup!);

    for (let i = 0; i < this.instances.length; i++) {
      const instance = this.instances[i];
      const mesh = this.meshes[instance.meshIndex];

      shadowPass.setVertexBuffer(0, mesh.vertexBuffer);
      shadowPass.setIndexBuffer(mesh.indexBuffer, 'uint32');
      shadowPass.drawIndexed(mesh.indexCount, 1, 0, 0, i);
    }

    shadowPass.end();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTextureView!,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
      label: 'Main Render Pass',
    });

    renderPass.setPipeline(this.renderPipeline!);
    renderPass.setBindGroup(0, this.renderBindGroup!);

    for (let i = 0; i < this.instances.length; i++) {
      const instance = this.instances[i];
      const mesh = this.meshes[instance.meshIndex];

      renderPass.setVertexBuffer(0, mesh.vertexBuffer);
      renderPass.setIndexBuffer(mesh.indexBuffer, 'uint32');
      renderPass.drawIndexed(mesh.indexCount, 1, 0, 0, i);
    }

    renderPass.end();

    const commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getDevice(): GPUDevice | null {
    return this.device;
  }

  getSize(): { width: number; height: number } {
    return this.size;
  }
}
