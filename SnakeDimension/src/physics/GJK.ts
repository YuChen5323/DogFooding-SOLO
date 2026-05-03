import { vec3 } from 'gl-matrix';

export interface SupportFunction {
  (direction: vec3): vec3;
}

export class Simplex {
  private points: vec3[] = [];

  constructor(points: vec3[] = []) {
    this.points = points.map((p) => vec3.clone(p));
  }

  add(point: vec3): void {
    this.points.push(vec3.clone(point));
  }

  get(index: number): vec3 | null {
    if (index < 0 || index >= this.points.length) {
      return null;
    }
    return vec3.clone(this.points[index]);
  }

  getLast(): vec3 | null {
    if (this.points.length === 0) {
      return null;
    }
    return vec3.clone(this.points[this.points.length - 1]);
  }

  size(): number {
    return this.points.length;
  }

  toArray(): vec3[] {
    return this.points.map((p) => vec3.clone(p));
  }

  setFromArray(points: vec3[]): void {
    this.points = points.map((p) => vec3.clone(p));
  }
}

export function gjk(
  supportA: SupportFunction,
  supportB: SupportFunction,
  maxIterations: number = 64
): { collision: boolean; simplex: Simplex } {
  const direction = vec3.fromValues(1, 0, 0);

  const a = vec3.create();
  vec3.subtract(a, supportA(direction), supportB(negateDirection(direction)));

  const simplex = new Simplex([a]);

  vec3.negate(direction, a);

  for (let i = 0; i < maxIterations; i++) {
    const newPoint = vec3.create();
    vec3.subtract(
      newPoint,
      supportA(direction),
      supportB(negateDirection(direction))
    );

    if (vec3.dot(newPoint, direction) < 0) {
      return { collision: false, simplex };
    }

    simplex.add(newPoint);

    if (handleSimplex(simplex, direction)) {
      return { collision: true, simplex };
    }
  }

  return { collision: false, simplex };
}

function handleSimplex(simplex: Simplex, direction: vec3): boolean {
  const size = simplex.size();

  if (size === 2) {
    return handleLine(simplex, direction);
  } else if (size === 3) {
    return handleTriangle(simplex, direction);
  } else if (size === 4) {
    return handleTetrahedron(simplex, direction);
  }

  return false;
}

function handleLine(simplex: Simplex, direction: vec3): boolean {
  const b = simplex.get(0)!;
  const a = simplex.get(1)!;

  const ab = vec3.subtract(vec3.create(), b, a);
  const ao = vec3.negate(vec3.create(), a);

  const abDotAo = vec3.dot(ab, ao);

  if (abDotAo > 0) {
    const abXao = vec3.cross(vec3.create(), ab, ao);
    vec3.cross(direction, abXao, ab);
    simplex.setFromArray([b, a]);
  } else {
    vec3.copy(direction, ao);
    simplex.setFromArray([a]);
  }

  return false;
}

function handleTriangle(simplex: Simplex, direction: vec3): boolean {
  const c = simplex.get(0)!;
  const b = simplex.get(1)!;
  const a = simplex.get(2)!;

  const ab = vec3.subtract(vec3.create(), b, a);
  const ac = vec3.subtract(vec3.create(), c, a);
  const ao = vec3.negate(vec3.create(), a);

  const abXac = vec3.cross(vec3.create(), ab, ac);

  const acXab = vec3.cross(vec3.create(), ac, ab);
  const acXabXac = vec3.cross(vec3.create(), acXab, ac);
  const acXabXacDotAo = vec3.dot(acXabXac, ao);

  if (acXabXacDotAo > 0) {
    const acDotAo = vec3.dot(ac, ao);

    if (acDotAo > 0) {
      const acXao = vec3.cross(vec3.create(), ac, ao);
      vec3.cross(direction, acXao, ac);
      simplex.setFromArray([c, a]);
    } else {
      const abDotAo = vec3.dot(ab, ao);

      if (abDotAo > 0) {
        const abXao = vec3.cross(vec3.create(), ab, ao);
        vec3.cross(direction, abXao, ab);
        simplex.setFromArray([b, a]);
      } else {
        vec3.copy(direction, ao);
        simplex.setFromArray([a]);
      }
    }
  } else {
    const abXabXac = vec3.cross(vec3.create(), ab, abXac);
    const abXabXacDotAo = vec3.dot(abXabXac, ao);

    if (abXabXacDotAo > 0) {
      const abDotAo = vec3.dot(ab, ao);

      if (abDotAo > 0) {
        const abXao = vec3.cross(vec3.create(), ab, ao);
        vec3.cross(direction, abXao, ab);
        simplex.setFromArray([b, a]);
      } else {
        vec3.copy(direction, ao);
        simplex.setFromArray([a]);
      }
    } else {
      const abXacDotAo = vec3.dot(abXac, ao);

      if (abXacDotAo > 0) {
        vec3.copy(direction, abXac);
        simplex.setFromArray([c, b, a]);
      } else {
        vec3.negate(direction, abXac);
        simplex.setFromArray([b, c, a]);
      }
    }
  }

  return false;
}

function handleTetrahedron(simplex: Simplex, direction: vec3): boolean {
  const d = simplex.get(0)!;
  const c = simplex.get(1)!;
  const b = simplex.get(2)!;
  const a = simplex.get(3)!;

  const ab = vec3.subtract(vec3.create(), b, a);
  const ac = vec3.subtract(vec3.create(), c, a);
  const ad = vec3.subtract(vec3.create(), d, a);
  const ao = vec3.negate(vec3.create(), a);

  const abc = vec3.cross(vec3.create(), ab, ac);
  const acd = vec3.cross(vec3.create(), ac, ad);
  const adb = vec3.cross(vec3.create(), ad, ab);

  const abcDotAo = vec3.dot(abc, ao);
  const acdDotAo = vec3.dot(acd, ao);
  const adbDotAo = vec3.dot(adb, ao);

  if (abcDotAo > 0) {
    simplex.setFromArray([c, b, a]);
    return handleTriangle(simplex, direction);
  } else if (acdDotAo > 0) {
    simplex.setFromArray([d, c, a]);
    return handleTriangle(simplex, direction);
  } else if (adbDotAo > 0) {
    simplex.setFromArray([b, d, a]);
    return handleTriangle(simplex, direction);
  }

  return true;
}

function negateDirection(dir: vec3): vec3 {
  const result = vec3.create();
  vec3.negate(result, dir);
  return result;
}

export function createSphereSupport(center: vec3, radius: number): SupportFunction {
  return (direction: vec3): vec3 => {
    const normalizedDir = vec3.clone(direction);
    const length = vec3.length(normalizedDir);

    if (length > 0.0001) {
      vec3.scale(normalizedDir, normalizedDir, 1.0 / length);
    } else {
      vec3.set(normalizedDir, 1, 0, 0);
    }

    const result = vec3.clone(center);
    vec3.scaleAndAdd(result, result, normalizedDir, radius);
    return result;
  };
}

export function createBoxSupport(
  center: vec3,
  halfExtents: vec3
): SupportFunction {
  return (direction: vec3): vec3 => {
    const result = vec3.clone(center);

    if (direction[0] > 0) {
      result[0] += halfExtents[0];
    } else {
      result[0] -= halfExtents[0];
    }

    if (direction[1] > 0) {
      result[1] += halfExtents[1];
    } else {
      result[1] -= halfExtents[1];
    }

    if (direction[2] > 0) {
      result[2] += halfExtents[2];
    } else {
      result[2] -= halfExtents[2];
    }

    return result;
  };
}

export function createCapsuleSupport(
  center: vec3,
  radius: number,
  height: number
): SupportFunction {
  const halfHeight = height / 2;

  return (direction: vec3): vec3 => {
    const normalizedDir = vec3.clone(direction);
    const length = vec3.length(normalizedDir);

    if (length > 0.0001) {
      vec3.scale(normalizedDir, normalizedDir, 1.0 / length);
    } else {
      vec3.set(normalizedDir, 0, 1, 0);
    }

    const yComponent = normalizedDir[1];
    const result = vec3.clone(center);

    if (yComponent > 0.5) {
      result[1] += halfHeight;
    } else if (yComponent < -0.5) {
      result[1] -= halfHeight;
    } else {
      const radialDir = vec3.fromValues(normalizedDir[0], 0, normalizedDir[2]);
      const radialLength = vec3.length(radialDir);

      if (radialLength > 0.0001) {
        vec3.scale(radialDir, radialDir, 1.0 / radialLength);
        vec3.scaleAndAdd(result, result, radialDir, radius);
      }
    }

    vec3.scaleAndAdd(result, result, normalizedDir, radius);
    return result;
  };
}

export function createConvexMeshSupport(
  vertices: vec3[],
  center: vec3 = vec3.create()
): SupportFunction {
  return (direction: vec3): vec3 => {
    if (vertices.length === 0) {
      return vec3.clone(center);
    }

    let maxDot = -Infinity;
    let farthestVertex = vertices[0];

    for (const vertex of vertices) {
      const dot = vec3.dot(vertex, direction);
      if (dot > maxDot) {
        maxDot = dot;
        farthestVertex = vertex;
      }
    }

    const result = vec3.clone(center);
    vec3.add(result, result, farthestVertex);
    return result;
  };
}

export class EPA {
  private tolerance: number;
  private maxIterations: number;

  constructor(tolerance: number = 0.0001, maxIterations: number = 64) {
    this.tolerance = tolerance;
    this.maxIterations = maxIterations;
  }

  expand(
    simplex: Simplex,
    supportA: SupportFunction,
    supportB: SupportFunction
  ): { distance: number; normal: vec3 } {
    const points = simplex.toArray();

    if (points.length < 4) {
      return { distance: 0, normal: vec3.create() };
    }

    const faces = [
      [0, 1, 2],
      [0, 3, 1],
      [0, 2, 3],
      [1, 3, 2],
    ];

    const faceNormals: vec3[] = [];
    const faceDistances: number[] = [];

    for (const face of faces) {
      const a = points[face[0]];
      const b = points[face[1]];
      const c = points[face[2]];

      const ab = vec3.subtract(vec3.create(), b, a);
      const ac = vec3.subtract(vec3.create(), c, a);

      const normal = vec3.cross(vec3.create(), ab, ac);
      const length = vec3.length(normal);

      if (length < 0.0001) {
        faceNormals.push(vec3.fromValues(0, 0, 1));
        faceDistances.push(0);
        continue;
      }

      vec3.scale(normal, normal, 1.0 / length);

      const distance = vec3.dot(normal, a);

      if (distance < 0) {
        vec3.negate(normal, normal);
        faceNormals.push(normal);
        faceDistances.push(-distance);
      } else {
        faceNormals.push(normal);
        faceDistances.push(distance);
      }
    }

    for (let i = 0; i < this.maxIterations; i++) {
      let minDistance = Infinity;
      let minIndex = 0;

      for (let j = 0; j < faces.length; j++) {
        if (faceDistances[j] < minDistance) {
          minDistance = faceDistances[j];
          minIndex = j;
        }
      }

      const searchDir = faceNormals[minIndex];

      const newPoint = vec3.create();
      vec3.subtract(
        newPoint,
        supportA(searchDir),
        supportB(negateDirection(searchDir))
      );

      const newDistance = vec3.dot(searchDir, newPoint);

      if (newDistance - minDistance < this.tolerance) {
        return {
          distance: minDistance,
          normal: vec3.clone(searchDir),
        };
      }

      points.push(newPoint);

      const uniqueEdges: [number, number][] = [];

      for (let j = faces.length - 1; j >= 0; j--) {
        const normal = faceNormals[j];
        const face = faces[j];

        const dot = vec3.dot(
          normal,
          vec3.subtract(vec3.create(), newPoint, points[face[0]])
        );

        if (dot > 0) {
          addEdge(uniqueEdges, face[0], face[1]);
          addEdge(uniqueEdges, face[1], face[2]);
          addEdge(uniqueEdges, face[2], face[0]);

          faces.splice(j, 1);
          faceNormals.splice(j, 1);
          faceDistances.splice(j, 1);
        }
      }

      for (const edge of uniqueEdges) {
        const newFace = [edge[0], edge[1], points.length - 1];
        faces.push(newFace);

        const a = points[newFace[0]];
        const b = points[newFace[1]];
        const c = points[newFace[2]];

        const ab = vec3.subtract(vec3.create(), b, a);
        const ac = vec3.subtract(vec3.create(), c, a);

        const normal = vec3.cross(vec3.create(), ab, ac);
        const length = vec3.length(normal);

        if (length < 0.0001) {
          faceNormals.push(vec3.fromValues(0, 0, 1));
          faceDistances.push(0);
          continue;
        }

        vec3.scale(normal, normal, 1.0 / length);

        const distance = vec3.dot(normal, a);

        if (distance < 0) {
          vec3.negate(normal, normal);
          faceNormals.push(normal);
          faceDistances.push(-distance);
        } else {
          faceNormals.push(normal);
          faceDistances.push(distance);
        }
      }
    }

    let minDistance = Infinity;
    let minIndex = 0;

    for (let j = 0; j < faces.length; j++) {
      if (faceDistances[j] < minDistance) {
        minDistance = faceDistances[j];
        minIndex = j;
      }
    }

    return {
      distance: minDistance,
      normal: vec3.clone(faceNormals[minIndex]),
    };
  }
}

function addEdge(edges: [number, number][], a: number, b: number): void {
  for (let i = edges.length - 1; i >= 0; i--) {
    const edge = edges[i];
    if ((edge[0] === a && edge[1] === b) || (edge[0] === b && edge[1] === a)) {
      edges.splice(i, 1);
      return;
    }
  }
  edges.push([a, b]);
}

export function gjkWithEPA(
  supportA: SupportFunction,
  supportB: SupportFunction,
  maxIterations: number = 64
): { collision: boolean; distance: number; normal: vec3 } {
  const result = gjk(supportA, supportB, maxIterations);

  if (!result.collision) {
    return { collision: false, distance: 0, normal: vec3.create() };
  }

  const epa = new EPA();
  const epaResult = epa.expand(result.simplex, supportA, supportB);

  return {
    collision: true,
    distance: epaResult.distance,
    normal: epaResult.normal,
  };
}
