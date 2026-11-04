import * as THREE from 'three';
import type { Door, Floor, Wall, Window } from '$lib/models/types';
import { wallPathProfile, pathOpening } from '$lib/utils/wallProfiles';

const MIN_WALL_THICKNESS = 15;
const CASING_WIDTH = 5.5; // cm
const CASING_THICKNESS = 1.2; // cm
const JAMB_THICKNESS = 3.5; // cm
const DOOR_LEAF_THICKNESS = 3.5; // cm

// ─── Material Palettes ──────────────────────────────────────────────────

export interface ArchitecturalMaterials {
  doorWood: THREE.MeshStandardMaterial;
  doorTrim: THREE.MeshStandardMaterial;
  doorPanel: THREE.MeshStandardMaterial;
  doorGroove: THREE.MeshStandardMaterial;
  hardwareMetal: THREE.MeshStandardMaterial;
  hardwareDark: THREE.MeshStandardMaterial;
  windowFrame: THREE.MeshStandardMaterial;
  windowSillExt: THREE.MeshStandardMaterial;
  windowSillInt: THREE.MeshStandardMaterial;
  windowGlass: THREE.MeshStandardMaterial;
  garageSash: THREE.MeshStandardMaterial;
}

export function createArchitecturalMaterials(solidColorsOnly = false): ArchitecturalMaterials {
  if (solidColorsOnly) {
    const basic = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
    return {
      doorWood: basic(0xa07855),
      doorTrim: basic(0xeeeeee),
      doorPanel: basic(0x8a603c),
      doorGroove: basic(0x5a3e24),
      hardwareMetal: basic(0xcccccc),
      hardwareDark: basic(0x333333),
      windowFrame: basic(0xffffff),
      windowSillExt: basic(0xb0b0b0),
      windowSillInt: basic(0xe0e0e0),
      windowGlass: new THREE.MeshStandardMaterial({ color: 0xa8d8ea, transparent: true, opacity: 0.45, roughness: 0.1 }),
      garageSash: basic(0xd8d4cc),
    };
  }

  return {
    // Elegant warm oak / satin wood
    doorWood: new THREE.MeshStandardMaterial({
      color: 0x936639,
      roughness: 0.45,
      metalness: 0.05,
    }),
    // Modern off-white architrave and jamb trim
    doorTrim: new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    // Door panel leaf surface
    doorPanel: new THREE.MeshStandardMaterial({
      color: 0x7f5539,
      roughness: 0.4,
      metalness: 0.05,
    }),
    // Darker groove lines on door leaf
    doorGroove: new THREE.MeshStandardMaterial({
      color: 0x4a2810,
      roughness: 0.7,
      metalness: 0.1,
    }),
    // Brushed stainless steel hardware (levers, rosettes)
    hardwareMetal: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.88,
      roughness: 0.18,
    }),
    hardwareDark: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3,
    }),
    // Modern architectural window frame (satin white or dark anthracite)
    windowFrame: new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.3,
      metalness: 0.15,
    }),
    // Exterior stone/granite sill
    windowSillExt: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.6,
      metalness: 0.1,
    }),
    // Interior sill board
    windowSillInt: new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.05,
    }),
    // Double-sided reflective tinted glass
    windowGlass: new THREE.MeshStandardMaterial({
      color: 0xb9e2fe,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    // Sectional garage door
    garageSash: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.15,
    }),
  };
}

// ─── Lever Handle Builder ───────────────────────────────────────────────

function createLeverHandle(mats: ArchitecturalMaterials): THREE.Group {
  const group = new THREE.Group();

  // 1. Escutcheon / Rosette (round baseplate)
  const rosetteGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.4, 16);
  const rosette = new THREE.Mesh(rosetteGeo, mats.hardwareMetal);
  rosette.rotation.x = Math.PI / 2;
  group.add(rosette);

  // 2. Handle spindle collar
  const collarGeo = new THREE.CylinderGeometry(0.9, 0.9, 2.2, 12);
  const collar = new THREE.Mesh(collarGeo, mats.hardwareMetal);
  collar.rotation.x = Math.PI / 2;
  collar.position.z = 1.1;
  group.add(collar);

  // 3. Horizontal lever bar
  const leverGeo = new THREE.CylinderGeometry(0.7, 0.6, 11, 12);
  const lever = new THREE.Mesh(leverGeo, mats.hardwareMetal);
  lever.rotation.z = Math.PI / 2;
  lever.position.set(5.5, 0, 2.2);
  group.add(lever);

  // 4. Subtle keyhole plate below
  const keyEscGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.3, 12);
  const keyEsc = new THREE.Mesh(keyEscGeo, mats.hardwareMetal);
  keyEsc.rotation.x = Math.PI / 2;
  keyEsc.position.set(0, -6.5, 0);
  group.add(keyEsc);

  const keyholeGeo = new THREE.BoxGeometry(0.3, 1.2, 0.4);
  const keyhole = new THREE.Mesh(keyholeGeo, mats.hardwareDark);
  keyhole.position.set(0, -6.5, 0.1);
  group.add(keyhole);

  return group;
}

// ─── Door Trim & Architraves ───────────────────────────────────────────

function addDoorArchitravesAndJambs(
  group: THREE.Group,
  doorW: number,
  doorH: number,
  wt: number,
  mats: ArchitecturalMaterials
): void {
  const jambDepth = wt + 0.4;
  const jambW = JAMB_THICKNESS;

  // 1. Interior lining jambs (lining the wall cutout)
  // Left jamb
  const lJamb = new THREE.Mesh(new THREE.BoxGeometry(jambW, doorH, jambDepth), mats.doorTrim);
  lJamb.position.set(-doorW / 2 + jambW / 2, doorH / 2, 0);
  group.add(lJamb);

  // Right jamb
  const rJamb = new THREE.Mesh(new THREE.BoxGeometry(jambW, doorH, jambDepth), mats.doorTrim);
  rJamb.position.set(doorW / 2 - jambW / 2, doorH / 2, 0);
  group.add(rJamb);

  // Top header jamb
  const tJamb = new THREE.Mesh(new THREE.BoxGeometry(doorW, jambW, jambDepth), mats.doorTrim);
  tJamb.position.set(0, doorH - jambW / 2, 0);
  group.add(tJamb);

  // 2. Architraves / Guarnições (Casing framing both wall faces)
  const casingW = CASING_WIDTH;
  const casingT = CASING_THICKNESS;

  for (const side of [-1, 1] as const) {
    const zPos = side * (wt / 2 + casingT / 2);

    // Left vertical casing
    const lCasing = new THREE.Mesh(
      new THREE.BoxGeometry(casingW, doorH + casingW, casingT),
      mats.doorTrim
    );
    lCasing.position.set(-doorW / 2 - casingW / 2 + jambW * 0.4, (doorH + casingW) / 2, zPos);
    group.add(lCasing);

    // Right vertical casing
    const rCasing = new THREE.Mesh(
      new THREE.BoxGeometry(casingW, doorH + casingW, casingT),
      mats.doorTrim
    );
    rCasing.position.set(doorW / 2 + casingW / 2 - jambW * 0.4, (doorH + casingW) / 2, zPos);
    group.add(rCasing);

    // Top horizontal header casing
    const tCasing = new THREE.Mesh(
      new THREE.BoxGeometry(doorW + casingW * 2 - jambW * 0.8, casingW, casingT),
      mats.doorTrim
    );
    tCasing.position.set(0, doorH + casingW / 2, zPos);
    group.add(tCasing);
  }
}

// ─── Single Swinging Door Leaf ─────────────────────────────────────────

function createSingleDoorLeaf(
  leafW: number,
  leafH: number,
  mats: ArchitecturalMaterials
): THREE.Group {
  const leafGroup = new THREE.Group();

  // Main door slab
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(leafW, leafH, DOOR_LEAF_THICKNESS),
    mats.doorPanel
  );
  slab.position.set(leafW / 2, leafH / 2, 0);
  slab.castShadow = true;
  slab.receiveShadow = true;
  leafGroup.add(slab);

  // Modern horizontal accent grooves (frisos decorativos) on both sides
  const numGrooves = 4;
  for (let i = 1; i <= numGrooves; i++) {
    const gy = (leafH / (numGrooves + 1)) * i;
    for (const gz of [-DOOR_LEAF_THICKNESS / 2, DOOR_LEAF_THICKNESS / 2]) {
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(leafW * 0.8, 0.8, 0.25),
        mats.doorGroove
      );
      groove.position.set(leafW / 2, gy, gz + (gz > 0 ? 0.05 : -0.05));
      leafGroup.add(groove);
    }
  }

  // Lever handles on BOTH sides (interior and exterior)
  const handleX = leafW - 7;
  const handleY = Math.min(100, leafH * 0.48);

  // Exterior handle
  const extHandle = createLeverHandle(mats);
  extHandle.position.set(handleX, handleY, -DOOR_LEAF_THICKNESS / 2);
  extHandle.rotation.y = Math.PI;
  leafGroup.add(extHandle);

  // Interior handle
  const intHandle = createLeverHandle(mats);
  intHandle.position.set(handleX, handleY, DOOR_LEAF_THICKNESS / 2);
  leafGroup.add(intHandle);

  // Hinges (3 small metallic knuckles on the pivot edge)
  for (const hy of [leafH * 0.15, leafH * 0.5, leafH * 0.85]) {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 4, 8),
      mats.hardwareMetal
    );
    hinge.position.set(0.5, hy, 0);
    leafGroup.add(hinge);
  }

  return leafGroup;
}

// ─── French Door Leaf (Divided Glass Lites) ─────────────────────────────

function createFrenchDoorLeaf(
  leafW: number,
  leafH: number,
  mats: ArchitecturalMaterials
): THREE.Group {
  const leafGroup = new THREE.Group();
  const stileW = 9; // perimeter frame width

  // Top, bottom, left, right wooden frame
  const bFrame = new THREE.Mesh(new THREE.BoxGeometry(leafW, 16, DOOR_LEAF_THICKNESS), mats.doorWood);
  bFrame.position.set(leafW / 2, 8, 0);
  leafGroup.add(bFrame);

  const tFrame = new THREE.Mesh(new THREE.BoxGeometry(leafW, stileW, DOOR_LEAF_THICKNESS), mats.doorWood);
  tFrame.position.set(leafW / 2, leafH - stileW / 2, 0);
  leafGroup.add(tFrame);

  const lFrame = new THREE.Mesh(new THREE.BoxGeometry(stileW, leafH - 16 - stileW, DOOR_LEAF_THICKNESS), mats.doorWood);
  lFrame.position.set(stileW / 2, 16 + (leafH - 16 - stileW) / 2, 0);
  leafGroup.add(lFrame);

  const rFrame = new THREE.Mesh(new THREE.BoxGeometry(stileW, leafH - 16 - stileW, DOOR_LEAF_THICKNESS), mats.doorWood);
  rFrame.position.set(leafW - stileW / 2, 16 + (leafH - 16 - stileW) / 2, 0);
  leafGroup.add(rFrame);

  // Central glass pane
  const glassW = leafW - stileW * 2;
  const glassH = leafH - 16 - stileW;
  const glass = new THREE.Mesh(new THREE.BoxGeometry(glassW, glassH, 0.6), mats.windowGlass);
  glass.position.set(leafW / 2, 16 + glassH / 2, 0);
  leafGroup.add(glass);

  // Muntin bars (2x3 grid)
  const cols = 2;
  const rows = 3;
  const colW = glassW / cols;
  const rowH = glassH / rows;
  const muntinBar = 2;

  // Vertical muntin
  for (let c = 1; c < cols; c++) {
    const vBar = new THREE.Mesh(new THREE.BoxGeometry(muntinBar, glassH, DOOR_LEAF_THICKNESS * 0.7), mats.doorWood);
    vBar.position.set(stileW + c * colW, 16 + glassH / 2, 0);
    leafGroup.add(vBar);
  }
  // Horizontal muntins
  for (let r = 1; r < rows; r++) {
    const hBar = new THREE.Mesh(new THREE.BoxGeometry(glassW, muntinBar, DOOR_LEAF_THICKNESS * 0.7), mats.doorWood);
    hBar.position.set(leafW / 2, 16 + r * rowH, 0);
    leafGroup.add(hBar);
  }

  // Handles
  const handleX = leafW - 5;
  const handleY = Math.min(100, leafH * 0.48);
  const extH = createLeverHandle(mats);
  extH.position.set(handleX, handleY, -DOOR_LEAF_THICKNESS / 2);
  extH.rotation.y = Math.PI;
  leafGroup.add(extH);

  const intH = createLeverHandle(mats);
  intH.position.set(handleX, handleY, DOOR_LEAF_THICKNESS / 2);
  leafGroup.add(intH);

  return leafGroup;
}

// ─── Sliding Door Builder ──────────────────────────────────────────────

function createSlidingDoor(
  doorW: number,
  doorH: number,
  wt: number,
  mats: ArchitecturalMaterials
): THREE.Group {
  const group = new THREE.Group();

  // Top overhead track rail
  const trackW = doorW * 1.5;
  const track = new THREE.Mesh(new THREE.BoxGeometry(trackW, 4, 6), mats.hardwareMetal);
  track.position.set(0, doorH + 2, wt / 2 + 3);
  group.add(track);

  // 2 Sliding panels (one fixed/recessed, one sliding forward)
  const panelW = (doorW / 2) + 4;
  const panelH = doorH - 2;

  // Left panel (recessed track)
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, 3), mats.doorPanel);
  p1.position.set(-doorW / 4, panelH / 2, wt / 2 - 1.5);
  p1.castShadow = true;
  group.add(p1);

  // Right panel (outer track, slightly slid open)
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(panelW, panelH, 3), mats.doorPanel);
  p2.position.set(doorW / 4 - 10, panelH / 2, wt / 2 + 1.8);
  p2.castShadow = true;
  group.add(p2);

  // Recessed flush pull handles (conchas embutidas) on both panels
  const pullMat = mats.hardwareMetal;
  const pullGeo = new THREE.BoxGeometry(2, 12, 1);
  const pull1 = new THREE.Mesh(pullGeo, pullMat);
  pull1.position.set(panelW / 2 - 4, panelH * 0.48, 1.2);
  p2.add(pull1);

  return group;
}

// ─── Garage Door Builder ───────────────────────────────────────────────

function createGarageDoor(
  doorW: number,
  doorH: number,
  wt: number,
  mats: ArchitecturalMaterials
): THREE.Group {
  const group = new THREE.Group();
  const numSections = 4;
  const secH = (doorH - 4) / numSections;

  for (let i = 0; i < numSections; i++) {
    const yCenter = 2 + (i + 0.5) * secH;
    const secGroup = new THREE.Group();
    secGroup.position.set(0, yCenter, 0);

    // Main section panel
    const secMesh = new THREE.Mesh(
      new THREE.BoxGeometry(doorW - 2, secH - 1.5, 4.5),
      mats.garageSash
    );
    secMesh.castShadow = true;
    secGroup.add(secMesh);

    // Embossed horizontal ribs
    const rib1 = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.9, 1.5, 0.6), mats.doorTrim);
    rib1.position.set(0, -secH * 0.25, 2.3);
    secGroup.add(rib1);
    const rib2 = new THREE.Mesh(new THREE.BoxGeometry(doorW * 0.9, 1.5, 0.6), mats.doorTrim);
    rib2.position.set(0, secH * 0.25, 2.3);
    secGroup.add(rib2);

    // Top section: decorative frosted glass windows
    if (i === numSections - 1) {
      const numWindows = 4;
      const winW = (doorW * 0.8) / numWindows - 4;
      for (let wIdx = 0; wIdx < numWindows; wIdx++) {
        const wx = -doorW * 0.4 + wIdx * (winW + 4) + winW / 2;
        const gWin = new THREE.Mesh(new THREE.BoxGeometry(winW, secH * 0.45, 1), mats.windowGlass);
        gWin.position.set(wx, 0, 2.3);
        secGroup.add(gWin);
      }
    }

    group.add(secGroup);
  }

  // Lift handle on 2nd section
  const handle = new THREE.Mesh(new THREE.BoxGeometry(14, 2.5, 3), mats.hardwareMetal);
  handle.position.set(0, secH * 1.5, 2.5);
  group.add(handle);

  return group;
}

// ─── Main Door 3D Assembly ─────────────────────────────────────────────

export function buildDoors3D(
  floor: Floor,
  wallGroup: THREE.Group,
  options?: { solidColorsOnly?: boolean }
): void {
  const mats = createArchitecturalMaterials(options?.solidColorsOnly);

  for (const sourceDoor of floor.doors) {
    const wall = floor.walls.find(w => w.id === sourceDoor.wallId);
    if (!wall) continue;

    const path = wallPathProfile(wall);
    const length = path.length;
    const opening = pathOpening(
      path,
      path.distanceAt(sourceDoor.position),
      sourceDoor.width,
      0,
      sourceDoor.height ?? 210
    );
    if (!opening || opening.top < 6 || opening.right - opening.left <= 2) continue;

    const left = path.sample(opening.left).point;
    const right = path.sample(opening.right).point;
    const doorW = Math.hypot(right.x - left.x, right.y - left.y);
    if (doorW <= 2) continue;

    const px = (left.x + right.x) / 2;
    const py = (left.y + right.y) / 2;
    const angle = Math.atan2(right.y - left.y, right.x - left.x);
    const wt = Math.max(wall.thickness, MIN_WALL_THICKNESS);
    const doorH = opening.top;

    const doorGroup = new THREE.Group();
    doorGroup.position.set(px, 0, py);
    doorGroup.rotation.y = -angle;

    // 1. Architraves and jambs (Batentes e Guarnições dos dois lados da parede)
    addDoorArchitravesAndJambs(doorGroup, doorW, doorH, wt, mats);

    const type = sourceDoor.type || 'single';

    if (type === 'opening') {
      // Cased opening (vão livre) — jambs & architraves only
    } else if (type === 'garage') {
      const garage = createGarageDoor(doorW, doorH, wt, mats);
      doorGroup.add(garage);
    } else if (type === 'sliding' || type === 'pocket') {
      const sliding = createSlidingDoor(doorW, doorH, wt, mats);
      doorGroup.add(sliding);
    } else if (type === 'double') {
      // Double door: two leaves meeting at center
      const leafW = (doorW - JAMB_THICKNESS * 2) / 2 - 0.5;
      const leafH = doorH - JAMB_THICKNESS - 1;
      const swingAngle = 0.28; // ~16°

      // Left leaf
      const leftPivot = new THREE.Group();
      leftPivot.position.set(-doorW / 2 + JAMB_THICKNESS, 0, 0);
      leftPivot.rotation.y = -swingAngle;
      const leftLeaf = createSingleDoorLeaf(leafW, leafH, mats);
      leftPivot.add(leftLeaf);
      doorGroup.add(leftPivot);

      // Right leaf
      const rightPivot = new THREE.Group();
      rightPivot.position.set(doorW / 2 - JAMB_THICKNESS, 0, 0);
      rightPivot.rotation.y = Math.PI + swingAngle;
      const rightLeaf = createSingleDoorLeaf(leafW, leafH, mats);
      rightPivot.add(rightLeaf);
      doorGroup.add(rightPivot);
    } else {
      // Single swinging door or French door
      const leafW = doorW - JAMB_THICKNESS * 2 - 0.5;
      const leafH = doorH - JAMB_THICKNESS - 1;

      const swingDir = sourceDoor.swingDirection === 'right' ? 1 : -1;
      const faceFlip = sourceDoor.flipSide ? -1 : 1;
      const hingeX = swingDir === 1 ? doorW / 2 - JAMB_THICKNESS : -doorW / 2 + JAMB_THICKNESS;
      const ajarAngle = 0.32 * faceFlip * (-swingDir); // ~18° ajar

      const pivot = new THREE.Group();
      pivot.position.set(hingeX, 0, faceFlip * 0.5);
      pivot.rotation.y = swingDir === 1 ? Math.PI + ajarAngle : ajarAngle;

      const leaf = type === 'french'
        ? createFrenchDoorLeaf(leafW, leafH, mats)
        : createSingleDoorLeaf(leafW, leafH, mats);

      pivot.add(leaf);
      doorGroup.add(pivot);
    }

    doorGroup.traverse(child => {
      child.userData.xray = true;
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    wallGroup.add(doorGroup);
  }
}

// ─── Main Window 3D Assembly ───────────────────────────────────────────

export function buildWindows3D(
  floor: Floor,
  wallGroup: THREE.Group,
  options?: { solidColorsOnly?: boolean }
): void {
  const mats = createArchitecturalMaterials(options?.solidColorsOnly);

  for (const sourceWindow of floor.windows) {
    const wall = floor.walls.find(w => w.id === sourceWindow.wallId);
    if (!wall) continue;

    const path = wallPathProfile(wall);
    const length = path.length;
    const sillH = sourceWindow.sillHeight ?? 90;
    const opening = pathOpening(
      path,
      path.distanceAt(sourceWindow.position),
      sourceWindow.width,
      sillH,
      sourceWindow.height
    );
    if (!opening || opening.top - opening.bottom <= 4 || opening.right - opening.left <= 4) continue;

    const left = path.sample(opening.left).point;
    const right = path.sample(opening.right).point;
    const winW = Math.hypot(right.x - left.x, right.y - left.y);
    if (winW <= 4) continue;

    const px = (left.x + right.x) / 2;
    const py = (left.y + right.y) / 2;
    const angle = Math.atan2(right.y - left.y, right.x - left.x);
    const wt = Math.max(wall.thickness, MIN_WALL_THICKNESS);
    const effectiveWinH = opening.top - opening.bottom;
    const winCY = opening.bottom + effectiveWinH / 2;

    const winGroup = new THREE.Group();
    winGroup.position.set(px, winCY, py);
    winGroup.rotation.y = -angle;

    const frameW = 4.5; // outer profile bar width
    const frameD = wt + 0.4; // full wall jamb depth

    // 1. Outer Wall Jamb Frame (Marco perimetral completo)
    // Left & Right frame jambs
    for (const sx of [-1, 1] as const) {
      const vJamb = new THREE.Mesh(
        new THREE.BoxGeometry(frameW, effectiveWinH, frameD),
        mats.windowFrame
      );
      vJamb.position.set(sx * (winW / 2 - frameW / 2), 0, 0);
      winGroup.add(vJamb);
    }
    // Top & Bottom frame headers
    for (const sy of [-1, 1] as const) {
      const hJamb = new THREE.Mesh(
        new THREE.BoxGeometry(winW, frameW, frameD),
        mats.windowFrame
      );
      hJamb.position.set(0, sy * (effectiveWinH / 2 - frameW / 2), 0);
      winGroup.add(hJamb);
    }

    // 2. Exterior Sill (Pingadeira inclinada em granito/alumínio)
    const extSillW = winW + 12;
    const extSillGeo = new THREE.BoxGeometry(extSillW, 3.5, 8);
    const extSill = new THREE.Mesh(extSillGeo, mats.windowSillExt);
    extSill.position.set(0, -effectiveWinH / 2 - 1.5, -wt / 2 - 3);
    extSill.rotation.x = 0.08; // 5° runoff slope
    winGroup.add(extSill);

    // 3. Interior Sill (Peitoril / Bancada interna)
    const intSillW = winW + 8;
    const intSillGeo = new THREE.BoxGeometry(intSillW, 2.5, 5);
    const intSill = new THREE.Mesh(intSillGeo, mats.windowSillInt);
    intSill.position.set(0, -effectiveWinH / 2 - 1.25, wt / 2 + 1.5);
    winGroup.add(intSill);

    // 4. Glazing & Sashes according to Window Type
    const type = sourceWindow.type || 'standard';
    const sashH = effectiveWinH - frameW * 2 - 0.5;

    if (type === 'fixed') {
      // Minimalist fixed glass pane
      const glassW = winW - frameW * 2;
      const glassH = sashH;
      const glass = new THREE.Mesh(new THREE.BoxGeometry(glassW, glassH, 0.8), mats.windowGlass);
      glass.position.set(0, 0, 0);
      winGroup.add(glass);
    } else {
      // 2-Sash Sliding Window (Janela de Correr 2 Folhas - Padrão brasileiro/internacional)
      const sashProfileW = 3.5;
      const sashW = (winW - frameW * 2) / 2 + 2; // with center overlap

      // Helper to build a sliding window sash
      const createSash = (sashX: number, sashZ: number, isRight: boolean) => {
        const sGroup = new THREE.Group();
        sGroup.position.set(sashX, 0, sashZ);

        // Sash border frame (4 bars)
        // Top & Bottom
        for (const sy of [-1, 1] as const) {
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(sashW, sashProfileW, 2.5),
            mats.windowFrame
          );
          bar.position.set(0, sy * (sashH / 2 - sashProfileW / 2), 0);
          sGroup.add(bar);
        }
        // Left & Right
        for (const sx of [-1, 1] as const) {
          const bar = new THREE.Mesh(
            new THREE.BoxGeometry(sashProfileW, sashH - sashProfileW * 2, 2.5),
            mats.windowFrame
          );
          bar.position.set(sx * (sashW / 2 - sashProfileW / 2), 0, 0);
          sGroup.add(bar);
        }

        // Glass pane
        const gW = sashW - sashProfileW * 2;
        const gH = sashH - sashProfileW * 2;
        const glass = new THREE.Mesh(new THREE.BoxGeometry(gW, gH, 0.6), mats.windowGlass);
        glass.position.set(0, 0, 0);
        sGroup.add(glass);

        // Center latch / lock on the meeting rail
        if (isRight) {
          const latch = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 6, 1.8),
            mats.hardwareMetal
          );
          latch.position.set(-sashW / 2 + sashProfileW / 2, 0, 1.4);
          sGroup.add(latch);
        }

        return sGroup;
      };

      // Left sash (exterior sliding track)
      const leftSashX = -winW / 4 + 1;
      const leftSash = createSash(leftSashX, -2.5, false);
      winGroup.add(leftSash);

      // Right sash (interior sliding track)
      const rightSashX = winW / 4 - 1;
      const rightSash = createSash(rightSashX, 2.5, true);
      winGroup.add(rightSash);
    }

    winGroup.traverse(child => {
      child.userData.xray = true;
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    wallGroup.add(winGroup);
  }
}

