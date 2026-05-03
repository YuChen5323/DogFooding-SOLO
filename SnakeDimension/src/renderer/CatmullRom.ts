import { vec3 } from 'gl-matrix';
import { MeshData, Vertex } from '../components/Mesh';

export function catmullRom(
  p0: vec3,
  p1: vec3,
  p2: vec3,
  p3: vec3,
  t: number
): vec3 {
  const t2 = t * t;

  const v0 = vec3.subtract(vec3.create(), p2, p0);
  vec3.scale(v0, v0, 0.5);

  const v1 = vec3.subtract(vec3.create(), p3, p1);
  vec3.scale(v1, v1, 0.5);

  const a = vec3.create();
  vec3.scale(a, p1, 2.0);
  vec3.subtract(a, a, p2);
  vec3.add(a, a, v0);

  const b = vec3.create();
  vec3.scale(b, p1, -2.0);
  vec3.add(b, b, p2);
  vec3.subtract(b, b, v0);
  vec3.subtract(b, b, v1);

  const result = vec3.create();
  vec3.scale(result, p1, 1.0 - t);
  vec3.scaleAndAdd(result, result, p2, t);
  vec3.scaleAndAdd(result, result, a, t * (1.0 - t));
  vec3.scaleAndAdd(result, result, b, t2 * (1.0 - t));

  return result;
}

export function catmullRomDerivative(
  p0: vec3,
  p1: vec3,
  p2: vec3,
  p3: vec3,
  t: number
): vec3 {
  const v0 = vec3.subtract(vec3.create(), p2, p0);
  vec3.scale(v0, v0, 0.5);

  const v1 = vec3.subtract(vec3.create(), p3, p1);
  vec3.scale(v1, v1, 0.5);

  const d = vec3.subtract(vec3.create(), p2, p1);
  
  const a = vec3.create();
  vec3.scale(a, p1, 2.0);
  vec3.subtract(a, a, p2);
  vec3.add(a, a, v0);

  const b = vec3.create();
  vec3.scale(b, p1, -2.0);
  vec3.add(b, b, p2);
  vec3.subtract(b, b, v0);
  vec3.subtract(b, b, v1);

  const result = vec3.create();
  vec3.copy(result, d);
  
  const term1 = vec3.create();
  vec3.scale(term1, a, 1.0 - 2.0 * t);
  
  const term2 = vec3.create();
  vec3.scale(term2, b, t * (2.0 - 3.0 * t));

  vec3.add(result, result, term1);
  vec3.add(result, result, term2);

  return result;
}

export class CatmullRomPath {
  private controlPoints: vec3[] = [];
  private tensions: number[] = [];

  constructor(points: vec3[] = [], tension: number = 0.5) {
    this.controlPoints = points.map((p) => vec3.clone(p));
    this.tensions = points.map(() => tension);
  }

  addPoint(point: vec3, tension: number = 0.5): void {
    this.controlPoints.push(vec3.clone(point));
    this.tensions.push(tension);
  }

  getPointCount(): number {
    return this.controlPoints.length;
  }

  getControlPoint(index: number): vec3 | null {
    if (index < 0 || index >= this.controlPoints.length) {
      return null;
    }
    return vec3.clone(this.controlPoints[index]);
  }

  setControlPoint(index: number, point: vec3): void {
    if (index >= 0 && index < this.controlPoints.length) {
      vec3.copy(this.controlPoints[index], point);
    }
  }

  getPointAt(t: number): vec3 {
    const n = this.controlPoints.length;
    if (n === 0) {
      return vec3.create();
    }
    if (n === 1) {
      return vec3.clone(this.controlPoints[0]);
    }

    const clampedT = Math.max(0, Math.min(1, t));
    const segment = (n - 1) * clampedT;
    const segmentIndex = Math.floor(segment);
    const localT = segment - segmentIndex;

    const p0 = this.getPointClamped(segmentIndex - 1);
    const p1 = this.controlPoints[segmentIndex];
    const p2 = this.controlPoints[Math.min(segmentIndex + 1, n - 1)];
    const p3 = this.getPointClamped(segmentIndex + 2);

    return catmullRom(p0, p1, p2, p3, localT);
  }

  getTangentAt(t: number): vec3 {
    const n = this.controlPoints.length;
    if (n < 2) {
      return vec3.fromValues(1, 0, 0);
    }

    const clampedT = Math.max(0, Math.min(1, t));
    const segment = (n - 1) * clampedT;
    const segmentIndex = Math.floor(segment);
    const localT = segment - segmentIndex;

    const p0 = this.getPointClamped(segmentIndex - 1);
    const p1 = this.controlPoints[segmentIndex];
    const p2 = this.controlPoints[Math.min(segmentIndex + 1, n - 1)];
    const p3 = this.getPointClamped(segmentIndex + 2);

    const derivative = catmullRomDerivative(p0, p1, p2, p3, localT);
    const length = vec3.length(derivative);

    if (length > 0.0001) {
      vec3.scale(derivative, derivative, 1.0 / length);
    }

    return derivative;
  }

  getNormalAt(t: number, up: vec3 = vec3.fromValues(0, 1, 0)): vec3 {
    const tangent = this.getTangentAt(t);
    const normal = vec3.create();

    const dot = vec3.dot(tangent, up);
    if (Math.abs(dot) > 0.999) {
      const tempUp = vec3.fromValues(1, 0, 0);
      vec3.cross(normal, tangent, tempUp);
    } else {
      vec3.cross(normal, tangent, up);
    }

    vec3.normalize(normal, normal);
    return normal;
  }

  getBinormalAt(t: number, up: vec3 = vec3.fromValues(0, 1, 0)): vec3 {
    const tangent = this.getTangentAt(t);
    const normal = this.getNormalAt(t, up);
    const binormal = vec3.create();

    vec3.cross(binormal, normal, tangent);
    vec3.normalize(binormal, binormal);
    return binormal;
  }

  private getPointClamped(index: number): vec3 {
    const n = this.controlPoints.length;
    if (index < 0) {
      const p0 = this.controlPoints[0];
      const p1 = this.controlPoints[1];
      const result = vec3.create();
      vec3.scale(result, p0, 2.0);
      vec3.subtract(result, result, p1);
      return result;
    }
    if (index >= n) {
      const p0 = this.controlPoints[n - 2];
      const p1 = this.controlPoints[n - 1];
      const result = vec3.create();
      vec3.scale(result, p1, 2.0);
      vec3.subtract(result, result, p0);
      return result;
    }
    return this.controlPoints[index];
  }

  approximateLength(steps: number = 100): number {
    let length = 0;
    let prevPoint = this.getPointAt(0);

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const point = this.getPointAt(t);
      length += vec3.distance(prevPoint, point);
      prevPoint = point;
    }

    return length;
  }
}

export function createTubeMeshFromPath(
  path: CatmullRomPath,
  radius: number = 0.5,
  radialSegments: number = 16,
  tubularSegments: number = 64,
  _closed: boolean = false
): MeshData {
  const vertices: Vertex[] = [];
  const indices: number[] = [];

  const up = vec3.fromValues(0, 1, 0);

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const position = path.getPointAt(t);
    const normal = path.getNormalAt(t, up);
    const binormal = path.getBinormalAt(t, up);

    for (let j = 0; j <= radialSegments; j++) {
      const angle = (j / radialSegments) * Math.PI * 2;

      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      const vertexNormal = vec3.create();
      vec3.scale(vertexNormal, normal, cosAngle);
      vec3.scaleAndAdd(vertexNormal, vertexNormal, binormal, sinAngle);
      vec3.normalize(vertexNormal, vertexNormal);

      const vertexPosition = vec3.create();
      vec3.copy(vertexPosition, position);
      vec3.scaleAndAdd(vertexPosition, vertexPosition, vertexNormal, radius);

      const uv: [number, number] = [j / radialSegments, t];
      const color: [number, number, number, number] = [1.0, 1.0, 1.0, 1.0];

      vertices.push({
        position: [vertexPosition[0], vertexPosition[1], vertexPosition[2]],
        normal: [vertexNormal[0], vertexNormal[1], vertexNormal[2]],
        uv,
        color,
      });
    }
  }

  for (let i = 0; i < tubularSegments; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const a = i * (radialSegments + 1) + j;
      const b = a + radialSegments + 1;
      const c = a + 1;
      const d = b + 1;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  return {
    vertices,
    indices,
    indexCount: indices.length,
  };
}

export function createSnakeBodyMesh(
  segments: vec3[],
  radius: number = 0.4,
  radialSegments: number = 12,
  tubularSegmentsPerSegment: number = 8
): MeshData {
  if (segments.length < 2) {
    return {
      vertices: [],
      indices: [],
      indexCount: 0,
    };
  }

  const path = new CatmullRomPath(segments);
  const totalTubularSegments = Math.max(
    tubularSegmentsPerSegment * (segments.length - 1),
    16
  );

  return createTubeMeshFromPath(
    path,
    radius,
    radialSegments,
    totalTubularSegments,
    false
  );
}

export function updateSnakeBodyMesh(
  segments: vec3[],
  radius: number = 0.4,
  radialSegments: number = 12,
  tubularSegmentsPerSegment: number = 8
): MeshData {
  return createSnakeBodyMesh(segments, radius, radialSegments, tubularSegmentsPerSegment);
}
