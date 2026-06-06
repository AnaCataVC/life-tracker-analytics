# Life Tracker & Analytics - AI Context

This file provides context and guidelines for AI coding assistants (like Gemini) working on this project.

## Project Overview
**Life Tracker & Analytics** is a React-based web application designed for comprehensive well-being tracking. It allows users to register daily logs of their personal data and analyze trends.

### Core Features
- **Daily Tracking**: Users log their Mood, Sleep (duration, quality, bedtime, waketime), Focus/Concentration, Medications, and Daily Habits.
- **Analytics & Insights**: Generates statistics and correlation charts from the tracked data. Emphasizes *individual impact* (e.g., how a specific habit or medication affects mood and sleep) rather than aggregated daily compliance percentages.
- **Google Drive Backup**: Built-in OAuth integration to sync data securely to the user's personal Google Drive as a single encrypted JSON file (`lifetracker_backup.json`).
- **Bilingual & Theming**: Supports English and Spanish, alongside Light and Dark modes.

## Directory Structure
The workspace is organized as a standard Vite + React project (100% Static Frontend / Local-First):

```text
/
├── vite.config.ts          # Vite configuration and PWA setup
├── package.json            # Dependencies and scripts
└── src/
    ├── App.tsx             # Main React application, state management, and routing
    ├── index.css           # Global styles and Tailwind CSS entry point
    ├── types.ts            # TypeScript interfaces (e.g., LogEntry, EnabledTrackers)
    ├── components/         # UI Components
    │   ├── TrackingForm.tsx    # Form to input daily well-being metrics
    │   ├── AnalyticsCharts.tsx # Data visualization logic (Recharts)
    │   └── LocalInsights.tsx   # Offline insights and correlations
    └── utils/              # Helper modules
        ├── db.ts               # Dexie IndexedDB local-first database schema
        ├── googleDrive.ts      # Google Drive API backup integration logic
        ├── translations.ts     # i18n dictionary (English/Spanish)
        └── helpers.ts          # Utility functions
```

## Tech Stack
- **Core**: React 19, TypeScript, Node.js
- **Build Tool**: Vite
- **Database**: Dexie.js (IndexedDB wrapper for Local-First data storage)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React (`lucide-react`)
- **Animations**: Framer Motion (`motion`)
- **Data Visualization**: Recharts

## Coding Guidelines for AI Assistants

When modifying or generating code for this repository, please adhere to the following rules:

1. **TypeScript First**: Always write strict, well-typed TypeScript code. Avoid `any`; use proper interfaces and types from `src/types.ts`.
2. **Functional Components**: Use modern React functional components with hooks (`useState`, `useEffect`, etc.). Keep components modular.
3. **Styling Approach**: 
   - Exclusively use Tailwind CSS utility classes for styling. 
   - Avoid creating custom CSS files unless absolutely necessary (rely on `index.css` and Tailwind config).
4. **Icons & Assets**: Always use `lucide-react` when adding icons to the UI.
5. **UI/UX & Animations**: Implement smooth transitions and micro-interactions using `motion` (Framer Motion) to enhance the user experience.
6. **Data Visualization**: Utilize `recharts` for all charts, graphs, and data analytics representations in `AnalyticsCharts`.
7. **Routing/Architecture**: Be mindful that the project is a pure static Local-First app. There is no backend server. Environment variables (`VITE_GOOGLE_CLIENT_ID`) are used for configuration.
8. **Analytical Philosophy**: When creating or modifying data analysis logic, strictly focus on *individual impact* (e.g., how taking Medication X specifically alters Focus). Do not use aggregate compliance metrics (like "percentage of daily tasks completed") to calculate well-being scores.
9. **Analytics Tech Stack (TS vs Python)**: Data analysis and calculations (like in `src/utils/analysisEngine.ts`) MUST remain in TypeScript to run on the client side (browser) for speed, privacy, and architecture simplicity. Do NOT introduce Python microservices or dependencies for data crunching unless explicit machine learning/predictive AI requirements are added.
10. **Documentation Integrity**: ALWAYS update documentation (`README.md`, `PWA_INSTALLATION.md`, `GEMINI.md`, etc.) when making important architectural or feature changes to keep the project context up-to-date.

## Development Scripts
- `npm run dev`: Starts the local development environment using Vite.
- `npm run build`: Compiles the React frontend for production distribution.
- `npm run preview`: Runs a local web server to preview the production build (`dist/`).
