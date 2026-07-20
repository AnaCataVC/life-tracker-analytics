# Lección Aprendida: Patrón de Plantillas para UX sin fricción

**Fecha:** 2026-07-19
**Contexto de Implementación:** Transición de variables estáticas (`hadNightmares`) a Rastreadores Booleanos Personalizados dinámicos.

## El Problema
Al permitir que los usuarios definan factores cualitativos totalmente dinámicos para rastrear (ej. "Dolor de cabeza", "Ayuno Intermitente", "Pesadillas"), nos enfrentábamos a una fricción de Interfaz de Usuario. 
Si el modelo depende de arreglos dinámicos en el `LogEntry`, el usuario tendría que acordarse de tipear "Pesadillas" todos los días para marcar un checkbox, lo cual arruinaría la experiencia en una app de seguimiento de vida rápida.

## La Solución (Patrón Aplicado)
Para resolver esta fricción sin perder el dinamismo del backend local (archivos JSON/IndexedDB), aplicamos el **Patrón de Plantillas (Templates)** en el frontend.

### Implementación Técnica
1. **Estado Base Global (`App.tsx`)**: Mantenemos un array de configuración estática (`customTrackersTemplate`) en el estado global y guardado en `localStorage` o dentro de los metadatos de configuración en RemoteStorage.
2. **Auto-inicialización Diaria (`TrackingForm.tsx`)**: Cuando un usuario abre la pestaña de "Registro" para crear una nueva entrada (día), la aplicación lee el estado de la Plantilla e inyecta iterativamente los nombres de esos rastreadores con un valor booleano en `false`.
3. **Gestión desde Configuración**: Se crea un área dedicada dentro de "Ajustes" para agregar/eliminar estos rastreadores globales, protegiendo la UI del formulario diario.

## Por qué es un buen patrón para aplicaciones Local-First
Este patrón logra el equilibrio perfecto entre **esquema agnóstico** (la base de datos y algoritmos procesan llaves dinámicas `name` iteradas) y una **UX amigable** (el usuario ve checkboxes fijos todos los días, comportándose casi de forma idéntica a una aplicación de propiedades estáticas).

Fue tan efectivo que se reutilizó el mismo patrón para Hábitos y Medicamentos diarios.
