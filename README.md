# Life Tracker & Analytics

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=flat&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)
[![Dexie.js](https://img.shields.io/badge/Local_First-Dexie.js-4CAF50?style=flat&logo=databricks&logoColor=white)](https://dexie.org/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg?style=flat)](https://www.gnu.org/licenses/agpl-3.0)

[English](#english) | [Español](#español)

---

<a name="english"></a>
## English

### 1. Project Description
Life Tracker Analytics is a comprehensive, privacy-focused React web application designed to help you track your daily well-being metrics and discover actionable insights through data analysis. You can register your mood, feeling tags, sleep patterns, focus levels, daily habits, and medication intake.

### 2. Technologies Used
- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion (`motion`)
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **Local DB / Storage:** Dexie.js (IndexedDB wrapper), Manual JSON Export/Import, remoteStorage.js (BYOD Cloud Sync)

### 3. Key Learnings
Building this application provided valuable experience in several areas:
- **Data Management Without Complex DBs:** Learning how to manage and store simple data securely and locally (Dexie.js) without relying on complex external databases.
- **BYOD Cloud Architecture:** Adopting a "Bring-Your-Own-Data" model via remoteStorage.js to achieve cross-platform synchronization without relying on proprietary BaaS, avoiding vendor lock-in and bureaucratic API reviews (e.g., Google OAuth Trust & Safety).
- **Frontend Logic:** Implementing simple calculations and aggregations directly in JavaScript/TypeScript, reducing the need for a Python backend (which is my usual strong suit).
- **User Experience (UX):** Enhancing the UX for daily data entry and tracking.
- **Data Visualization:** Applying my data visualization knowledge to the web using Recharts to create interactive and meaningful charts, avoiding misleading calculations.

### 4. Deployment & PWA
The application is designed to be hosted on Vercel and can be installed on your devices as a Progressive Web App (PWA). This means you can use it like a native app on your phone or desktop, fully offline, and your data remains local until you manually sync it.

### 5. License
This project is licensed under the [GNU AGPLv3 License](LICENSE). This ensures that any modifications or enhancements to the application, even if provided over a network (like a PWA), must also be open-sourced under the same terms and giving credit to the original author.

---

<a name="español"></a>
## Español

### 1. Descripción del Proyecto
Life Tracker Analytics es una aplicación web integral en React, enfocada en la privacidad, diseñada para ayudarte a registrar tus métricas de bienestar diario y descubrir patrones útiles a través del análisis de datos. Permite registrar estado de ánimo, etiquetas de sentimientos (mood tags), sueño, niveles de concentración, hábitos diarios y medicamentos.

### 2. Tecnologías Utilizadas
- **Frontend:** React 19, TypeScript
- **Build Tool:** Vite
- **Estilos:** Tailwind CSS v4
- **Animaciones:** Framer Motion (`motion`)
- **Visualización de Datos:** Recharts
- **Iconos:** Lucide React
- **Base de Datos Local:** Dexie.js (IndexedDB), Exportación e Importación Manual de JSON, remoteStorage.js (BYOD Sincronización en la Nube)

### 3. Aprendizajes Destacados
La creación de esta aplicación me permitió profundizar en:
- **Manejo de Datos Simples:** Almacenar y manejar datos localmente (Dexie.js) sin necesidad de recurrir a bases de datos complejas.
- **Arquitectura de Nube BYOD:** Adoptar un modelo "Bring-Your-Own-Data" mediante remoteStorage.js para lograr la sincronización multiplataforma sin depender de un BaaS propietario, evitando el "vendor lock-in" y las revisiones burocráticas de APIs (ej. Google OAuth Trust & Safety).
- **Lógica en el Frontend:** Realizar cálculos sencillos directamente en el cliente (JS/TS), lo cual reduce la necesidad de usar un backend en Python (que es mi fuerte habitual).
- **Experiencia de Usuario (UX):** Mejorar el flujo de entrada de datos diarios.
- **Visualización de Datos:** Aplicar mis conocimientos analíticos y de visualización utilizando Recharts para generar gráficos interactivos de impacto real, en lugar de calculos engañosos.

### 4. Despliegue y PWA
La aplicación está diseñada para ser publicada en Vercel y puede ser instalada en tus dispositivos como una Aplicación Web Progresiva (PWA). Esto significa que puedes usarla como una app nativa en tu móvil o PC, de forma completamente offline, y tus datos se mantienen locales hasta que decidas sincronizarlos.

### 5. Licencia
Este proyecto está licenciado bajo la [Licencia GNU AGPLv3](LICENSE). Esto garantiza que cualquier modificación o mejora a la aplicación, incluso si se provee a través de una red (como una PWA), también debe ser de código abierto bajo los mismos términos y dándo crédito al autor original.
