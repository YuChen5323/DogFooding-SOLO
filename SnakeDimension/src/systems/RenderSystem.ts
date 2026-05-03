import { mat4, vec3, vec4 } from 'gl-matrix';
import { World, System } from '../ecs';
import {
  TransformComponent,
  MeshComponent,
  MaterialComponent,
  CameraComponent,
  LightComponent,
} from '../components';
import { WebGPURenderer, RenderMaterial, RenderInstance } from '../renderer/WebGPURenderer';

export class RenderSystem extends System {
  private renderer: WebGPURenderer;
  private canvas: HTMLCanvasElement;
  private meshUploaded: Map<number, number> = new Map();
  private materialUploaded: Map<number, number> = new Map();

  constructor(renderer: WebGPURenderer, canvas: HTMLCanvasElement) {
    super('RenderSystem', 1000);
    this.renderer = renderer;
    this.canvas = canvas;
  }

  onInit(_world: World): void {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      this.canvas.width = width;
      this.canvas.height = height;

      this.renderer.resize(width, height);
    }
  }

  onRender(world: World): void {
    if (!this.renderer.isInitialized()) {
      return;
    }

    this.renderer.clearInstances();
    this.renderer.clearLights();

    const cameraQuery = world.query(['Camera', 'Transform']);
    const cameraEntities = cameraQuery.entities();

    if (cameraEntities.length === 0) {
      return;
    }

    const cameraEntityId = cameraEntities[0];
    const camera = world.getComponent<CameraComponent>(cameraEntityId, 'Camera');
    const cameraTransform = world.getComponent<TransformComponent>(cameraEntityId, 'Transform');

    if (!camera || !cameraTransform) {
      return;
    }

    const meshQuery = world.query(['Mesh', 'Transform', 'Material']);
    const meshEntities = meshQuery.entities();

    for (const entityId of meshEntities) {
      const mesh = world.getComponent<MeshComponent>(entityId, 'Mesh');
      const transform = world.getComponent<TransformComponent>(entityId, 'Transform');
      const material = world.getComponent<MaterialComponent>(entityId, 'Material');

      if (!mesh || !transform || !material) {
        continue;
      }

      if (!this.meshUploaded.has(entityId)) {
        const meshIndex = this.renderer.uploadMesh(mesh.meshData);
        this.meshUploaded.set(entityId, meshIndex);
      }

      if (!this.materialUploaded.has(entityId)) {
        const renderMaterial: RenderMaterial = {
          baseColor: vec4.clone(material.baseColor),
          metallic: material.metallic,
          roughness: material.roughness,
          emissiveColor: vec3.clone(material.emissiveColor),
          emissiveIntensity: material.emissiveIntensity,
          materialType: material.materialType === 'Standard' ? 0 : material.materialType === 'Unlit' ? 1 : 2,
        };
        const materialIndex = this.renderer.uploadMaterial(renderMaterial);
        this.materialUploaded.set(entityId, materialIndex);
      }

      const meshIndex = this.meshUploaded.get(entityId)!;
      const materialIndex = this.materialUploaded.get(entityId)!;

      const normalMatrix = mat4.create();
      mat4.invert(normalMatrix, transform.localMatrix);
      mat4.transpose(normalMatrix, normalMatrix);

      const instance: RenderInstance = {
        modelMatrix: mat4.clone(transform.localMatrix),
        normalMatrix,
        meshIndex,
        materialIndex,
      };

      this.renderer.addInstance(instance);
    }

    const lightQuery = world.query(['Light', 'Transform']);
    const lightEntities = lightQuery.entities();

    for (const entityId of lightEntities) {
      const light = world.getComponent<LightComponent>(entityId, 'Light');
      const transform = world.getComponent<TransformComponent>(entityId, 'Transform');

      if (!light || !transform) {
        continue;
      }

      switch (light.lightType) {
        case 'Directional':
          this.renderer.addDirectionalLight({
            direction: vec3.fromValues(0, 0, -1),
            color: vec3.clone(light.color),
            intensity: light.intensity,
          });
          break;

        case 'Point':
          this.renderer.addPointLight({
            position: vec3.clone(transform.position),
            color: vec3.clone(light.color),
            intensity: light.intensity,
            range: light.range,
          });
          break;

        case 'Spot':
          this.renderer.addSpotLight({
            position: vec3.clone(transform.position),
            direction: vec3.fromValues(0, 0, -1),
            color: vec3.clone(light.color),
            intensity: light.intensity,
            range: light.range,
            spotAngle: light.spotAngle,
            spotInnerAngle: light.spotInnerAngle,
          });
          break;
      }
    }

    const lookAt = vec3.clone(cameraTransform.position);
    const forward = vec3.fromValues(0, 0, -1);
    vec3.transformQuat(forward, forward, cameraTransform.rotation);
    vec3.add(lookAt, lookAt, forward);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, cameraTransform.position, lookAt, vec3.fromValues(0, 1, 0));

    const projMatrix = mat4.create();
    mat4.perspective(
      projMatrix,
      camera.fov,
      camera.aspectRatio,
      camera.near,
      camera.far
    );

    this.renderer.render(viewMatrix, projMatrix, cameraTransform.position);
  }

  getRenderer(): WebGPURenderer {
    return this.renderer;
  }
}
