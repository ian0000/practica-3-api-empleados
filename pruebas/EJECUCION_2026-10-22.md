# Verificación del 22 de octubre de 2026

El intento de carga más reciente finalizó con código 0; el reporte confirma la correspondencia entre tráfico y persistencia. Las mediciones corresponden al entorno local de esta ejecución.

| Comprobación | Resultado |
|---|---|
| TypeScript (`npm.cmd run typecheck`) | Aprobado |
| Jest (`npm.cmd test`) | 7/7 aprobadas |
| HTTP (`npm.cmd run test:api`) | 7/7 aprobadas |
| Runtime de carga | v24.22.0 |
| Solicitudes HTTP | 2150 |
| Respuestas 201 / 400 esperadas | 1075 / 1075 |
| Usuarios virtuales fallidos | 0 |
| p99 HTTP / umbral | 6 ms / 200 ms |
| Tiempo HTTP máximo | 259 ms |
| Llamadas create / registros persistidos | 1075 / 1075 |
| Payloads negativos que llegaron al repositorio | 0 |

El umbral evalúa el percentil 99; el máximo de una petición individual fue 259 ms. Las respuestas 400 eran esperadas para los payloads con sueldo negativo.

## Evidencia de esta ejecución

- [Resultado y código de salida](resultados/resultado-ejecucion.json).
- [Métricas completas de Artillery](resultados/artillery.json).
- [Log completo de Artillery y comprobaciones de umbral](resultados/artillery.log).
- [Métricas de persistencia](resultados/backend-metricas.json).
- [Log del backend temporal](resultados/servidor-stress.log).

Las capturas, el informe original y los archivos `artillery-resumen.txt`, `artillery-limpio.txt` y `ejecucion-stress.log` conservan la evidencia del 17 de octubre. Los comandos de TypeScript, Jest y HTTP se volvieron a ejecutar el 22 de octubre antes de publicar esta actualización.
