# ADR 002: Rastreadores Booleanos Dinámicos vs Propiedades Estáticas

**Fecha:** 2026-07-19
**Estado:** Aceptado

## Contexto
Inicialmente, la aplicación implementó el seguimiento de métricas cualitativas (como tener pesadillas) añadiendo propiedades booleanas fijas (e.g., `hadNightmares`) al esquema de datos `LogEntry`. Adicionalmente, el impacto de estas variables sobre el estado de ánimo se calculaba manualmente mediante promedios simples en `correlations.ts`. 
A medida que la aplicación escalaba para rastrear más factores del estilo de vida (como dolor de cabeza, ayuno intermitente, etc.), este enfoque demostró ser rígido, inflaba el modelo de datos y violaba el principio DRY al duplicar lógica estadística.

## Decisión
Se decidió eliminar por completo el seguimiento estático de variables individuales (removiendo `hadNightmares`) y se adoptó una arquitectura genérica de **"Rastreadores Personalizados" (Custom Boolean Trackers)**. 

El modelo de datos ahora incluye un arreglo dinámico `customTrackers` en el que cada entrada registra simplemente `{ id, name, value }`. El cálculo del impacto de estos rastreadores fue trasladado a `individualImpacts.ts`.

## Consecuencias
*   **Positivas:**
    *   **Escalabilidad:** Los usuarios ahora pueden definir cualquier cantidad de rastreadores booleanos personalizados sin requerir cambios en el código fuente (zero-code additions).
    *   **Rigor Estadístico:** Al procesar estos rastreadores genéricos dentro de `individualImpacts.ts`, podemos medir el impacto no solo en el Ánimo, sino también en Sueño y Enfoque simultáneamente, utilizando el **coeficiente d de Cohen** para evaluar el tamaño del efecto real.
    *   **Limpieza de Código:** Reducción drástica del código inflado. El esquema `LogEntry` permanece inalterado por variaciones en las preferencias de seguimiento personales.
*   **Negativas:**
    *   La base de datos (archivos JSON de respaldo) aumentará ligeramente su tamaño, ya que en lugar de un simple boolean, almacenamos arreglos de objetos por cada día.

## Consideraciones de Diseño
Para prevenir una mala experiencia de usuario (donde tendrían que reescribir sus variables todos los días), se implementó un Patrón de Plantillas (ver `docs/learning/template-pattern.md`). Esta decisión asegura que el seguimiento personalizado dinámico mantenga la misma fricción baja que una variable fija (checkboxes).
