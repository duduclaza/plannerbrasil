import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { solveCornerMiter, createCornerPrismGeometry, buildWallJoints3D } from '$lib/utils/wallJoints3D';
import type { Floor, Wall } from '$lib/models/types';

describe('wallJoints3D', () => {
  it('solves 90-degree corner miter correctly', () => {
    const P = { x: 100, y: 100 };
    const dirA = { x: -1, y: 0 };
    const dirB = { x: 0, y: 1 };
    const vMid = { x: Math.SQRT1_2, y: -Math.SQRT1_2 };

    const result = solveCornerMiter(P, dirA, 20, dirB, 20, vMid);
    expect(result).not.toBeNull();
    expect(result!.M.x).toBeCloseTo(110);
    expect(result!.M.y).toBeCloseTo(90);
  });

  it('creates valid corner prism geometry with bounds and normals', () => {
    const poly = [
      { x: 100, y: 100 },
      { x: 100, y: 110 },
      { x: 110, y: 110 },
      { x: 110, y: 100 },
    ];
    const geo = createCornerPrismGeometry(poly, 0, 280);
    geo.computeBoundingBox();

    expect(geo.boundingBox!.min.x).toBeCloseTo(100);
    expect(geo.boundingBox!.max.x).toBeCloseTo(110);
    expect(geo.boundingBox!.min.y).toBeCloseTo(0);
    expect(geo.boundingBox!.max.y).toBeCloseTo(280);
    expect(geo.boundingBox!.min.z).toBeCloseTo(100);
    expect(geo.boundingBox!.max.z).toBeCloseTo(110);
    expect(geo.getAttribute('position').count).toBe(36); // 12 triangles * 3
    expect(geo.getAttribute('uv').count).toBe(36);

    const normals = geo.getAttribute('normal');
    // Top face is at vertex 6 to 11 and points up (+Y)
    expect(normals.getY(6)).toBeCloseTo(1);
    // Bottom face is at vertex 0 to 5 and points down (-Y)
    expect(normals.getY(0)).toBeCloseTo(-1);
    // Side face normals point outward away from the prism interior
    expect(normals.getX(12)).toBeCloseTo(-1);
    expect(normals.getZ(18)).toBeCloseTo(1);
  });

  it('adds corner joint mesh to wallGroup for connected walls', () => {
    const w1: Wall = {
      id: 'w1',
      start: { x: 0, y: 100 },
      end: { x: 100, y: 100 },
      thickness: 20,
      height: 280,
      color: '#ffffff',
    };
    const w2: Wall = {
      id: 'w2',
      start: { x: 100, y: 100 },
      end: { x: 100, y: 200 },
      thickness: 20,
      height: 280,
      color: '#ffffff',
    };
    const floor: Floor = {
      id: 'f1',
      name: 'Térreo',
      level: 0,
      elevation: 0,
      slabThickness: 20,
      walls: [w1, w2],
      doors: [],
      windows: [],
      furniture: [],
      rooms: [],
      stairs: [],
      columns: [],
      guides: [],
      measurements: [],
      annotations: [],
      textAnnotations: [],
      groups: [],
    };

    const wallGroup = new THREE.Group();
    buildWallJoints3D(floor, wallGroup);

    expect(wallGroup.children.length).toBe(1);
    const mesh = wallGroup.children[0] as THREE.Mesh;
    mesh.geometry.computeBoundingBox();
    expect(mesh.geometry.boundingBox!.min.y).toBe(0);
    expect(mesh.geometry.boundingBox!.max.y).toBe(280);
  });

  it('tests a full 4-wall rectangular room', () => {
    const walls: Wall[] = [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 400, y: 0 }, thickness: 20, height: 280, color: '#fff' },
      { id: 'w2', start: { x: 400, y: 0 }, end: { x: 400, y: 300 }, thickness: 20, height: 280, color: '#fff' },
      { id: 'w3', start: { x: 400, y: 300 }, end: { x: 0, y: 300 }, thickness: 20, height: 280, color: '#fff' },
      { id: 'w4', start: { x: 0, y: 300 }, end: { x: 0, y: 0 }, thickness: 20, height: 280, color: '#fff' },
    ];
    const floor: Floor = {
      id: 'f1', name: 'Térreo', level: 0, elevation: 0, slabThickness: 20,
      walls, doors: [], windows: [], furniture: [], rooms: [], stairs: [], columns: [],
      guides: [], measurements: [], annotations: [], textAnnotations: [], groups: []
    };

    const wallGroup = new THREE.Group();
    buildWallJoints3D(floor, wallGroup);

    console.log('4-wall room joint meshes count:', wallGroup.children.length);
    for (let i = 0; i < wallGroup.children.length; i++) {
      const m = wallGroup.children[i] as THREE.Mesh;
      m.geometry.computeBoundingBox();
      console.log(`Corner ${i} bounds:`, JSON.stringify(m.geometry.boundingBox));
    }
  });

  it('tests a clockwise-drawn 4-wall rectangular room', () => {
    const walls: Wall[] = [
      { id: 'w1', start: { x: 0, y: 0 }, end: { x: 0, y: 300 }, thickness: 20, height: 280, color: '#fff' },
      { id: 'w2', start: { x: 0, y: 300 }, end: { x: 400, y: 300 }, thickness: 20, height: 280, color: '#fff' },
      { id: 'w3', start: { x: 400, y: 300 }, end: { x: 400, y: 0 }, thickness: 20, height: 280, color: '#fff' },
      { id: 'w4', start: { x: 400, y: 0 }, end: { x: 0, y: 0 }, thickness: 20, height: 280, color: '#fff' },
    ];
    const floor: Floor = {
      id: 'f2', name: 'Térreo', level: 0, elevation: 0, slabThickness: 20,
      walls, doors: [], windows: [], furniture: [], rooms: [], stairs: [], columns: [],
      guides: [], measurements: [], annotations: [], textAnnotations: [], groups: []
    };

    const wallGroup = new THREE.Group();
    buildWallJoints3D(floor, wallGroup);

    expect(wallGroup.children.length).toBe(4);
    for (let i = 0; i < wallGroup.children.length; i++) {
      const m = wallGroup.children[i] as THREE.Mesh;
      m.geometry.computeBoundingBox();
      console.log(`Clockwise Corner ${i} bounds:`, JSON.stringify(m.geometry.boundingBox));
    }
  });
});
