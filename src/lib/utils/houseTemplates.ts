import type { Project, Floor, Wall, Door, Window, FurnitureItem, Stair } from '$lib/models/types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface HouseTemplate {
  name: string;
  description: string;
  icon: string;
  area: string;
  tags: string[];
  create: () => Project;
}

function makeProject(name: string, floor: Floor): Project {
  return {
    id: uid(),
    name,
    floors: [floor],
    activeFloorId: floor.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeMultiFloorProject(name: string, floors: Floor[]): Project {
  return {
    id: uid(),
    name,
    floors,
    activeFloorId: floors[0].id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeFloor(walls: Wall[], doors: Door[], windows: Window[], furniture: FurnitureItem[] = []): Floor {
  const id = uid();
  return {
    id,
    name: 'Ground Floor',
    level: 0,
    walls,
    rooms: [],
    doors,
    windows,
    furniture,
    stairs: [],
    columns: [],
    guides: [],
    measurements: [],
    annotations: [],
    textAnnotations: [],
    groups: [],
  };
}

function makeCustomFloor(
  name: string,
  level: number,
  elevation: number,
  walls: Wall[],
  doors: Door[],
  windows: Window[],
  furnitureList: FurnitureItem[] = [],
  stairs: Stair[] = []
): Floor {
  const id = uid();
  return {
    id,
    name,
    level,
    elevation,
    walls,
    rooms: [],
    doors,
    windows,
    furniture: furnitureList,
    stairs,
    columns: [],
    guides: [],
    measurements: [],
    annotations: [],
    textAnnotations: [],
    groups: [],
  };
}


/** Brazilian-style perimeter wall (muro) around a lot, with a garage gate and a pedestrian gate on the street side (y = 0). */
function lotFence(w: number, h: number, garageX: number, pedX: number): { walls: Wall[]; doors: Door[] } {
  const mk = (x1: number, y1: number, x2: number, y2: number): Wall => ({ ...wall(x1, y1, x2, y2, 15, 220), color: '#e7e5e4' });
  const front = mk(0, 0, w, 0), right = mk(w, 0, w, h), back = mk(w, h, 0, h), left = mk(0, h, 0, 0);
  return {
    walls: [front, right, back, left],
    doors: [door(front.id, garageX / w, 'garage', 300), door(front.id, pedX / w, 'single', 100)],
  };
}

/** Street sidewalk, mailbox and gate lighting outside/at the front muro. */
function streetFront(w: number, pedX: number): FurnitureItem[] {
  return [
    furniture('path_wide', w / 2, -95, 0, { width: w + 200, depth: 150 }),
    furniture('mailbox', pedX + 80, 25, 0),
    furniture('lamp_post', pedX - 80, 30, 0),
  ];
}

function lawn(cx: number, cy: number, w: number, d: number): FurnitureItem {
  return furniture('lawn_rect', cx, cy, 0, { width: w, depth: d });
}

function walkPath(cx: number, cy: number, w: number, d: number): FurnitureItem {
  return furniture('path_straight', cx, cy, 0, { width: w, depth: d, elevation: 2 });
}

function shiftPlanY(walls: Wall[], fur: FurnitureItem[], dy: number): void {
  for (const w of walls) { w.start = { x: w.start.x, y: w.start.y + dy }; w.end = { x: w.end.x, y: w.end.y + dy }; }
  for (const f of fur) f.position = { x: f.position.x, y: f.position.y + dy };
}

// Helper: create a rectangular room from walls, returning wall IDs for door/window placement
// All coordinates in cm. Origin top-left.
function rectWalls(x: number, y: number, w: number, h: number, thickness = 15, height = 280): Wall[] {
  const tl = { x, y };
  const tr = { x: x + w, y };
  const br = { x: x + w, y: y + h };
  const bl = { x, y: y + h };
  return [
    { id: uid(), start: tl, end: tr, thickness, height, startHeight: height, endHeight: height, color: '#444444' }, // top
    { id: uid(), start: tr, end: br, thickness, height, startHeight: height, endHeight: height, color: '#444444' }, // right
    { id: uid(), start: br, end: bl, thickness, height, startHeight: height, endHeight: height, color: '#444444' }, // bottom
    { id: uid(), start: bl, end: tl, thickness, height, startHeight: height, endHeight: height, color: '#444444' }, // left
  ];
}

function wall(x1: number, y1: number, x2: number, y2: number, thickness = 15, height = 280): Wall {
  return { id: uid(), start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness, height, startHeight: height, endHeight: height, color: '#444444' };
}

function door(wallId: string, position: number, type: Door['type'] = 'single', width = 90): Door {
  return { id: uid(), wallId, position, width, height: 210, type, swingDirection: 'left', flipSide: false };
}

function win(wallId: string, position: number, type: Window['type'] = 'standard', width = 120): Window {
  return { id: uid(), wallId, position, width, height: 120, sillHeight: 90, type };
}

function furniture(catalogId: string, x: number, y: number, rotation = 0, overrides?: Partial<FurnitureItem>): FurnitureItem {
  return { id: uid(), catalogId, position: { x, y }, rotation, scale: { x: 1, y: 1, z: 1 }, ...overrides };
}

function stair(x: number, y: number, rotation = 0, width = 120, depth = 280, direction: 'up' | 'down' = 'up'): Stair {
  return { id: uid(), position: { x, y }, rotation, width, depth, riserCount: 16, direction, stairType: 'straight' };
}

// ─── Template 1: Studio Apartment (~30m² = ~550x550cm) ───
function createStudioApartment(): Project {
  // Outer walls: 600x500
  const outer = rectWalls(0, 0, 600, 500);
  // Bathroom partition: bottom-left corner, 200x200
  const bathRight = wall(200, 300, 200, 500);
  const bathTop = wall(0, 300, 200, 300);
  // Closet partition: top-left corner 150x120
  const closetRight = wall(150, 0, 150, 120);
  const closetBottom = wall(0, 120, 150, 120);

  const walls = [...outer, bathRight, bathTop, closetRight, closetBottom];

  const doors: Door[] = [
    door(outer[2].id, 0.65),                    // front door (bottom wall)
    door(bathTop.id, 0.5),                       // bathroom door
    door(closetBottom.id, 0.5, 'sliding', 100),  // closet door
  ];

  const windows: Window[] = [
    win(outer[0].id, 0.6, 'standard', 150),     // top wall window
    win(outer[1].id, 0.3, 'standard', 100),     // right wall window
  ];

  const fur: FurnitureItem[] = [
    furniture('bed_twin', 400, 80, 0),
    furniture('loveseat', 300, 300, 0),
    furniture('dining_table', 480, 380, 0),
    furniture('toilet', 60, 400, 0),
    furniture('sink_b', 60, 340, 0),
  ];

  return makeProject('Studio Apartment', makeFloor(walls, doors, windows, fur));
}

// ─── Template 2: 1-Bedroom Apartment (~50m² = ~700x700) ───
function createOneBedroom(): Project {
  // Outer: 800x650
  const outer = rectWalls(0, 0, 800, 650);
  // Bedroom wall (left side, 350 wide)
  const bedroomRight = wall(350, 0, 350, 350);
  const bedroomBottom = wall(0, 350, 350, 350);
  // Bathroom (top-right corner, 200x250)
  const bathLeft = wall(600, 0, 600, 250);
  const bathBottom = wall(600, 250, 800, 250);
  // Kitchen divider (partial wall)
  const kitchenWall = wall(350, 450, 550, 450);

  const walls = [...outer, bedroomRight, bedroomBottom, bathLeft, bathBottom, kitchenWall];

  const doors: Door[] = [
    door(outer[2].id, 0.45),                     // front door
    door(bedroomBottom.id, 0.7),                  // bedroom door
    door(bathBottom.id, 0.5),                     // bathroom door
  ];

  const windows: Window[] = [
    win(outer[0].id, 0.2, 'standard', 140),      // bedroom window
    win(outer[0].id, 0.75, 'standard', 100),     // bathroom window
    win(outer[1].id, 0.5, 'standard', 150),      // living room window
    win(outer[2].id, 0.15, 'standard', 120),     // kitchen window
  ];

  const fur: FurnitureItem[] = [
    furniture('bed_queen', 120, 120, 0),
    furniture('wardrobe', 50, 280, 0),
    furniture('sofa', 500, 350, 180),
    furniture('dining_table', 420, 540, 0),
    furniture('toilet', 700, 60, 0),
    furniture('sink_b', 700, 170, 0),
  ];

  return makeProject('1-Bedroom Apartment', makeFloor(walls, doors, windows, fur));
}

// ─── Template 3: 2-Bedroom House (~80m² = ~1000x800) ───
function createTwoBedroom(): Project {
  // Outer: 1000x800
  const outer = rectWalls(0, 0, 1000, 800);
  // Hallway runs vertically at x=400, from y=0 to y=500
  const hallLeft = wall(400, 0, 400, 500);
  const hallRight = wall(520, 0, 520, 500);
  // Bedroom 1: top-left (400x400)
  const bed1Bottom = wall(0, 400, 400, 400);
  // Bedroom 2: top-right (480x400)
  const bed2Bottom = wall(520, 400, 1000, 400);
  // Bathroom: right side, 250x300 at bottom-right
  const bathLeft = wall(750, 500, 750, 800);
  const bathTop = wall(750, 500, 1000, 500);
  // Living/Kitchen: bottom area 750x300
  const livingTop = wall(0, 500, 750, 500);

  const walls = [...outer, hallLeft, hallRight, bed1Bottom, bed2Bottom, bathLeft, bathTop, livingTop];

  const doors: Door[] = [
    door(outer[2].id, 0.35),                      // front door
    door(bed1Bottom.id, 0.7),                      // bedroom 1
    door(bed2Bottom.id, 0.3),                      // bedroom 2
    door(bathTop.id, 0.4),                         // bathroom
    door(hallLeft.id, 0.9, 'single'),              // hall to living
  ];

  const windows: Window[] = [
    win(outer[0].id, 0.2, 'standard', 150),       // bed1 window
    win(outer[0].id, 0.75, 'standard', 150),      // bed2 window
    win(outer[3].id, 0.8, 'standard', 180),       // living window left
    win(outer[1].id, 0.8, 'standard', 150),       // living window right
    win(outer[2].id, 0.85, 'standard', 100),      // bathroom window
  ];

  const fur: FurnitureItem[] = [
    furniture('bed_queen', 150, 150, 0),
    furniture('bed_twin', 700, 150, 0),
    furniture('sofa', 200, 600, 0),
    furniture('dining_table', 500, 650, 0),
    furniture('toilet', 850, 600, 0),
    furniture('sink_b', 850, 720, 0),
  ];

  return makeProject('2-Bedroom House', makeFloor(walls, doors, windows, fur));
}

// ─── Template 4: Open Concept (~100m² = ~1200x850) ───
function createOpenConcept(): Project {
  // Outer: 1200x850
  const outer = rectWalls(0, 0, 1200, 850);
  // Bedrooms on the right side
  // Bedroom 1: top-right 400x400
  const bed1Left = wall(800, 0, 800, 400);
  const bed1Bottom = wall(800, 400, 1200, 400);
  // Bedroom 2: bottom-right 400x350
  const bed2Left = wall(800, 500, 800, 850);
  const bed2Top = wall(800, 500, 1200, 500);
  // Bathroom 1 (en-suite for bed1): 200x200 at top-right inner
  const bath1Left = wall(1000, 0, 1000, 200);
  const bath1Bottom = wall(1000, 200, 1200, 200);
  // Bathroom 2: between bedrooms
  const bath2Top = wall(800, 400, 1000, 400); // shared with bed1Bottom
  const bath2Right = wall(1000, 400, 1000, 500);
  const bath2Bottom = wall(800, 500, 1000, 500); // shared with bed2Top

  const walls = [...outer, bed1Left, bed1Bottom, bed2Left, bed2Top,
    bath1Left, bath1Bottom, bath2Right];

  const doors: Door[] = [
    door(outer[3].id, 0.5),                        // front door (left wall)
    door(bed1Left.id, 0.6),                        // bedroom 1
    door(bed2Left.id, 0.4),                        // bedroom 2
    door(bath1Bottom.id, 0.5),                     // en-suite
    door(bed1Bottom.id, 0.6),                      // bathroom 2 from hallway side
  ];

  const windows: Window[] = [
    win(outer[0].id, 0.3, 'sliding', 250),        // large living window
    win(outer[3].id, 0.2, 'standard', 150),       // kitchen window
    win(outer[1].id, 0.2, 'standard', 140),       // bed1 window
    win(outer[1].id, 0.8, 'standard', 140),       // bed2 window
    win(outer[2].id, 0.3, 'standard', 180),       // dining window
  ];

  const fur: FurnitureItem[] = [
    furniture('sofa', 200, 250, 0),
    furniture('dining_table', 350, 600, 0),
    furniture('bed_queen', 880, 100, 0),
    furniture('bed_queen', 880, 620, 0),
    furniture('toilet', 1080, 60, 0),
    furniture('sink_b', 1080, 140, 0),
    furniture('toilet', 880, 440, 0),
  ];

  return makeProject('Open Concept Home', makeFloor(walls, doors, windows, fur));
}

// ─── Template 5: L-Shaped House (~120m² = complex shape) ───
function createLShaped(): Project {
  // L-shape: main body 1400x600, extension 600x500 at bottom-left
  // Main outline
  const w1 = wall(0, 0, 1400, 0);         // top
  const w2 = wall(1400, 0, 1400, 600);    // right
  const w3 = wall(1400, 600, 600, 600);   // bottom-right
  const w4 = wall(600, 600, 600, 1100);   // inner corner down
  const w5 = wall(600, 1100, 0, 1100);    // bottom
  const w6 = wall(0, 1100, 0, 0);         // left

  // Interior walls
  // Garage: left portion 350x500 of bottom extension
  const garageRight = wall(350, 600, 350, 1100);
  const garageTop = wall(0, 600, 350, 600);  // partial top

  // Bedroom 1: top-left 400x350
  const bed1Right = wall(400, 0, 400, 350);
  const bed1Bottom = wall(0, 350, 400, 350);

  // Bedroom 2: top-middle 400x350
  const bed2Right = wall(800, 0, 800, 350);
  const bed2Bottom = wall(400, 350, 800, 350);

  // Bedroom 3: top-right 600x350
  const bed3Bottom = wall(800, 350, 1400, 350);

  // Bathroom 1: between bed1 and living, 200x250 at left
  const bath1Right = wall(200, 350, 200, 600);
  const bath1Top = wall(0, 350, 200, 350); // overlaps with bed1Bottom start... let's adjust
  // Actually bed1Bottom goes 0->400, bath1 is below it. Let's place bath at bottom-left of main
  // Simplify: bath1 at x=0,y=350 to x=200,y=600
  const bath1Bottom2 = wall(0, 600, 200, 600);

  // Bathroom 2: at x=800,y=350 to x=1000,y=600 
  const bath2Left = wall(800, 350, 800, 600);
  const bath2Top2 = wall(800, 350, 1000, 350); // overlap with bed3Bottom
  const bath2Right2 = wall(1000, 350, 1000, 600);

  // Hallway / living divider
  const hallWall = wall(200, 350, 200, 600);

  const walls = [w1, w2, w3, w4, w5, w6,
    garageRight, garageTop,
    bed1Right, bed1Bottom, bed2Right, bed2Bottom, bed3Bottom,
    bath1Right, bath1Bottom2,
    bath2Right2,
    hallWall];

  const doors: Door[] = [
    door(w3.id, 0.8),                              // front door
    door(garageTop.id, 0.5, 'double', 300),        // garage door (simplified)
    door(bed1Bottom.id, 0.6),                      // bed1
    door(bed2Bottom.id, 0.5),                      // bed2
    door(bed3Bottom.id, 0.3),                      // bed3
    door(bath1Right.id, 0.5),                      // bath1
    door(bath2Right2.id, 0.5),                     // bath2
    door(garageRight.id, 0.3),                     // garage interior door
  ];

  const windows: Window[] = [
    win(w1.id, 0.15, 'standard', 140),            // bed1 window
    win(w1.id, 0.45, 'standard', 140),            // bed2 window
    win(w1.id, 0.8, 'standard', 140),             // bed3 window
    win(w2.id, 0.3, 'standard', 120),             // bed3 side window
    win(w2.id, 0.7, 'standard', 180),             // living window
    win(w5.id, 0.7, 'standard', 150),             // extension window
    win(w6.id, 0.1, 'standard', 120),             // bed1 side
  ];

  const fur: FurnitureItem[] = [
    furniture('bed_queen', 150, 120, 0),
    furniture('bed_queen', 550, 120, 0),
    furniture('bed_twin', 1050, 120, 0),
    furniture('sofa', 500, 450, 0),
    furniture('dining_table', 1100, 470, 0),
    furniture('toilet', 80, 450, 0),
    furniture('sink_b', 80, 530, 0),
    furniture('toilet', 880, 450, 0),
    furniture('sink_b', 880, 530, 0),
  ];

  return makeProject('L-Shaped House', makeFloor(walls, doors, windows, fur));
}

// ─── Template 6: Casa Térrea 100 m² (Terreno 6.5 x 15.5m) ───
function createHouse100(): Project {
  const wFront = wall(50, 250, 600, 250);
  const wRight = wall(600, 250, 600, 1250);
  const wBack = wall(600, 1250, 50, 1250);
  const wLeft = wall(50, 1250, 50, 250);

  const wDivLivingBed = wall(50, 650, 600, 650);
  const wDivKitchen = wall(350, 250, 350, 520);
  const wHallLeft = wall(240, 650, 240, 950);
  const wHallRight = wall(340, 650, 340, 1250);
  const wBathBed = wall(50, 920, 240, 920);

  const walls: Wall[] = [wFront, wRight, wBack, wLeft, wDivLivingBed, wDivKitchen, wHallLeft, wHallRight, wBathBed];

  const doors: Door[] = [
    door(wFront.id, 0.25, 'single', 90),
    door(wBack.id, 0.7, 'single', 80),
    door(wHallLeft.id, 0.3, 'single', 70),
    door(wHallLeft.id, 0.8, 'single', 80),
    door(wHallRight.id, 0.3, 'single', 80),
  ];

  const windows: Window[] = [
    win(wFront.id, 0.75, 'sliding', 140),
    win(wBack.id, 0.3, 'standard', 120),
    win(wRight.id, 0.8, 'sliding', 150),
    win(wLeft.id, 0.45, 'fixed', 60),
    win(wLeft.id, 0.2, 'sliding', 160),
  ];

  const fur: FurnitureItem[] = [
    furniture('car_compact', 210, 15, 0),
    furniture('sofa', 160, 420, 0),
    furniture('coffee_table', 160, 480, 0),
    furniture('tv_stand', 160, 620, 180),
    furniture('dining_table', 480, 450, 0),
    furniture('counter', 550, 280, 0),
    furniture('sink_k', 480, 280, 0),
    furniture('stove', 400, 280, 0),
    furniture('fridge', 560, 380, 90),
    furniture('toilet', 90, 880, 0),
    furniture('sink_b', 160, 880, 0),
    furniture('shower', 90, 720, 0),
    furniture('bed_twin', 120, 1100, 0),
    furniture('desk', 180, 1200, 180),
    furniture('wardrobe', 100, 980, 90),
    furniture('bed_queen', 470, 950, 0),
    furniture('nightstand', 380, 950, 0),
    furniture('nightstand', 560, 950, 0),
    furniture('wardrobe', 550, 1200, 180),
    furniture('electrical_panel', 60, 270, 0, { elevation: 160, color: '#334155' }),
    furniture('wall_switch', 110, 260, 0, { elevation: 110, color: '#2563eb' }),
    furniture('junction_box', 200, 260, 0, { elevation: 220, color: '#22c55e' }),
    furniture('conduit_rigid', 250, 260, 0, { width: 120, elevation: 220, color: '#22c55e' }),
    furniture('wall_outlet', 300, 640, 180, { elevation: 30, color: '#2563eb' }),
  ];

  // Lot 6,5 x 16 m (~104 m²): house moved back to leave a front yard for the car
  shiftPlanY(walls, fur, 200);
  const fence = lotFence(650, 1600, 210, 540);
  walls.push(...fence.walls);
  doors.push(...fence.doors);
  fur.push(
    ...streetFront(650, 540),
    furniture('driveway', 210, 232, 0, { width: 300, depth: 430 }),
    lawn(497, 232, 235, 420),
    walkPath(540, 232, 100, 420),
    furniture('bush_small', 400, 40, 0), furniture('bush', 620, 40, 0), furniture('flower_bed', 480, 420, 0),
    furniture('tree_small', 580, 380, 0),
    lawn(325, 1525, 600, 130),
    furniture('tree_small', 100, 1540, 0), furniture('bush', 560, 1540, 0),
  );
  return makeProject('Casa Térrea 100 m²', makeFloor(walls, doors, windows, fur));
}

// ─── Template 7: Residência Moderna 200 m² (Terreno 10 x 20m) ───
function createHouse200(): Project {
  const wFrontL = wall(100, 150, 550, 150);
  const wFrontR = wall(550, 250, 900, 250);
  const wRight = wall(900, 250, 900, 1650);
  const wBack = wall(900, 1650, 100, 1650);
  const wLeft = wall(100, 1650, 100, 150);

  const wGarageBack = wall(100, 650, 550, 650);
  const wCentralHall = wall(550, 150, 550, 1650);
  const wLivingGourmet = wall(550, 1150, 900, 1150);
  const wSuiteDiv = wall(100, 1150, 550, 1150);
  const wBedDiv = wall(100, 1400, 550, 1400);
  const wSuiteBath = wall(100, 920, 320, 920);
  const wSuiteBath2 = wall(320, 650, 320, 920);
  const wSocialBath = wall(380, 1150, 380, 1400);

  const walls: Wall[] = [
    wFrontL, wFrontR, wRight, wBack, wLeft,
    wGarageBack, wCentralHall, wLivingGourmet, wSuiteDiv, wBedDiv,
    wSuiteBath, wSuiteBath2, wSocialBath,
  ];

  const doors: Door[] = [
    door(wFrontR.id, 0.25, 'single', 100),
    door(wGarageBack.id, 0.8, 'single', 90),
    door(wLivingGourmet.id, 0.5, 'sliding', 200),
    door(wBack.id, 0.75, 'sliding', 200),
    door(wSuiteDiv.id, 0.8, 'single', 80),
    door(wSuiteBath.id, 0.5, 'single', 70),
    door(wBedDiv.id, 0.8, 'single', 80),
    door(wSocialBath.id, 0.4, 'single', 70),
  ];

  const windows: Window[] = [
    win(wFrontR.id, 0.75, 'standard', 180),
    win(wRight.id, 0.35, 'sliding', 200),
    win(wLeft.id, 0.5, 'sliding', 150),
    win(wBack.id, 0.3, 'sliding', 150),
    win(wLeft.id, 0.75, 'standard', 60),
  ];

  const fur: FurnitureItem[] = [
    furniture('car_sedan', 240, 400, 0),
    furniture('car_suv', 420, 400, 0),
    furniture('sofa', 720, 480, 0),
    furniture('coffee_table', 720, 560, 0),
    furniture('tv_stand', 720, 300, 0),
    furniture('dining_table', 720, 800, 0),
    furniture('counter', 850, 1000, 90),
    furniture('fridge', 850, 1100, 90),
    furniture('sink_k', 620, 1000, 0),
    furniture('stove', 700, 1000, 0),
    furniture('bbq_grill', 840, 1300, 270),
    furniture('patio_table', 720, 1400, 0),
    furniture('bench_outdoor', 850, 1550, 90),
    furniture('bed_queen', 240, 800, 0),
    furniture('nightstand', 130, 800, 0),
    furniture('nightstand', 350, 800, 0),
    furniture('wardrobe', 450, 800, 90),
    furniture('toilet', 160, 720, 0),
    furniture('sink_b', 240, 720, 0),
    furniture('shower', 160, 860, 0),
    furniture('bed_queen', 240, 1280, 0),
    furniture('wardrobe', 150, 1360, 180),
    furniture('desk', 200, 1550, 0),
    furniture('bookshelf', 140, 1500, 90),
    furniture('bed_twin', 450, 1550, 0),
    furniture('toilet', 450, 1220, 0),
    furniture('sink_b', 500, 1220, 0),
    furniture('shower', 450, 1340, 0),
    furniture('electrical_panel', 540, 270, 270, { elevation: 160, color: '#334155' }),
    furniture('conduit_rigid', 600, 260, 0, { width: 140, elevation: 220, color: '#22c55e' }),
    furniture('wall_switch', 570, 270, 0, { elevation: 110, color: '#2563eb' }),
    furniture('junction_box', 720, 260, 0, { elevation: 220, color: '#eab308' }),
  ];

  // Lot 10 x 20 m (200 m²) with perimeter wall: ~120 m² built, rest is yard
  doors.push(door(wFrontL.id, 0.5, 'garage', 400));
  const fence = lotFence(1000, 2000, 325, 640);
  walls.push(...fence.walls);
  doors.push(...fence.doors);
  fur.push(
    ...streetFront(1000, 640),
    furniture('driveway', 325, 82, 0, { width: 300, depth: 135 }),
    lawn(785, 135, 220, 210),
    walkPath(640, 135, 100, 220),
    furniture('bush', 700, 40, 0), furniture('bush_small', 880, 40, 0),
    furniture('hedge_row', 50, 900, 90, { width: 1000, depth: 50 }),
    furniture('hedge_row', 950, 1000, 90, { width: 1400, depth: 50 }),
    lawn(500, 1830, 900, 310),
    furniture('tree_default', 820, 1880, 0), furniture('tree_small', 170, 1900, 0),
    furniture('bush_large', 500, 1950, 0), furniture('flower_bed', 300, 1700, 0),
  );
  return makeProject('Residência Moderna 200 m²', makeFloor(walls, doors, windows, fur));
}

// ─── Template 8: Casa Alto Padrão 300 m² (Terreno 10 x 30m com Piscina) ───
function createHouse300(): Project {
  const wFront = wall(80, 100, 920, 100);
  const wRight = wall(920, 100, 920, 2200);
  const wBack = wall(920, 2200, 80, 2200);
  const wLeft = wall(80, 2200, 80, 100);

  const wGarageBack = wall(80, 600, 550, 600);
  const wCenterSpine = wall(550, 100, 550, 2200);
  const wOfficeDiv = wall(550, 500, 920, 500);
  const wLivingDiv = wall(80, 1200, 550, 1200);
  const wKitchenDiv = wall(550, 1150, 920, 1150);
  const wLaundryDiv = wall(750, 1150, 750, 1550);
  const wLaundryBack = wall(550, 1550, 920, 1550);
  const wSuite1Back = wall(80, 1750, 550, 1750);
  const wGourmetDiv = wall(550, 1900, 920, 1900);

  const walls: Wall[] = [
    wFront, wRight, wBack, wLeft,
    wGarageBack, wCenterSpine, wOfficeDiv, wLivingDiv,
    wKitchenDiv, wLaundryDiv, wLaundryBack, wSuite1Back, wGourmetDiv,
  ];

  const doors: Door[] = [
    door(wFront.id, 0.75, 'single', 110),
    door(wGarageBack.id, 0.7, 'single', 90),
    door(wOfficeDiv.id, 0.3, 'single', 90),
    door(wBack.id, 0.7, 'sliding', 240),
    door(wBack.id, 0.3, 'sliding', 180),
    door(wLivingDiv.id, 0.5, 'single', 90),
    door(wLaundryDiv.id, 0.5, 'single', 80),
  ];

  const windows: Window[] = [
    win(wFront.id, 0.85, 'standard', 160),
    win(wRight.id, 0.25, 'sliding', 220),
    win(wRight.id, 0.5, 'sliding', 160),
    win(wLeft.id, 0.35, 'sliding', 200),
    win(wLeft.id, 0.75, 'sliding', 180),
  ];

  const fur: FurnitureItem[] = [
    furniture('car_suv', 220, 350, 0),
    furniture('car_sedan', 420, 350, 0),
    furniture('desk', 750, 300, 0),
    furniture('bookshelf', 900, 250, 270),
    furniture('bookshelf', 900, 400, 270),
    furniture('sofa', 320, 850, 0),
    furniture('coffee_table', 320, 950, 0),
    furniture('tv_stand', 100, 850, 90),
    furniture('counter', 750, 850, 0),
    furniture('counter', 900, 850, 270),
    furniture('fridge', 900, 680, 270),
    furniture('dining_table', 750, 1050, 0),
    furniture('washer_dryer', 850, 1300, 0),
    furniture('washer_dryer', 850, 1400, 0),
    furniture('bed_queen', 320, 1450, 0),
    furniture('nightstand', 210, 1450, 0),
    furniture('nightstand', 430, 1450, 0),
    furniture('wardrobe', 530, 1450, 270),
    furniture('bathtub', 150, 1650, 90),
    furniture('toilet', 260, 1700, 0),
    furniture('sink_b', 340, 1700, 0),
    furniture('bed_queen', 320, 1950, 0),
    furniture('wardrobe', 150, 2100, 180),
    furniture('toilet', 480, 1820, 0),
    furniture('sink_b', 480, 1900, 0),
    furniture('bbq_grill', 890, 2050, 270),
    furniture('patio_table', 750, 2050, 0),
    furniture('bench_outdoor', 600, 2150, 0),
    furniture('pool_rectangular', 500, 2550, 0),
    furniture('lounger', 180, 2450, 0),
    furniture('lounger', 180, 2650, 0),
    furniture('umbrella', 220, 2550, 0),
    furniture('fountain', 850, 2550, 0),
    furniture('umbrella', 850, 2750, 0),
    furniture('electrical_panel', 560, 120, 0, { elevation: 160, color: '#334155' }),
    furniture('conduit_rigid', 640, 110, 0, { width: 150, elevation: 220, color: '#2563eb' }),
    furniture('junction_box', 750, 110, 0, { elevation: 220, color: '#22c55e' }),
    furniture('wall_switch', 580, 120, 0, { elevation: 110, color: '#2563eb' }),
  ];

  // Lot 10 x 30 m (300 m²) with perimeter wall: ~176 m² built, rest is yard and pool area
  doors.push(door(wFront.id, 0.28, 'garage', 400));
  const fence = lotFence(1000, 3000, 315, 710);
  walls.push(...fence.walls);
  doors.push(...fence.doors);
  fur.push(
    ...streetFront(1000, 710),
    furniture('driveway', 315, 57, 0, { width: 300, depth: 85 }),
    walkPath(710, 57, 100, 85),
    lawn(960, 1200, 80, 2000),
    furniture('hedge_row', 40, 1200, 90, { width: 2000, depth: 50 }),
    furniture('hedge_row', 975, 1200, 90, { width: 2000, depth: 50 }),
    lawn(500, 2300, 900, 170),
    lawn(500, 2850, 900, 280),
    furniture('tree_default', 880, 2900, 0), furniture('tree_small', 110, 2900, 0),
    furniture('tree_palm', 120, 2300, 0), furniture('bush_large', 500, 2950, 0),
  );
  return makeProject('Casa Alto Padrão 300 m²', makeFloor(walls, doors, windows, fur));
}

// ─── Template 9: Mini Predinho 200 m² (Terreno 10 x 20m - 3 Pavimentos) ───
function createBuilding200(): Project {
  const wFront0 = wall(100, 100, 900, 100);
  const wRight0 = wall(900, 100, 900, 1900);
  const wBack0 = wall(900, 1900, 100, 1900);
  const wLeft0 = wall(100, 1900, 100, 100);
  const wStairL0 = wall(420, 800, 420, 1200);
  const wStairR0 = wall(580, 800, 580, 1200);
  const wStairB0 = wall(420, 1200, 580, 1200);
  const wHallF0 = wall(420, 800, 580, 800);

  const walls0: Wall[] = [wFront0, wRight0, wBack0, wLeft0, wStairL0, wStairR0, wStairB0, wHallF0];
  const doors0: Door[] = [
    door(wFront0.id, 0.5, 'sliding', 200),
    door(wHallF0.id, 0.5, 'single', 90),
  ];
  const windows0: Window[] = [
    win(wRight0.id, 0.5, 'standard', 120),
    win(wLeft0.id, 0.5, 'standard', 120),
  ];
  const fur0: FurnitureItem[] = [
    furniture('car_sedan', 250, 450, 0),
    furniture('car_suv', 750, 450, 0),
    furniture('car_compact', 250, 1550, 0),
    furniture('car_sedan', 750, 1550, 0),
    furniture('electrical_panel', 440, 790, 0, { elevation: 160 }),
  ];
  const stairs0: Stair[] = [
    stair(500, 1000, 0, 120, 280, 'up'),
  ];
  // Lot perimeter wall (muro) with garage and pedestrian gates
  const fence = lotFence(1000, 2000, 500, 150);
  walls0.push(...fence.walls);
  doors0.push(...fence.doors);
  fur0.push(
    ...streetFront(1000, 150),
    furniture('driveway', 500, 57, 0, { width: 300, depth: 85 }),
    furniture('bush', 40, 60, 0), furniture('bush', 960, 60, 0),
    furniture('hedge_row', 50, 1000, 90, { width: 1800, depth: 50 }),
    furniture('hedge_row', 950, 1000, 90, { width: 1800, depth: 50 }),
    furniture('tree_small', 500, 1960, 0),
  );
  const floor0 = makeCustomFloor('Térreo (Garagens)', 0, 0, walls0, doors0, windows0, fur0, stairs0);

  function createApartmentFloor(level: number, name: string): Floor {
    const elevation = level * 280;
    const wFront = wall(100, 100, 900, 100);
    const wRight = wall(900, 100, 900, 1900);
    const wBack = wall(900, 1900, 100, 1900);
    const wLeft = wall(100, 1900, 100, 100);

    const wHallTop = wall(380, 800, 620, 800);
    const wHallBottom = wall(380, 1200, 620, 1200);
    const wStairL = wall(380, 800, 380, 1200);
    const wStairR = wall(620, 800, 620, 1200);

    const wApt1Bed = wall(100, 500, 500, 500);
    const wApt1Bath = wall(500, 100, 500, 500);
    const wApt1Div = wall(100, 800, 900, 800);

    const wApt2Div = wall(100, 1200, 900, 1200);
    const wApt2Bed = wall(100, 1500, 500, 1500);
    const wApt2Bath = wall(500, 1500, 500, 1900);

    const fWalls: Wall[] = [
      wFront, wRight, wBack, wLeft,
      wHallTop, wHallBottom, wStairL, wStairR,
      wApt1Div, wApt1Bed, wApt1Bath,
      wApt2Div, wApt2Bed, wApt2Bath,
    ];

    const fDoors: Door[] = [
      door(wHallTop.id, 0.5, 'single', 90),
      door(wHallBottom.id, 0.5, 'single', 90),
      door(wApt1Bed.id, 0.3, 'single', 80),
      door(wApt1Bath.id, 0.5, 'single', 70),
      door(wApt2Bed.id, 0.3, 'single', 80),
      door(wApt2Bath.id, 0.5, 'single', 70),
      door(wFront.id, 0.25, 'sliding', 150),
      door(wBack.id, 0.25, 'sliding', 150),
    ];

    const fWindows: Window[] = [
      win(wFront.id, 0.75, 'sliding', 140),
      win(wRight.id, 0.25, 'standard', 120),
      win(wRight.id, 0.75, 'standard', 120),
      win(wBack.id, 0.75, 'sliding', 140),
      win(wLeft.id, 0.25, 'fixed', 60),
      win(wLeft.id, 0.75, 'fixed', 60),
    ];

    const fFur: FurnitureItem[] = [
      furniture('sofa', 700, 450, 0),
      furniture('tv_stand', 900, 450, 270),
      furniture('counter', 700, 650, 0),
      furniture('sink_k', 620, 650, 0),
      furniture('dining_table', 700, 250, 0),
      furniture('bed_queen', 300, 300, 0),
      furniture('wardrobe', 120, 300, 90),
      furniture('toilet', 560, 250, 0),
      furniture('sink_b', 560, 350, 0),
      furniture('sofa', 700, 1550, 0),
      furniture('tv_stand', 900, 1550, 270),
      furniture('counter', 700, 1350, 0),
      furniture('sink_k', 620, 1350, 0),
      furniture('dining_table', 700, 1750, 0),
      furniture('bed_queen', 300, 1700, 0),
      furniture('wardrobe', 120, 1700, 90),
      furniture('toilet', 560, 1650, 0),
      furniture('sink_b', 560, 1750, 0),
      furniture('electrical_panel', 640, 780, 0, { elevation: 160 }),
      furniture('conduit_rigid', 720, 790, 0, { width: 120, elevation: 220, color: '#22c55e' }),
    ];

    const fStairs: Stair[] = [
      stair(500, 1000, 0, 120, 280, level === 1 ? 'up' : 'down'),
    ];

    return makeCustomFloor(name, level, elevation, fWalls, fDoors, fWindows, fFur, fStairs);
  }

  const floor1 = createApartmentFloor(1, '1º Pavimento (Aptos 101 e 102)');
  const floor2 = createApartmentFloor(2, '2º Pavimento (Aptos 201 e 202)');

  return makeMultiFloorProject('Mini Predinho 200 m²', [floor0, floor1, floor2]);
}

// ─── Template 10: Mini Predinho 300 m² (Terreno 10 x 30m - 3 Pavimentos) ───
function createBuilding300(): Project {
  // Ground floor with 6 car spaces and entrance
  const wFront0 = wall(100, 100, 900, 100);
  const wRight0 = wall(900, 100, 900, 2900);
  const wBack0 = wall(900, 2900, 100, 2900);
  const wLeft0 = wall(100, 2900, 100, 100);
  const wHall0 = wall(380, 100, 620, 100);
  const wStairL0 = wall(420, 1300, 420, 1700);
  const wStairR0 = wall(580, 1300, 580, 1700);
  const wStairF0 = wall(420, 1300, 580, 1300);
  const wStairB0 = wall(420, 1700, 580, 1700);

  const walls0: Wall[] = [wFront0, wRight0, wBack0, wLeft0, wStairL0, wStairR0, wStairF0, wStairB0];
  const doors0: Door[] = [
    door(wFront0.id, 0.5, 'sliding', 240),
    door(wStairF0.id, 0.5, 'single', 90),
  ];
  const windows0: Window[] = [
    win(wRight0.id, 0.3, 'standard', 120),
    win(wRight0.id, 0.7, 'standard', 120),
    win(wLeft0.id, 0.3, 'standard', 120),
    win(wLeft0.id, 0.7, 'standard', 120),
  ];
  const fur0: FurnitureItem[] = [
    furniture('car_sedan', 250, 450, 0),
    furniture('car_suv', 750, 450, 0),
    furniture('car_sedan', 250, 1000, 0),
    furniture('car_compact', 750, 1000, 0),
    furniture('car_suv', 250, 2200, 0),
    furniture('car_sedan', 750, 2200, 0),
    furniture('electrical_panel', 440, 1280, 0, { elevation: 160 }),
  ];
  const stairs0: Stair[] = [
    stair(500, 1500, 0, 120, 280, 'up'),
  ];
  // Lot perimeter wall (muro) with garage and pedestrian gates
  const fence = lotFence(1000, 3000, 500, 150);
  walls0.push(...fence.walls);
  doors0.push(...fence.doors);
  fur0.push(
    ...streetFront(1000, 150),
    furniture('driveway', 500, 57, 0, { width: 300, depth: 85 }),
    furniture('bush', 40, 60, 0), furniture('bush', 960, 60, 0),
    furniture('hedge_row', 50, 1500, 90, { width: 2800, depth: 50 }),
    furniture('hedge_row', 950, 1500, 90, { width: 2800, depth: 50 }),
    furniture('tree_small', 300, 2960, 0), furniture('tree_small', 700, 2960, 0),
  );
  const floor0 = makeCustomFloor('Térreo (6 Garagens)', 0, 0, walls0, doors0, windows0, fur0, stairs0);

  function createUpperFloor(level: number, name: string): Floor {
    const elevation = level * 280;
    const wFront = wall(100, 100, 900, 100);
    const wRight = wall(900, 100, 900, 2900);
    const wBack = wall(900, 2900, 100, 2900);
    const wLeft = wall(100, 2900, 100, 100);

    // Central circulation & stair
    const wHallTop = wall(380, 1300, 620, 1300);
    const wHallBottom = wall(380, 1700, 620, 1700);
    const wStairL = wall(380, 1300, 380, 1700);
    const wStairR = wall(620, 1300, 620, 1700);

    // Apt 1 (Front, 2 bedrooms)
    const wApt1Div = wall(100, 1300, 900, 1300);
    const wApt1Spine = wall(500, 100, 500, 1300);
    const wApt1Bed1 = wall(100, 700, 500, 700);
    const wApt1Bath = wall(500, 900, 900, 900);

    // Apt 2 (Rear, 2 bedrooms)
    const wApt2Div = wall(100, 1700, 900, 1700);
    const wApt2Spine = wall(500, 1700, 500, 2900);
    const wApt2Bed1 = wall(100, 2300, 500, 2300);
    const wApt2Bath = wall(500, 2100, 900, 2100);

    const fWalls: Wall[] = [
      wFront, wRight, wBack, wLeft,
      wHallTop, wHallBottom, wStairL, wStairR,
      wApt1Div, wApt1Spine, wApt1Bed1, wApt1Bath,
      wApt2Div, wApt2Spine, wApt2Bed1, wApt2Bath,
    ];

    const fDoors: Door[] = [
      door(wHallTop.id, 0.5, 'single', 90),
      door(wHallBottom.id, 0.5, 'single', 90),
      door(wApt1Bed1.id, 0.5, 'single', 80),
      door(wApt1Bath.id, 0.3, 'single', 70),
      door(wApt2Bed1.id, 0.5, 'single', 80),
      door(wApt2Bath.id, 0.3, 'single', 70),
      door(wFront.id, 0.75, 'sliding', 160),
      door(wBack.id, 0.75, 'sliding', 160),
    ];

    const fWindows: Window[] = [
      win(wFront.id, 0.25, 'sliding', 140),
      win(wRight.id, 0.2, 'sliding', 150),
      win(wRight.id, 0.8, 'sliding', 150),
      win(wBack.id, 0.25, 'sliding', 140),
      win(wLeft.id, 0.2, 'sliding', 140),
      win(wLeft.id, 0.8, 'sliding', 140),
    ];

    const fFur: FurnitureItem[] = [
      // Apt 1
      furniture('sofa', 700, 500, 0),
      furniture('dining_table', 700, 750, 0),
      furniture('counter', 850, 1100, 90),
      furniture('bed_queen', 300, 400, 0),
      furniture('bed_twin', 300, 1000, 0),
      furniture('toilet', 750, 980, 0),
      furniture('sink_b', 820, 980, 0),
      // Apt 2
      furniture('sofa', 700, 2500, 0),
      furniture('dining_table', 700, 2250, 0),
      furniture('counter', 850, 1900, 90),
      furniture('bed_queen', 300, 2600, 0),
      furniture('bed_twin', 300, 2000, 0),
      furniture('toilet', 750, 2020, 0),
      furniture('sink_b', 820, 2020, 0),
      // Electrical
      furniture('electrical_panel', 640, 1280, 0, { elevation: 160 }),
      furniture('conduit_rigid', 720, 1290, 0, { width: 140, elevation: 220, color: '#eab308' }),
    ];

    const fStairs: Stair[] = [
      stair(500, 1500, 0, 120, 280, level === 1 ? 'up' : 'down'),
    ];

    return makeCustomFloor(name, level, elevation, fWalls, fDoors, fWindows, fFur, fStairs);
  }

  const floor1 = createUpperFloor(1, '1º Pavimento (Aptos 101 e 102)');
  const floor2 = createUpperFloor(2, '2º Pavimento (Aptos 201 e 202)');

  return makeMultiFloorProject('Mini Predinho 300 m²', [floor0, floor1, floor2]);
}

// ─── Template 11: Mini Predinho 400 m² (Terreno 16 x 25m - 3 Pavimentos, 8 Apartamentos) ───
function createBuilding400(): Project {
  // Ground floor: 8 parking bays, portaria, central elevator & stair core
  const wFront0 = wall(100, 100, 1500, 100);
  const wRight0 = wall(1500, 100, 1500, 2400);
  const wBack0 = wall(1500, 2400, 100, 2400);
  const wLeft0 = wall(100, 2400, 100, 100);

  // Central Core: Stair & Elevator
  const wCoreTop0 = wall(680, 1000, 920, 1000);
  const wCoreBot0 = wall(680, 1500, 920, 1500);
  const wCoreLeft0 = wall(680, 1000, 680, 1500);
  const wCoreRight0 = wall(920, 1000, 920, 1500);

  const walls0: Wall[] = [wFront0, wRight0, wBack0, wLeft0, wCoreTop0, wCoreBot0, wCoreLeft0, wCoreRight0];
  const doors0: Door[] = [
    door(wFront0.id, 0.5, 'sliding', 240),
    door(wCoreTop0.id, 0.5, 'single', 90),
  ];
  const windows0: Window[] = [
    win(wRight0.id, 0.5, 'standard', 140),
    win(wLeft0.id, 0.5, 'standard', 140),
  ];
  const fur0: FurnitureItem[] = [
    furniture('car_sedan', 250, 450, 0),
    furniture('car_suv', 550, 450, 0),
    furniture('car_sedan', 1050, 450, 0),
    furniture('car_compact', 1350, 450, 0),
    furniture('car_suv', 250, 2050, 0),
    furniture('car_sedan', 550, 2050, 0),
    furniture('car_compact', 1050, 2050, 0),
    furniture('car_sedan', 1350, 2050, 0),
    furniture('electrical_panel', 700, 980, 0, { elevation: 160 }),
  ];
  const stairs0: Stair[] = [
    stair(800, 1250, 0, 120, 280, 'up'),
  ];
  // Lot perimeter wall (muro) with garage and pedestrian gates
  const fence = lotFence(1600, 2500, 800, 200);
  walls0.push(...fence.walls);
  doors0.push(...fence.doors);
  fur0.push(
    ...streetFront(1600, 200),
    furniture('driveway', 800, 57, 0, { width: 300, depth: 85 }),
    furniture('bush', 40, 60, 0), furniture('bush', 1560, 60, 0),
    furniture('hedge_row', 50, 1250, 90, { width: 2300, depth: 50 }),
    furniture('hedge_row', 1550, 1250, 90, { width: 2300, depth: 50 }),
    furniture('tree_small', 400, 2460, 0), furniture('tree_small', 1200, 2460, 0),
  );
  const floor0 = makeCustomFloor('Térreo (8 Garagens & Hall)', 0, 0, walls0, doors0, windows0, fur0, stairs0);

  function createQuadApartmentFloor(level: number, name: string): Floor {
    const elevation = level * 280;
    const wFront = wall(100, 100, 1500, 100);
    const wRight = wall(1500, 100, 1500, 2400);
    const wBack = wall(1500, 2400, 100, 2400);
    const wLeft = wall(100, 2400, 100, 100);

    // Central Core & Hall
    const wCoreTop = wall(680, 1000, 920, 1000);
    const wCoreBot = wall(680, 1500, 920, 1500);
    const wCoreL = wall(680, 1000, 680, 1500);
    const wCoreR = wall(920, 1000, 920, 1500);

    // Cross dividing walls separating 4 apartments
    const wDivVertTop = wall(800, 100, 800, 1000);
    const wDivVertBot = wall(800, 1500, 800, 2400);
    const wDivHorizL = wall(100, 1250, 680, 1250);
    const wDivHorizR = wall(920, 1250, 1500, 1250);

    // Internal bath & bedroom partitions
    const wBathApt1 = wall(550, 100, 550, 500);
    const wBathApt2 = wall(1050, 100, 1050, 500);
    const wBathApt3 = wall(550, 2000, 550, 2400);
    const wBathApt4 = wall(1050, 2000, 1050, 2400);

    const fWalls: Wall[] = [
      wFront, wRight, wBack, wLeft,
      wCoreTop, wCoreBot, wCoreL, wCoreR,
      wDivVertTop, wDivVertBot, wDivHorizL, wDivHorizR,
      wBathApt1, wBathApt2, wBathApt3, wBathApt4,
    ];

    const fDoors: Door[] = [
      door(wDivHorizL.id, 0.75, 'single', 90), // Apt 1 entrance
      door(wDivHorizR.id, 0.25, 'single', 90), // Apt 2 entrance
      door(wDivHorizL.id, 0.75, 'single', 90), // Apt 3 entrance
      door(wDivHorizR.id, 0.25, 'single', 90), // Apt 4 entrance
      door(wBathApt1.id, 0.5, 'single', 70),
      door(wBathApt2.id, 0.5, 'single', 70),
      door(wBathApt3.id, 0.5, 'single', 70),
      door(wBathApt4.id, 0.5, 'single', 70),
      door(wFront.id, 0.25, 'sliding', 140),
      door(wFront.id, 0.75, 'sliding', 140),
      door(wBack.id, 0.25, 'sliding', 140),
      door(wBack.id, 0.75, 'sliding', 140),
    ];

    const fWindows: Window[] = [
      win(wLeft.id, 0.25, 'sliding', 150),
      win(wLeft.id, 0.75, 'sliding', 150),
      win(wRight.id, 0.25, 'sliding', 150),
      win(wRight.id, 0.75, 'sliding', 150),
    ];

    const fFur: FurnitureItem[] = [
      // Apt 1 (Front Left)
      furniture('sofa', 350, 750, 0),
      furniture('dining_table', 350, 950, 0),
      furniture('counter', 600, 950, 0),
      furniture('bed_queen', 350, 300, 0),
      furniture('toilet', 700, 250, 0),
      furniture('sink_b', 700, 350, 0),
      // Apt 2 (Front Right)
      furniture('sofa', 1250, 750, 0),
      furniture('dining_table', 1250, 950, 0),
      furniture('counter', 1000, 950, 0),
      furniture('bed_queen', 1250, 300, 0),
      furniture('toilet', 900, 250, 0),
      furniture('sink_b', 900, 350, 0),
      // Apt 3 (Rear Left)
      furniture('sofa', 350, 1650, 0),
      furniture('dining_table', 350, 1450, 0),
      furniture('counter', 600, 1450, 0),
      furniture('bed_queen', 350, 2150, 0),
      furniture('toilet', 700, 2200, 0),
      furniture('sink_b', 700, 2100, 0),
      // Apt 4 (Rear Right)
      furniture('sofa', 1250, 1650, 0),
      furniture('dining_table', 1250, 1450, 0),
      furniture('counter', 1000, 1450, 0),
      furniture('bed_queen', 1250, 2150, 0),
      furniture('toilet', 900, 2200, 0),
      furniture('sink_b', 900, 2100, 0),
      // Central electrical panel and conduit
      furniture('electrical_panel', 800, 980, 0, { elevation: 160 }),
      furniture('conduit_rigid', 800, 970, 0, { width: 140, elevation: 220, color: '#2563eb' }),
    ];

    const fStairs: Stair[] = [
      stair(800, 1250, 0, 120, 280, level === 1 ? 'up' : 'down'),
    ];

    return makeCustomFloor(name, level, elevation, fWalls, fDoors, fWindows, fFur, fStairs);
  }

  const floor1 = createQuadApartmentFloor(1, '1º Pavimento (Aptos 101 a 104)');
  const floor2 = createQuadApartmentFloor(2, '2º Pavimento (Aptos 201 a 204)');

  return makeMultiFloorProject('Mini Predinho 400 m²', [floor0, floor1, floor2]);
}

export const houseTemplates: HouseTemplate[] = [
  {
    name: 'Studio Apartment',
    description: 'Open plan living/kitchen, bathroom, closet',
    icon: '🏢',
    area: '~30m²',
    tags: ['apartment', 'small', 'open-plan'],
    create: createStudioApartment,
  },
  {
    name: '1-Bedroom Apartment',
    description: 'Bedroom, living room, kitchen, bathroom',
    icon: '🏠',
    area: '~50m²',
    tags: ['apartment', 'medium'],
    create: createOneBedroom,
  },
  {
    name: '2-Bedroom House',
    description: '2 bedrooms, living room, kitchen, bathroom, hallway',
    icon: '🏡',
    area: '~80m²',
    tags: ['house', 'family'],
    create: createTwoBedroom,
  },
  {
    name: 'Open Concept Home',
    description: 'Large open living/kitchen/dining, 2 bedrooms, 2 bathrooms',
    icon: '✨',
    area: '~100m²',
    tags: ['house', 'modern', 'open-plan'],
    create: createOpenConcept,
  },
  {
    name: 'L-Shaped House',
    description: 'L-shaped layout with garage, 3 bedrooms, 2 bathrooms',
    icon: '🏘️',
    area: '~120m²',
    tags: ['house', 'large', 'garage'],
    create: createLShaped,
  },
  {
    name: 'Casa Térrea 100 m²',
    description: '2 quartos, sala e cozinha integradas, banheiro social, vaga e quintal',
    icon: '🏡',
    area: '100m²',
    tags: ['house', 'compact', '100m2'],
    create: createHouse100,
  },
  {
    name: 'Residência Moderna 200 m²',
    description: 'Garagem dupla, 3 quartos (1 suíte com closet), varanda gourmet com churrasqueira',
    icon: '🏠',
    area: '200m²',
    tags: ['house', 'modern', '200m2', 'gourmet'],
    create: createHouse200,
  },
  {
    name: 'Casa Alto Padrão 300 m²',
    description: '3 suítes, home office, ampla área gourmet, deck com piscina e jardim',
    icon: '🏰',
    area: '300m²',
    tags: ['house', 'luxury', '300m2', 'pool'],
    create: createHouse300,
  },
  {
    name: 'Mini Predinho 200 m²',
    description: 'Térreo com 4 garagens + 2 andares com 4 apartamentos com sacada e escada central',
    icon: '🏢',
    area: '200m²',
    tags: ['building', 'apartments', 'multifloor', '200m2'],
    create: createBuilding200,
  },
  {
    name: 'Mini Predinho 300 m²',
    description: 'Térreo com 6 vagas + 2 andares com 4 confortáveis apartamentos de 2 dormitórios',
    icon: '🏢',
    area: '300m²',
    tags: ['building', 'apartments', 'multifloor', '300m2'],
    create: createBuilding300,
  },
  {
    name: 'Mini Predinho 400 m²',
    description: 'Térreo com 8 vagas + 2 andares totalizando 8 apartamentos e poço de elevador',
    icon: '🏢',
    area: '400m²',
    tags: ['building', 'apartments', 'multifloor', '400m2'],
    create: createBuilding400,
  },
];
