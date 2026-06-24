# Lección Aprendida: Centralización de Serialización (Principio DRY)

**Fecha:** 2026-06-24
**Contexto:** Integración de respaldos en la Nube (remoteStorage.js) junto con exportaciones locales.

## El Problema
Al añadir un nuevo método de guardado y carga de datos (la nube personal), surgió un antipatrón en `App.tsx`. 

Teníamos la lógica para empaquetar el estado completo de la app (logs, plantillas, configuración) en un objeto estructurado `BackupData` duplicada en tres lugares distintos:
1. Al exportar un JSON manualmente.
2. Al forzar una subida a remoteStorage.
3. Al autoguardar después de crear un nuevo registro.

Lo mismo ocurrió con el proceso inverso: la lógica para inyectar el JSON de vuelta en `db.logs`, `localStorage` y en los estados de React estaba duplicada en la importación de archivo y en la descarga de la nube.

## La Solución y Lección
**Regla de oro para sistemas con múltiples vías de I/O:** Siempre debes abstraer la serialización y deserialización en *helpers* puros que ignoren el "vehículo" de transporte.

Se refactorizó el código creando:
*   `generateBackupData(overrideLogs?)`
*   `restoreFromBackupData(backupData)`

## Por qué es Importante
1.  **Mantenibilidad:** Si mañana decidimos añadir una nueva configuración (ej. "Objetivos Anuales"), solo tenemos que añadir esa propiedad a estas dos funciones. Si lo hubiéramos dejado duplicado, habríamos tenido que actualizarlo en 5 partes distintas, arriesgándonos a que una importación funcionara y otra no.
2.  **Seguridad Local-First:** Al centralizar, garantizamos que cualquier método que modifique la base de datos local y los `setStates` sigue un camino único y probado.
