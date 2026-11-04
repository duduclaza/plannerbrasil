import { describe, it, expect } from 'vitest';
import { houseTemplates } from '../src/lib/utils/houseTemplates';
import { getCatalogItem } from '../src/lib/utils/furnitureCatalog';
import { templateLabels } from '../src/lib/i18n/templateLabels';

describe('houseTemplates', () => {
  it('defines 11 architectural templates including ground houses and mini predinhos', () => {
    expect(houseTemplates.length).toBe(11);
    const names = houseTemplates.map(t => t.name);
    expect(names).toContain('Casa Térrea 100 m²');
    expect(names).toContain('Residência Moderna 200 m²');
    expect(names).toContain('Casa Alto Padrão 300 m²');
    expect(names).toContain('Mini Predinho 200 m²');
    expect(names).toContain('Mini Predinho 300 m²');
    expect(names).toContain('Mini Predinho 400 m²');
  });

  it('provides i18n label entries for every house template', () => {
    for (const template of houseTemplates) {
      expect(templateLabels[template.name]).toBeDefined();
      expect(templateLabels[template.name].name).toBeTruthy();
      expect(templateLabels[template.name].description).toBeTruthy();
    }
  });

  it('creates valid projects with non-empty walls and active floor for each template', () => {
    for (const template of houseTemplates) {
      const proj = template.create();
      expect(proj.id).toBeTruthy();
      expect(proj.floors.length).toBeGreaterThanOrEqual(1);
      expect(proj.activeFloorId).toBeTruthy();

      const activeFloor = proj.floors.find(f => f.id === proj.activeFloorId);
      expect(activeFloor).toBeDefined();
      expect(activeFloor!.walls.length).toBeGreaterThan(0);
      expect(activeFloor!.doors.length).toBeGreaterThan(0);
      expect(activeFloor!.windows.length).toBeGreaterThan(0);
    }
  });

  it('multi-floor mini predinhos have multiple stacked floors with stairs', () => {
    const b200 = houseTemplates.find(t => t.name === 'Mini Predinho 200 m²')?.create();
    expect(b200?.floors.length).toBe(3);
    expect(b200?.floors[0].elevation).toBe(0);
    expect(b200?.floors[1].elevation).toBe(280);
    expect(b200?.floors[2].elevation).toBe(560);
    expect(b200?.floors[0].stairs.length).toBeGreaterThan(0);

    const b300 = houseTemplates.find(t => t.name === 'Mini Predinho 300 m²')?.create();
    expect(b300?.floors.length).toBe(3);

    const b400 = houseTemplates.find(t => t.name === 'Mini Predinho 400 m²')?.create();
    expect(b400?.floors.length).toBe(3);
  });

  it('only references catalog furniture (cars and motorcycles included)', () => {
    for (const id of ['car_sedan', 'car_compact', 'car_suv', 'car_pickup', 'motorcycle', 'motorcycle_sport', 'scooter']) {
      expect(getCatalogItem(id)).toBeDefined();
    }
    for (const template of houseTemplates) {
      for (const floor of template.create().floors) {
        for (const item of floor.furniture) expect(getCatalogItem(item.catalogId), `${template.name}: ${item.catalogId}`).toBeDefined();
      }
    }
  });

  it('walls every Brazilian house and building lot with a garage gate and pedestrian gate', () => {
    const lotted = houseTemplates.filter(t => /m²$/.test(t.name) && /Casa|Resid|Predinho/.test(t.name));
    expect(lotted.length).toBe(6);
    for (const template of lotted) {
      const floor = template.create().floors[0];
      const fence = floor.walls.filter(w => w.height === 220);
      expect(fence.length, template.name).toBe(4);
      const front = fence[0];
      expect(floor.doors.some(d => d.wallId === front.id && d.type === 'garage'), template.name).toBe(true);
      expect(floor.doors.some(d => d.wallId === front.id && d.type === 'single'), template.name).toBe(true);
    }
  });
});
