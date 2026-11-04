import * as THREE from 'three';
import type { Floor, Wall, Point } from '$lib/models/types';
import { getWallStartHeight, getWallEndHeight } from '$lib/models/types';

export const WALL_JOIN_TOLERANCE = 2; // cm
const WALL_THICKNESS = 15;
const BASEBOARD_HEIGHT = 10;

export interface WallEndpointInfo {
  wall: Wall;
  isStart: boolean;
  dir: Point;
  thickness: number;
  height: number;
  exteriorMat?: THREE.Material;
}

export function getWallEndpointDir(wall: Wall, isStart: boolean): Point {
  if (wall.curvePoint) {
    const cp = wall.curvePoint;
    const dx = isStart ? cp.x - wall.start.x : wall.end.x - cp.x;
    const dy = isStart ? cp.y - wall.start.y : wall.end.y - cp.y;
    const len = Math.hypot(dx, dy) || 1;
    return isStart ? { x: dx / len, y: dy / len } : { x: -dx / len, y: -dy / len };
  }
  const dx = wall.end.x - wall.start.x;
  const dy = wall.end.y - wall.start.y;
  const len = Math.hypot(dx, dy) || 1;
  return isStart ? { x: dx / len, y: dy / len } : { x: -dx / len, y: -dy / len };
}

export function solveCornerMiter(
  P: Point,
  dirA: Point,
  tA: number,
  dirB: Point,
  tB: number,
  vMid: Point
): { pA: Point; M: Point; pB: Point } | null {
  const getNormal = (dir: Point): Point => {
    const n = { x: -dir.y, y: dir.x };
    return n.x * vMid.x + n.y * vMid.y >= 0 ? n : { x: dir.y, y: -dir.x };
  };

  const nA = getNormal(dirA);
  const nB = getNormal(dirB);

  const pA = { x: P.x + (tA / 2) * nA.x, y: P.y + (tA / 2) * nA.y };
  const pB = { x: P.x + (tB / 2) * nB.x, y: P.y + (tB / 2) * nB.y };

  // Solve line intersection: pA + s * dirA = pB + u * dirB
  const denom = dirA.x * dirB.y - dirA.y * dirB.x;
  if (Math.abs(denom) < 1e-4) return null;
  const s = ((pB.x - pA.x) * dirB.y - (pB.y - pA.y) * dirB.x) / denom;
  const M = { x: pA.x + s * dirA.x, y: pA.y + s * dirA.y };

  const distM = Math.hypot(M.x - P.x, M.y - P.y);
  if (distM > Math.max(tA, tB) * 4) return null;

  return { pA, M, pB };
}

export function createCornerPrismGeometry(
  poly: Point[],
  bottomY: number,
  topY: number
): THREE.BufferGeometry {
  // In 3D: 2D X is 3D X, 2D Y is 3D Z. Height is along +Y.
  // In (X, Z) with Y pointing up, counter-clockwise viewed from +Y has signedArea < 0.
  const signedArea =
    (poly[1].x - poly[0].x) * (poly[2].y - poly[0].y) -
    (poly[1].y - poly[0].y) * (poly[2].x - poly[0].x);
  const pts = signedArea > 0 ? [poly[0], poly[3], poly[2], poly[1]] : poly;

  const positions: number[] = [];
  const uvs: number[] = [];

  const b = pts.map(p => new THREE.Vector3(p.x, bottomY, p.y));
  const t = pts.map(p => new THREE.Vector3(p.x, topY, p.y));

  // 1. Bottom face (-Y): CCW when viewed from below (-Y)
  positions.push(
    b[0].x, b[0].y, b[0].z,  b[2].x, b[2].y, b[2].z,  b[1].x, b[1].y, b[1].z,
    b[0].x, b[0].y, b[0].z,  b[3].x, b[3].y, b[3].z,  b[2].x, b[2].y, b[2].z
  );
  uvs.push(
    b[0].x / 200, b[0].z / 200,  b[2].x / 200, b[2].z / 200,  b[1].x / 200, b[1].z / 200,
    b[0].x / 200, b[0].z / 200,  b[3].x / 200, b[3].z / 200,  b[2].x / 200, b[2].z / 200
  );

  // 2. Top face (+Y): CCW when viewed from above (+Y)
  positions.push(
    t[0].x, t[0].y, t[0].z,  t[1].x, t[1].y, t[1].z,  t[2].x, t[2].y, t[2].z,
    t[0].x, t[0].y, t[0].z,  t[2].x, t[2].y, t[2].z,  t[3].x, t[3].y, t[3].z
  );
  uvs.push(
    t[0].x / 200, t[0].z / 200,  t[1].x / 200, t[1].z / 200,  t[2].x / 200, t[2].z / 200,
    t[0].x / 200, t[0].z / 200,  t[2].x / 200, t[2].z / 200,  t[3].x / 200, t[3].z / 200
  );

  // 3. Side faces: CCW when viewed from exterior of prism
  const addQuad = (v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, u0: number, u1: number) => {
    // 2 triangles: v0 -> v1 -> v2 and v0 -> v2 -> v3
    positions.push(
      v0.x, v0.y, v0.z,  v1.x, v1.y, v1.z,  v2.x, v2.y, v2.z,
      v0.x, v0.y, v0.z,  v2.x, v2.y, v2.z,  v3.x, v3.y, v3.z
    );
    const vBottom = bottomY / 200;
    const vTop = topY / 200;
    uvs.push(
      u0, vBottom,  u1, vBottom,  u1, vTop,
      u0, vBottom,  u1, vTop,     u0, vTop
    );
  };

  let currentU = 0;
  for (let i = 0; i < 4; i++) {
    const next = (i + 1) % 4;
    const edgeLen = Math.hypot(b[next].x - b[i].x, b[next].z - b[i].z);
    const nextU = currentU + edgeLen / 200;
    // Quad from b[i] to b[next], t[next], t[i]
    addQuad(b[i], b[next], t[next], t[i], currentU, nextU);
    currentU = nextU;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

  // Groups: 0 = bottom, 1 = top, 2 = sides
  geo.addGroup(0, 6, 0);   // Bottom face
  geo.addGroup(6, 6, 1);   // Top face
  geo.addGroup(12, 24, 2); // 4 Side faces

  geo.computeVertexNormals();
  return geo;
}

export function buildWallJoints3D(
  floor: Floor,
  wallGroup: THREE.Group,
  options?: {
    exteriorMatMap?: Map<string, THREE.Material>;
    interiorMat?: THREE.Material;
    baseboardMat?: THREE.Material;
    defaultMat?: THREE.Material;
  }
): void {
  const defaultExteriorMat =
    options?.defaultMat ??
    new THREE.MeshStandardMaterial({ color: 0xd4cfc9, roughness: 0.85 });
  const interiorMat =
    options?.interiorMat ??
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const baseboardMat = options?.baseboardMat;

  // Group wall endpoints by joint location (within tolerance)
  const joints: { point: Point; endpoints: WallEndpointInfo[] }[] = [];

  for (const wall of floor.walls) {
    const startH = getWallStartHeight(wall);
    const endH = getWallEndHeight(wall);
    const thickness = Math.max(wall.thickness, WALL_THICKNESS);
    const exteriorMat = options?.exteriorMatMap?.get(wall.id) ?? defaultExteriorMat;

    for (const isStart of [true, false]) {
      const ep = isStart ? wall.start : wall.end;
      const height = isStart ? startH : endH;
      const dir = getWallEndpointDir(wall, isStart);

      let joint = joints.find(
        j => Math.hypot(j.point.x - ep.x, j.point.y - ep.y) <= WALL_JOIN_TOLERANCE
      );
      if (!joint) {
        joint = { point: { x: ep.x, y: ep.y }, endpoints: [] };
        joints.push(joint);
      }
      joint.endpoints.push({ wall, isStart, dir, thickness, height, exteriorMat });
    }
  }

  for (const { point: P, endpoints } of joints) {
    if (endpoints.length < 2) continue;

    // Sort endpoints cyclically by direction angle around P
    const sorted = [...endpoints]
      .map(ep => ({
        ...ep,
        angle: (Math.atan2(ep.dir.y, ep.dir.x) + 2 * Math.PI) % (2 * Math.PI),
      }))
      .sort((a, b) => a.angle - b.angle);

    const n = sorted.length;
    for (let i = 0; i < n; i++) {
      const wA = sorted[i];
      const wB = sorted[(i + 1) % n];
      const diff = (wB.angle - wA.angle + 2 * Math.PI) % (2 * Math.PI);

      // Only an angle > 180° forms an exterior reflex corner with a missing notch
      if (diff > Math.PI + 0.005) {
        const midAngle = (wA.angle + diff / 2) % (2 * Math.PI);
        const vMid = { x: Math.cos(midAngle), y: Math.sin(midAngle) };

        // 1. Solve wall corner miter
        const miter = solveCornerMiter(P, wA.dir, wA.thickness, wB.dir, wB.thickness, vMid);
        if (miter) {
          const jointHeight = Math.max(wA.height, wB.height);
          const prismGeo = createCornerPrismGeometry([P, miter.pA, miter.M, miter.pB], 0, jointHeight);
          const mat = wA.exteriorMat ?? wB.exteriorMat ?? defaultExteriorMat;
          const materials = [interiorMat, interiorMat, mat];
          const mesh = new THREE.Mesh(prismGeo, materials);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData.xray = true;
          wallGroup.add(mesh);

          // 2. Baseboard corner miter (if baseboard enabled and height qualifies)
          if (baseboardMat && jointHeight >= BASEBOARD_HEIGHT) {
            const bbMiter = solveCornerMiter(
              P,
              wA.dir,
              wA.thickness + 2,
              wB.dir,
              wB.thickness + 2,
              vMid
            );
            if (bbMiter) {
              const bbGeo = createCornerPrismGeometry(
                [P, bbMiter.pA, bbMiter.M, bbMiter.pB],
                0,
                BASEBOARD_HEIGHT
              );
              const bbMesh = new THREE.Mesh(bbGeo, [baseboardMat, baseboardMat, baseboardMat]);
              bbMesh.castShadow = true;
              bbMesh.userData.xray = true;
              wallGroup.add(bbMesh);
            }
          }
        }
      }
    }
  }
}

