# Allocation Next.js migration

This folder is the maintainable TypeScript replacement for the original inline-HTML application. The original app remains available in `../static-version` as a behavior and visual reference while migration is in progress.

## First-time setup

```powershell
npm install
npm run sync:data
npm run sync:assets
npm run dev
```

The asset command creates local links into `../static-version`. It does not copy the 367 MB model and texture library. Before deploying independently, replace those links with copied files or move the assets to object storage/CDN URLs.

## Current migration status

- Typed apartment, model-asset, and floor-plan-label contracts
- Shared floor-plan viewer used by the homepage and unit pages
- Complete homepage explorer with the production 360-degree building model
- Synchronized filters, model hover, model selection, and searchable unit list
- Homepage 360 Model and Floor Plans tabs with the original three-panel layout
- Disabled sold/reserved destinations
- Dynamic `/units/[unitNumber]` routes
- Readable Three.js unit viewer with explicit lifecycle and cleanup
- Existing 3D assets, texture mappings, camera fit, and maximum zoom-out opening state

The remaining migration work is refinement and parity testing of smaller interactions rather than a missing page-level feature.

## Where behavior lives

- `lib/data.ts`: data access and unit availability rules
- `lib/floor-plans.ts`: floor/tower selection and label-position fallback
- `components/floor-plans/`: reusable plan UI
- `components/unit-model/UnitModelViewer.tsx`: unit Three.js scene
- `components/building/BuildingViewer.tsx`: homepage scene, raycasting, and apartment mesh highlights
- `components/home/`: explorer state, filters, ranges, and synchronized results
- `lib/three/building-materials.ts`: production KTX2 building materials
- `components/units/`: unit details workspace

Run `npm run sync:data` whenever the source JSON files change.
