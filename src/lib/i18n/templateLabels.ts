import type { TranslationKey } from './index';

// Presentation only: factory names and generated project data stay unchanged.
export const templateLabels: Record<string, { name: TranslationKey; description: TranslationKey }> = {
  "Studio Apartment": { name: 'templates.studio.name', description: 'templates.studio.description' },
  "1-Bedroom Apartment": { name: 'templates.one.name', description: 'templates.one.description' },
  "2-Bedroom House": { name: 'templates.two.name', description: 'templates.two.description' },
  "Open Concept Home": { name: 'templates.open.name', description: 'templates.open.description' },
  "L-Shaped House": { name: 'templates.l.name', description: 'templates.l.description' },
  "Casa Térrea 100 m²": { name: 'templates.house100.name', description: 'templates.house100.description' },
  "Residência Moderna 200 m²": { name: 'templates.house200.name', description: 'templates.house200.description' },
  "Casa Alto Padrão 300 m²": { name: 'templates.house300.name', description: 'templates.house300.description' },
  "Mini Predinho 200 m²": { name: 'templates.building200.name', description: 'templates.building200.description' },
  "Mini Predinho 300 m²": { name: 'templates.building300.name', description: 'templates.building300.description' },
  "Mini Predinho 400 m²": { name: 'templates.building400.name', description: 'templates.building400.description' },
};
