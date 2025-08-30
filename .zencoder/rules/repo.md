# Repo Overview: amtop-crm

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, TailwindCSS v4
- **Language**: TypeScript
- **Backend/Data**: Firebase SDK 12, MongoDB Node Driver 6
- **Utilities**: PapaParse, (xlsx currently listed)

## Scripts
- **dev**: next dev
- **build**: next build
- **start**: next start
- **lint**: next lint

## Recommended Runtime
- **Node**: 20.x or 22.x LTS
- **Package Manager**: npm 10+

## Structure (key paths)
- **app/**: Next.js app directory
  - **api/**: Route handlers (audience, debug, organizations, pipeline, teams, users)
  - **components/**: UI, layout, onboarding, teams, debug
  - **contexts/**: AuthContext
  - **firebase/**: config.tsx
  - **pipeline/**, **settings/**, **sign-in/**, **sign-up/**, **users/**, **types/**
- **public/**: static assets
- **scripts/**: migration and test utilities
- **config**: next.config.ts, tsconfig.json, postcss.config.mjs

## Setup
1. npm install
2. npm run dev

## Notes / Risks
- npm audit reports a high-severity vulnerability in **xlsx** with no fix available at the time of writing. If not needed, uninstall to remove the alert. Alternatives: **exceljs** (read/write XLSX), **read-excel-file** (parse only), or rely on **papaparse** for CSV.