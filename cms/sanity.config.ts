import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';
const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;
if (!projectId || !dataset)
  throw new Error(
    'Renseignez SANITY_STUDIO_PROJECT_ID et SANITY_STUDIO_DATASET avant de lancer le Studio.',
  );
export default defineConfig({
  name: 'optimaworks',
  title: 'OptimaWorks — Contenus',
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
