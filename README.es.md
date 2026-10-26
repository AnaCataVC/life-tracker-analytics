<p align="center">
  <img src="icon.png" alt="life-tracker-analytics Logo" width="120" />
</p>

# Life Tracker & Analytics

> **Analítica de bienestar longitudinal local-first y seguimiento del impacto de hábitos impulsado por heurísticas estadísticas en el cliente.**

[English](README.md) | [Español](README.es.md)

[![React](https://img.shields.io/badge/React-19.0-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-B73BFE?style=flat&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Local First](https://img.shields.io/badge/Local_First-Dexie.js-4CAF50?style=flat&logo=databricks&logoColor=white)](https://dexie.org/)
[![Vitest](https://img.shields.io/badge/Pruebas-100%25_Aprobadas-brightgreen?style=flat&logo=vitest&logoColor=white)](https://vitest.dev/)
[![PWA](https://img.shields.io/badge/PWA-Offline_First-blueviolet?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Licencia: AGPL v3](https://img.shields.io/badge/Licencia-AGPL_v3-blue.svg?style=flat)](https://www.gnu.org/licenses/agpl-3.0)

Página del producto: [life-tracker.ana-catalina.com](https://life-tracker.ana-catalina.com)

---

## Descripción del Proyecto

**Life Tracker & Analytics** es una aplicación web progresiva enfocada en la privacidad y orientada al modelo local-first, diseñada para transformar series de tiempo longitudinales de autorregistro ruidosas y dispersas en análisis comprensibles, reproducibles y estadísticamente responsables.

Las aplicaciones de bienestar convencionales suelen recurrir a métricas de cumplimiento agregadas engañosas (ej. *"80% de metas diarias cumplidas"*) o modelos de machine learning opacos que sufren sobreajuste severo en conjuntos de datos personales $N=1$. Esta aplicación adopta una metodología de heurísticas estadísticas en el cliente centrada estrictamente en el **impacto de factores individuales**: aislando cómo hábitos específicos, medicamentos y patrones de sueño se asocian con el enfoque cognitivo, el ánimo y la recuperación del día posterior sin enviar registros a servidores externos.

### Características Principales
- **Momento Longitudinal y Normalización por Línea Base:** Calcula el momento móvil de 7 días frente a la distribución de referencia personal de 28 días ($\mu_{28d}, \sigma_{28d}$), determinando desvíos estandarizados ($z$-scores) y dirección (*En Ascenso*, *En Descenso*, *Estable*).
- **Análisis Temporal Rezagado ($Lag-1$):** Evalúa efectos de arrastre temporal aislando pares de días calendario estrictamente consecutivos ($t-1 \to t$) para cuantificar cómo los hábitos de la tarde/noche se asocian con la calidad del descanso matutino y la concentración diurna subsiguiente.
- **Protocolo de Calendario Disperso y Datos Faltantes:** Los días no registrados se materializan explícitamente como observaciones ausentes (`null`), evitando coaccionarlos falsamente a cero y preservando la varianza real.
- **Niveles de Confianza Estadística y Tamaños del Efecto:** Aplica $d$ de Cohen agrupada y correlación de Pearson ($r$) junto a umbrales rigurosos de tamaño de muestra ($N \ge 5$ mínimo, $N \ge 10$ para alta confianza) para suprimir conclusiones prematuras.
- **Arquitectura Local-First de Conocimiento Cero:** Respaldada por Dexie.js (IndexedDB) para operación sin conexión y persistencia local inmediata.
- **Sincronización en la Nube BYOD (*Bring-Your-Own-Data*):** Sincronización descentralizada entre dispositivos mediante el protocolo abierto `remoteStorage.js`, evitando el bloqueo de proveedores BaaS y barreras de auditoría de seguridad OAuth.
- **Internacionalización Bilingüe Simétrica:** Localización completa en español e inglés en métricas, gráficos, análisis y documentación técnica.

---

## Estructura de Componentes y Responsabilidades

La aplicación sigue una arquitectura estática modular donde el procesamiento analítico se ejecuta íntegramente en el navegador:

| Componente / Módulo | Responsabilidad | Documentación de Referencia |
| :--- | :--- | :--- |
| `src/utils/heuristics/timeSeries.ts` | Alineación temporal en calendario UTC, manejo de días ausentes, ventanas móviles 7d/28d y emparejamiento consecutivo $Lag-1$. | [Metodología Analítica](docs/analytics-methodology.md) |
| `src/utils/heuristics/statistics.ts` | Primitivas estadísticas puras: Pearson $r$, Cohen $d$, filtrado de atípicos por IQR, desvíos $z$ de línea base y niveles de confianza. | [Metodología Analítica](docs/analytics-methodology.md) |
| `src/utils/heuristics/individualImpacts.ts` | Diferencias directas entre grupos aislados (con vs. sin) para hábitos, medicamentos y etiquetas cualitativas de ánimo. | [Guía de Funcionalidades](docs/features/analytics_engine.md) |
| `src/components/LocalInsights.tsx` | Panel analítico memoizado que renderiza tendencias móviles, líneas base, efectos rezagados y síntesis narrativa. | [Índice de Documentación](docs/README.md) |
| `src/components/AnalyticsCharts.tsx` | Visualización interactiva con Recharts: curvas de correlación cruzada, métricas personalizadas y patrones de sueño. | [Guía de Funcionalidades](docs/features/analytics_engine.md) |
| `src/utils/db.ts` y `remoteStorage.ts` | Persistencia en IndexedDB local mediante Dexie.js y sincronización descentralizada BYOD. | [Esquema de Base de Datos](docs/architecture/database_schema.md) |

---

## Stack Tecnológico

- **Frontend y Entorno de Ejecución:** React 19, TypeScript 5.8, Node.js
- **Herramienta de Compilación:** Vite 6.2, `@vitejs/plugin-react`, `vite-plugin-pwa`
- **Estilos y Tokens:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Visualización de Datos e Iconos:** Recharts 3.8, Lucide React
- **Base de Datos Local:** Dexie.js 4.4 (`dexie-react-hooks`)
- **Sincronización en la Nube:** remoteStorage.js 2.0 (`remotestorage-widget`)
- **Pruebas y Aseguramiento de Calidad:** Vitest 3.0, compilador de TypeScript (`tsc --noEmit`)

---

## Ejemplos Reales de Análisis Generados por el Motor

El motor produce análisis descriptivos transparentes en lugar de recomendaciones de caja negra:

### 1. Efecto Rezagado de Hábitos ($Lag-1$)
> **Análisis Observado:**
> *"Completar 'Meditación Nocturna' ayer se asocia con +0.8 puntos más en la calidad de sueño de la mañana siguiente."*
> - **Metodología:** Filtrado de $n = 14$ pares de días calendario estrictamente consecutivos ($\Delta_{\text{días}} = 1$). Cálculo de la calidad de sueño promedio en mañanas posteriores a meditar ($8.2/10, n=7$) frente a mañanas sin hábito previo ($7.4/10, n=7$). Tamaño del efecto Cohen's $d = 0.62$.
> - **Advertencia Estadística:** Presentado con distintivo de *Confianza Moderada (Datos Limitados)* debido a $n < 10$ por subgrupo. Redacción estrictamente asociativa para evitar suponer causalidad directa.

### 2. Momento Longitudinal vs. Línea Base de 28 Días
> **Análisis Observado:**
> *"Nivel de Enfoque: Promedio 7 Días = 7.8 vs. Línea Base 28 Días = 6.4 (Δ = +1.4, z = +1.15) — En Ascenso."*
> - **Metodología:** Ventana deslizante indexada por calendario que requiere $\ge 4$ observaciones registradas en los 7 días precedentes y $\ge 10$ en los 28 días precedentes. Evaluado frente a la desviación estándar histórica del usuario ($\sigma_{28d} = 1.22$).
> - **Advertencia Estadística:** No compara contra un promedio poblacional genérico; evalúa exclusivamente frente a la distribución de referencia personal del individuo.

---

## Compilación y Ejecución

### Requisitos Previos
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### Instalación y Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/AnaCataVC/life-tracker-analytics.git
cd life-tracker-analytics

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo local
npm run dev

# 4. Compilar el paquete PWA de producción
npm run build

# 5. Previsualizar la compilación de producción localmente
npm run preview
```

Los artefactos de producción se generarán en la carpeta `dist/`, incluyendo scripts del Service Worker y recursos PWA cacheados.

---

## Pruebas Automatizadas

El repositorio cuenta con una suite de pruebas automatizadas deterministas que evalúan heurísticas matemáticas puras, semántica de datos faltantes, continuidad de calendario y sincronización BYOD.

```bash
# Ejecutar la suite completa de pruebas unitarias
npm test

# Ejecutar el análisis estático estricto de tipos con TypeScript
npm run lint
```

Las especificaciones detalladas y los fixtures sintéticos se encuentran en `tests/analyticsMethodology.test.ts` y `tests/heuristics.test.ts`.

---

## Decisiones de Arquitectura y Aprendizajes

1. **Heurísticas Estadísticas en TypeScript (Cliente) vs. Microservicios Python/ML:**
   Los conjuntos de datos longitudinales personales ($N \approx 30 - 365$ registros) no justifican la sobrecarga de infraestructura, latencia y costos de servidor de un backend en Python o los ~30MB de descarga de Pyodide (WASM). Ejecutar los algoritmos estadísticos (Pearson $r$, Cohen $d$, ventanas móviles y filtrado IQR) en TypeScript en el navegador garantiza latencia cero, funcionamiento offline absoluto y privacidad de conocimiento cero.
2. **Protocolo de Series Dispersas y Semántica de Valores Ausentes:**
   En el registro longitudinal, un día sin entrada no equivale a cero horas de sueño o ánimo nulo. Las fechas faltantes se tratan formalmente como valores ausentes (`null`), evitando coaccionarlas a cero. Las ventanas móviles (7 y 28 días) exigen densidades mínimas de datos ($\ge 4$ y $\ge 10$ días respectivamente) antes de emitir tendencias.
3. **Separación Temporal: Descanso Intra-Día vs. Influencia Rezagada de Hábitos:**
   En el registro diario, `entry.sleepDuration` precede naturalmente a `entry.concentration` durante el estado de vigilia de esa misma fecha. Confundir esto con un desfase de array ciego ($i-1$) correlacionaría el sueño de hace 48 horas con el foco actual. La arquitectura separa formalmente el efecto directo del descanso del verdadero impacto rezagado $Lag-1$ (evaluando actividades del día $t-1$ frente al descanso matutino del día $t$ en fechas consecutivas verificadas).
4. **Arquitectura Descentralizada BYOD (*Bring-Your-Own-Data*):**
   En lugar de atar a los usuarios a un BaaS propietario o someterse a revisiones burocráticas de seguridad OAuth (ej. Google OAuth Trust & Safety), la app adopta el estándar abierto `remoteStorage.js`. Cada usuario conecta su propio proveedor de almacenamiento independiente, preservando la soberanía total de sus datos.
5. **Invarianza Asociativa frente a Causalidad Incomprobable:**
   En datos personales $N=1$, variables confusoras externas (fines de semana, enfermedades, cambios de estación) impiden la inferencia causal directa. El motor prohíbe términos causales en la interfaz y adopta una formulación estrictamente asociativa.

---

## Licencia

Este proyecto está bajo la [Licencia GNU Affero General Public License v3.0 (AGPLv3)](LICENSE). Cualquier modificación o mejora desplegada como servicio de red o aplicación web progresiva debe mantenerse de código abierto bajo los mismos términos, preservando las garantías de privacidad y transparencia del software.
