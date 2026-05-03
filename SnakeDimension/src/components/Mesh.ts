import { IComponent } from '../ecs';

export interface Vertex {
  position: [number, number, number];
  normal: [number, number, number];
  uv: [number, number];
  color: [number, number, number, number];
}

export interface MeshData {
  vertices: Vertex[];
  indices: number[];
  vertexBuffer?: GPUBuffer;
  indexBuffer?: GPUBuffer;
  indexCount: number;
}

export interface MeshComponent extends IComponent {
  type: 'Mesh';
  meshData: MeshData;
  visible: boolean;
  castShadow: boolean;
  receiveShadow: boolean;
}

export function createMesh(meshData: MeshData): MeshComponent {
  return {
    type: 'Mesh',
    meshData,
    visible: true,
    castShadow: true,
    receiveShadow: true,
  };
}

export function createBoxMesh(width: number, height: number, depth: number): MeshData {
  const w = width / 2;
  const h = height / 2;
  const d = depth / 2;

  const vertices: Vertex[] = [
    // Front
    { position: [-w, -h, d], normal: [0, 0, 1], uv: [0, 0], color: [1, 1, 1, 1] },
    { position: [w, -h, d], normal: [0, 0, 1], uv: [1, 0], color: [1, 1, 1, 1] },
    { position: [w, h, d], normal: [0, 0, 1], uv: [1, 1], color: [1, 1, 1, 1] },
    { position: [-w, h, d], normal: [0, 0, 1], uv: [0, 1], color: [1, 1, 1, 1] },
    // Back
    { position: [-w, -h, -d], normal: [0, 0, -1], uv: [0, 0], color: [1, 1, 1, 1] },
    { position: [-w, h, -d], normal: [0, 0, -1], uv: [0, 1], color: [1, 1, 1, 1] },
    { position: [w, h, -d], normal: [0, 0, -1], uv: [1, 1], color: [1, 1, 1, 1] },
    { position: [w, -h, -d], normal: [0, 0, -1], uv: [1, 0], color: [1, 1, 1, 1] },
    // Top
    { position: [-w, h, -d], normal: [0, 1, 0], uv: [0, 0], color: [1, 1, 1, 1] },
    { position: [-w, h, d], normal: [0, 1, 0], uv: [0, 1], color: [1, 1, 1, 1] },
    { position: [w, h, d], normal: [0, 1, 0], uv: [1, 1], color: [1, 1, 1, 1] },
    { position: [w, h, -d], normal: [0, 1, 0], uv: [1, 0], color: [1, 1, 1, 1] },
    // Bottom
    { position: [-w, -h, -d], normal: [0, -1, 0], uv: [0, 0], color: [1, 1, 1, 1] },
    { position: [w, -h, -d], normal: [0, -1, 0], uv: [1, 0], color: [1, 1, 1, 1] },
    { position: [w, -h, d], normal: [0, -1, 0], uv: [1, 1], color: [1, 1, 1, 1] },
    { position: [-w, -h, d], normal: [0, -1, 0], uv: [0, 1], color: [1, 1, 1, 1] },
    // Right
    { position: [w, -h, -d], normal: [1, 0, 0], uv: [0, 0], color: [1, 1, 1, 1] },
    { position: [w, h, -d], normal: [1, 0, 0], uv: [0, 1], color: [1, 1, 1, 1] },
    { position: [w, h, d], normal: [1, 0, 0], uv: [1, 1], color: [1, 1, 1, 1] },
    { position: [w, -h, d], normal: [1, 0, 0], uv: [1, 0], color: [1, 1, 1, 1] },
    // Left
    { position: [-w, -h, -d], normal: [-1, 0, 0], uv: [0, 0], color: [1, 1, 1, 1] },
    { position: [-w, -h, d], normal: [-1, 0, 0], uv: [1, 0], color: [1, 1, 1, 1] },
    { position: [-w, h, d], normal: [-1, 0, 0], uv: [1, 1], color: [1, 1, 1, 1] },
    { position: [-w, h, -d], normal: [-1, 0, 0], uv: [0, 1], color: [1, 1, 1, 1] },
  ];

  const indices: number[] = [
    0, 1, 2, 0, 2, 3,
    4, 5, 6, 4, 6, 7,
    8, 9, 10, 8, 10, 11,
    12, 13, 14, 12, 14, 15,
    16, 17, 18, 16, 18, 19,
    20, 21, 22, 20, 22, 23,
  ];

  return {
    vertices,
    indices,
    indexCount: indices.length,
  };
}

export function createSphereMesh(radius: number, segments: number, rings: number): MeshData {
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  for (let y = 0; y <= rings; y++) {
    const phi = (y / rings) * Math.PI;
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);

    for (let x = 0; x <= segments; x++) {
      const theta = (x / segments) * Math.PI * 2;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      const nx = cosTheta * sinPhi;
      const ny = cosPhi;
      const nz = sinTheta * sinPhi;

      vertices.push({
        position: [nx * radius, ny * radius, nz * radius],
        normal: [nx, ny, nz],
        uv: [x / segments, y / rings],
        color: [1, 1, 1, 1],
      });
    }
  }

  for (let y = 0; y < rings; y++) {
    for (let x = 0; x < segments; x++) {
      const a = y * (segments + 1) + x;
      const b = a + segments + 1;

      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  return {
    vertices,
    indices,
    indexCount: indices.length,
  };
}

export function createPlaneMesh(width: number, depth: number): MeshData {
  const w = width / 2;
  const d = depth / 2;

  const vertices: Vertex[] = [
    { position: [-w, 0, -d], normal: [0, 1, 0], uv: [0, 0], color: [1, 1, 1, 1] },
    { position: [w, 0, -d], normal: [0, 1, 0], uv: [1, 0], color: [1, 1, 1, 1] },
    { position: [w, 0, d], normal: [0, 1, 0], uv: [1, 1], color: [1, 1, 1, 1] },
    { position: [-w, 0, d], normal: [0, 1, 0], uv: [0, 1], color: [1, 1, 1, 1] },
  ];

  const indices: number[] = [0, 1, 2, 0, 2, 3];

  return {
    vertices,
    indices,
    indexCount: indices.length,
  };
}
