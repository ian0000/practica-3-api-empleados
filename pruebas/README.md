> Las capturas y el análisis original documentan la ejecución del 17 de octubre de 2026. Consulta la [verificación del 22 de octubre](EJECUCION_2026-10-22.md) y sus archivos JSON y logs para los resultados más recientes.

# Nueva práctica: pruebas de modularidad y rendimiento

Implementación y mediciones locales completadas sobre el backend de empleados de `Practica 3`.

## Documentos

- [Fase A explicada: Jest y mocks](FASE_A_EXPLICADA.md).
- [Fase B explicada: carga concurrente con Artillery](FASE_B_EXPLICADA.md).
- [Informe de ingeniería para la entrega](INFORME_INGENIERIA.md).

Las capturas están insertadas en esos documentos y guardadas en `capturas/`. Muestran los logs reales guardados y abiertos como texto en un navegador local; los originales completos están en `resultados/`.

## Comandos desde la terminal que tienes abierta

Si estás en `Practica 3`:

```powershell
cd backend
npm.cmd test
```

Para la prueba de carga, con MongoDB disponible en `127.0.0.1:27017`:

```powershell
npm.cmd run stress
```

El comando coordina su servidor, ejecuta los 50 segundos de fases, guarda resultados y elimina la base temporal. No necesitas iniciar otro backend manualmente.

## Resultados comprobados

| Comprobación | Resultado |
|---|---|
| Runtime local del proyecto | Node 24.22.0 |
| Jest | 7/7 pruebas aprobadas |
| Regresión HTTP | 7/7 pruebas aprobadas |
| Typecheck | Aprobado |
| POST válido / corrupto | 1.075 respuestas 201 / 1.075 respuestas 400 |
| p99 HTTP | 6 ms, frente al umbral de 200 ms |
| Usuarios virtuales fallidos | 0 |
| Payloads negativos que llegaron al repositorio | 0 |

## Material preservado

- [Consigna original](CONSIGNA_ORIGINAL.txt).
- [Backend antes de esta práctica](BACKEND_ANTES_DE_PRUEBAS.zip), sin dependencias instaladas ni metadatos Git.
- [SHA-256 de los 20 archivos originales](ORIGINAL_SHA256.json).

El Node global no se modificó. Las nuevas herramientas y el runtime están en las dependencias de desarrollo del backend. El código, los scripts y las evidencias de esta práctica se incluyen en este repositorio público.
