# ADR 001: Adopción del Modelo BYOD con remoteStorage.js

**Fecha:** 2026-06-24
**Estado:** Aceptado

## Contexto
La aplicación originalmente intentó integrar Google Drive para la sincronización en la nube. Sin embargo, esto introdujo una complejidad extrema debido a las políticas de la API de Google (procesos de verificación de OAuth, auditorías de Trust & Safety y necesidad de publicar políticas de privacidad y videos de demostración). Dado que el objetivo es una aplicación de bienestar privada que no genere costos de servidor, se hizo necesario buscar una alternativa.

## Decisión
Se decidió eliminar completamente el SDK de Google y cualquier otro Backend-as-a-Service (BaaS) propietario. En su lugar, se implementó `remoteStorage.js`. 

Esto transforma la aplicación al modelo **Bring-Your-Own-Data (BYOD)**.

## Consecuencias
*   **Positivas:**
    *   Privacidad absoluta: Los datos del usuario nunca tocan un servidor nuestro.
    *   Cero costos de infraestructura y cero límites de cuota de API.
    *   Cero burocracia: No necesitamos pasar verificaciones de OAuth de grandes corporaciones.
*   **Negativas:**
    *   La fricción para el usuario es ligeramente mayor, ya que no basta con hacer clic en "Inicia sesión con Google"; deben tener o crear una cuenta en un proveedor compatible con el protocolo `remoteStorage` (ej. 5apps).

## Consideraciones de Diseño
Para mantener la arquitectura simple, no se modificó `Dexie.js` (la base de datos local). `remoteStorage.js` se utiliza exclusivamente como un **destino de volcado (backup dump)** de un archivo JSON gigante, imitando exactamente el funcionamiento de la exportación/importación manual. Esto mantiene la aplicación sólidamente "Local-First".
