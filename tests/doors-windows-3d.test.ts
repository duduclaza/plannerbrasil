import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildDoors3D, buildWindows3D, createArchitecturalMaterials } from '$lib/utils/doorWindow3D';
import type { Floor, Wall, Door, Window } from '$lib/models/types';

describe('doorWindow3D', () => {
  const wall: Wall = {
    id: 'w1',
    start: { x: 0, y: 0 },
    end: { x: 400, y: 0 },
    thickness: 15,
    height: 280,
    color: '#ffffff',
  };

  const createFloor = (doors: Door[] = [], windows: Window[] = []): Floor => ({
    id: 'f1',
    name: 'Térreo',
    level: 0,
    elevation: 0,
    slabThickness: 20,
    walls: [wall],
    doors,
    windows,
    furniture: [],
    rooms: [],
    stairs: [],
    columns: [],
    guides: [],
    measurements: [],
    annotations: [],
    textAnnotations: [],
    groups: [],
  });

  it('creates architectural materials with proper properties', () => {
    const mats = createArchitecturalMaterials(false);
    expect(mats.doorWood.roughness).toBeDefined();
    expect(mats.hardwareMetal.metalness).toBeGreaterThan(0.7);
    expect(mats.windowGlass.transparent).toBe(true);
    expect(mats.windowGlass.opacity).toBeLessThan(1);
  });

  it('builds a single door with architraves, leaf, and lever handles', () => {
    const door: Door = {
      id: 'd1',
      wallId: 'w1',
      position: 0.5,
      width: 90,
      height: 210,
      type: 'single',
      swingDirection: 'right',
      flipSide: false,
    };

    const group = new THREE.Group();
    buildDoors3D(createFloor([door]), group);

    expect(group.children.length).toBe(1);
    const doorGroup = group.children[0] as THREE.Group;
    expect(doorGroup.position.x).toBeCloseTo(200);
    expect(doorGroup.position.z).toBeCloseTo(0);

    // Door group contains architraves, jambs, and pivot group
    let meshCount = 0;
    doorGroup.traverse(child => {
      if (child instanceof THREE.Mesh) meshCount++;
    });
    expect(meshCount).toBeGreaterThan(10); // Comprehensive architectural detail
  });

  it('builds double and sliding doors correctly', () => {
    const dDouble: Door = {
      id: 'd2',
      wallId: 'w1',
      position: 0.25,
      width: 160,
      height: 210,
      type: 'double',
      swingDirection: 'left',
      flipSide: false,
    };
    const dSliding: Door = {
      id: 'd3',
      wallId: 'w1',
      position: 0.75,
      width: 140,
      height: 210,
      type: 'sliding',
      swingDirection: 'left',
      flipSide: false,
    };

    const group = new THREE.Group();
    buildDoors3D(createFloor([dDouble, dSliding]), group);

    expect(group.children.length).toBe(2);
  });

  it('builds sliding window with frame, interior/exterior sills, and sashes', () => {
    const win: Window = {
      id: 'win1',
      wallId: 'w1',
      position: 0.5,
      width: 120,
      height: 120,
      sillHeight: 100,
      type: 'standard',
    };

    const group = new THREE.Group();
    buildWindows3D(createFloor([], [win]), group);

    expect(group.children.length).toBe(1);
    const winGroup = group.children[0] as THREE.Group;
    expect(winGroup.position.x).toBeCloseTo(200);
    expect(winGroup.position.y).toBeCloseTo(160); // sill 100 + height 120 / 2

    // Check meshes (frame, sills, sashes, glass)
    let glassFound = false;
    winGroup.traverse(child => {
      if (child instanceof THREE.Mesh && (child.material as THREE.MeshStandardMaterial).transparent) {
        glassFound = true;
      }
    });
    expect(glassFound).toBe(true);
  });
});

