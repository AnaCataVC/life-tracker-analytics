<p align="center">
  <img src="icon.png" alt="life-tracker-analytics Logo" width="120" />
</p>

# Life Tracker & Analytics

[English](README.md) | [Español](README.es.md)

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Dexie.js](https://img.shields.io/badge/Local_First-Dexie.js-4CAF50?style=flat&logo=databricks&logoColor=white)](https://dexie.org/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat)](https://www.gnu.org/licenses/agpl-3.0)

---

## Project Description
Life Tracker Analytics is a comprehensive, privacy-focused React web application designed to help you track your daily well-being metrics and discover actionable insights through data analysis. You can register your mood, feeling tags, sleep patterns, focus levels, daily habits, and medication intake.

## Technologies Used
- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **Local DB / Storage:** Dexie.js (IndexedDB wrapper), Manual JSON Export/Import, remoteStorage.js (BYOD Cloud Sync)

## Key Learnings
Building this application provided valuable experience in several areas:
- **Data Management Without Complex DBs:** Learning how to manage and store simple data securely and locally (Dexie.js) without relying on complex external databases.
- **BYOD Cloud Architecture:** Adopting a "Bring-Your-Own-Data" model via remoteStorage.js to achieve cross-platform synchronization without relying on proprietary BaaS, avoiding vendor lock-in and bureaucratic API reviews (e.g., Google OAuth Trust & Safety).
- **Frontend Logic:** Implementing simple calculations and aggregations directly in JavaScript/TypeScript, reducing the need for a Python backend.
- **User Experience (UX):** Enhancing the UX for daily data entry and tracking.
- **Data Visualization:** Applying my data visualization knowledge to the web using Recharts to create interactive and meaningful charts, avoiding misleading calculations.

## Deployment & PWA
The application is designed to be hosted on Vercel and can be installed on your devices as a Progressive Web App (PWA). This means you can use it like a native app on your phone or desktop, fully offline, and your data remains local until you manually sync it.

## Local Setup & Development

```bash
# Clone repository
git clone https://github.com/AnaCataVC/life-tracker-analytics.git
cd life-tracker-analytics

# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

## License
This project is licensed under the [GNU AGPLv3 License](LICENSE). This ensures that any modifications or enhancements to the application, even if provided over a network (like a PWA), must also be open-sourced under the same terms and giving credit to the original author.

