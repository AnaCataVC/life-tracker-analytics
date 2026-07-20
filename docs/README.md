# Documentación del Proyecto

Bienvenido al índice de documentación técnica de **Life Tracker Analytics**. Esta carpeta contiene la documentación detallada sobre la arquitectura, diseño y guías de desarrollo de la aplicación.

Para una visión de alto nivel, consulta el [README.md](../README.md) en la raíz del proyecto. Para contexto estricto de Inteligencia Artificial (Prompting), revisa [GEMINI.md](../GEMINI.md).

## Índice

### 1. Arquitectura y Modelado de Datos
Documentación sobre cómo se almacena, transfiere y estructura la información.
*   [Esquema de Base de Datos Local (`architecture/database_schema.md`)](architecture/database_schema.md): Detalle de las tablas y campos almacenados en `Dexie.js` (IndexedDB).
*   [Flujo de Sincronización en la Nube (`architecture/cloud_sync_flow.md`)](architecture/cloud_sync_flow.md): Explicación del modelo BYOD (*Bring-Your-Own-Data*) utilizando `remoteStorage.js`.

### 2. Funcionalidades y Lógica (Features)
Guías sobre mecánicas o implementaciones profundas de la aplicación.
*   [Motor Analítico y Heurísticas (`features/analytics_engine.md`)](features/analytics_engine.md): Fórmulas y matemática detrás del cálculo de los gráficos de tendencias e impacto individual.
*   [Guía de Aplicación Web Progresiva (`features/pwa_guide.md`)](features/pwa_guide.md): Cómo funciona la instalación offline de la aplicación y la configuración de Service Workers en Vite.

### 3. Decisiones Arquitectónicas (ADR)
Registro histórico de las decisiones tecnológicas más importantes del proyecto.
*   [ADR 001: Adopción del Modelo BYOD (`ADR/001-adopt-remotestorage-byod.md`)](ADR/001-adopt-remotestorage-byod.md)
*   [ADR 002: Rastreadores Dinámicos (`ADR/002-dynamic-custom-trackers.md`)](ADR/002-dynamic-custom-trackers.md)

### 4. Lecciones y Patrones
Conocimiento extraído de las sesiones de desarrollo para evitar repetir errores.
*   [Principio DRY en Serialización (`learning/dry-serialization-helpers.md`)](learning/dry-serialization-helpers.md)
*   [Limitaciones Matemáticas de Heurísticas (`learning/heuristics-mathematical-limitations.md`)](learning/heuristics-mathematical-limitations.md): Análisis de los riesgos estadísticos del motor de insights (N=1, lenguaje causal, contaminación de baseline) y las decisiones de diseño tomadas para mitigarlos.
*   [Patrón Template Dinámico (`learning/template-pattern.md`)](learning/template-pattern.md)
*   [Categorización de Rastreadores (`learning/categorized-custom-trackers.md`)](learning/categorized-custom-trackers.md)
