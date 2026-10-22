> Las capturas y el análisis original documentan la ejecución del 17 de octubre de 2026. Consulta la [verificación del 22 de octubre](EJECUCION_2026-10-22.md) y sus archivos JSON y logs para los resultados más recientes.

# Fase B: probar carga concurrente con Artillery

## Qué queremos observar

Cada usuario virtual envía dos solicitudes: primero un empleado válido, espera un segundo y después envía un empleado con sueldo negativo. El primero debe obtener 201; el segundo, 400 por Zod, antes de llamar a la persistencia.

Artillery crea usuarios de forma concurrente siguiendo el perfil de [stress-test.yml](../stress-test.yml):

| Fase | Duración | Nuevos usuarios virtuales por segundo |
|---|---:|---|
| Calentamiento | 20 segundos | 5 |
| Incremento de carga | 30 segundos | De 15 a 50 |

`arrivalRate` mide nuevos usuarios por segundo, no solicitudes HTTP por segundo ni usuarios simultáneos. Aquí cada usuario realiza dos solicitudes. El nombre académico “saturación” de la fase no demuestra por sí mismo que se haya alcanzado la capacidad máxima del servidor.

## Cómo ejecutarlo

Desde `Practica 3`:

```powershell
cd backend
npm.cmd run stress
```

Se necesita MongoDB disponible en `127.0.0.1:27017`. En la ejecución verificada se utilizó el contenedor existente `mongo-practica3`.

El comando inicia un backend temporal en un puerto libre y ejecuta Artillery con ese destino. Crea una base exclusiva cuyo nombre comienza con `practica5_stress_`; no utiliza `usuarios_db`. Guarda las métricas y elimina la base temporal al terminar. El backend que ya puedas tener abierto en el puerto 3000 no participa.

Las fases generan tráfico durante 50 segundos; el tiempo total es mayor por el arranque de las herramientas y la finalización de los usuarios activos. La ejecución medida de Artillery terminó en 53 segundos desde el inicio de su carga.

## Qué hace cada archivo

| Archivo | Función |
|---|---|
| [stress-test.yml](../stress-test.yml) | Define fases, dos payloads, captura de `_id` y umbrales. |
| [stress-processor.cjs](../stress-processor.cjs) | Cuenta cada payload enviado y verifica que el 400 señale un error de `sueldo`. |
| [start-stress.ts](../backend/scripts/start-stress.ts) | Ejecuta la API con MongoDB real y mide llamadas al repositorio, registros y Event Loop. |
| [run-stress.mjs](../backend/scripts/run-stress.mjs) | Coordina el servidor temporal y Artillery, guarda resultados y limpia la base creada. |

Se añadió `/api/v1/employees` como alias de los mismos controladores que utiliza `/api/empleados`. Así el escenario respeta la nueva consigna y el frontend conserva su contrato.

## Qué resultados se obtuvieron

![Resumen real de Artillery](capturas/02-artillery.jpg)

La captura muestra el resumen del log real, abierto como texto en un navegador local. El archivo completo está en [artillery.log](resultados/artillery.log) y los datos estructurados en [artillery.json](resultados/artillery.json).

| Métrica | Resultado real |
|---|---:|
| Usuarios virtuales creados y completados | 1.075 |
| Solicitudes HTTP | 2.150 |
| Datos válidos enviados | 1.075 |
| Respuestas 201 | 1.075 |
| Datos corruptos enviados | 1.075 |
| Respuestas 400 verificadas como rechazo Zod | 1.075 |
| Usuarios virtuales fallidos | 0 |
| p99 HTTP agregado | 6 ms |
| p99 de respuestas 201 | 6 ms |
| p99 de respuestas 400 | 3 ms |

El p99 es una estimación del tiempo bajo el cual se encuentra aproximadamente el 99 % de las respuestas de la muestra. El umbral de la consigna es menor que 200 ms y el valor medido fue 6 ms.

El segundo de espera pertenece a la duración del escenario del usuario, no a la latencia de una respuesta HTTP. Por eso `vusers.session_length.p99`, cercano a 1.023 ms, no se compara con el umbral HTTP de 200 ms.

## Cómo demostramos que Zod protege la persistencia

No basta con contar los 400. También se comprobó que su cuerpo contenga el error de `sueldo` y se contó el acceso al repositorio:

- El repositorio recibió 1.075 llamadas de creación.
- MongoDB almacenó 1.075 registros.
- Las llamadas al repositorio con sueldo negativo fueron cero.

Esto coincide con el tráfico válido y demuestra el rechazo previo a la persistencia en esta ejecución. La validación ya estaba implementada al principio del controlador, mediante `createEmployeeDto.parse(req.body)`.

![Checks de SLA y comprobación de persistencia](capturas/03-sla-y-persistencia.jpg)

Los datos están en [backend-metricas.json](resultados/backend-metricas.json). La limpieza de la base temporal aparece en [ejecucion-stress.log](resultados/ejecucion-stress.log).

## Cómo se comprueban los SLA

Se mantienen todos los checks en un único bloque `config.plugins.ensure`: p99 menor que 200 ms, `maxErrorRate: 1` y coincidencia de contadores. Separar `config.ensure` y `config.plugins.ensure` haría que la versión instalada del plugin priorizara el primero y omitiera los checks del otro.

Los 400 de este escenario son resultados esperados. No equivalen a un 50 % de fallos de transporte. `maxErrorRate` evalúa usuarios que no completan su escenario; en esta ejecución el resultado fue 0 %. El plugin `expect` verifica explícitamente los códigos 201 y 400.

## ¿Hubo degradación lineal o exponencial?

El p99 por ventanas fue 10,1; 5; 4; 4; 5 y 6 ms, mientras la tasa HTTP reportada pasó de 10 a 94 solicitudes por segundo. La rampa mostró una variación de 4 a 6 ms en sus últimas ventanas, dentro del SLA.

Con una sola ejecución y estos agregados no se puede afirmar una ley de crecimiento lineal o exponencial, ni un límite máximo de capacidad. Tampoco hay evidencia suficiente para atribuir la variación a un bloqueo síncrono concreto.

El código sí contiene trabajo síncrono: validación Zod, parseo y serialización JSON, y formateo de logs. Para atribuirles un cuello de botella habría que medir perfiles de CPU y repetir cargas mayores. El informe diferencia estas posibilidades de los hechos observados.

Consulta el análisis y la tabla de intervalos en [INFORME_INGENIERIA.md](INFORME_INGENIERIA.md).

## Variante manual con la CLI de Artillery

Para utilizar el destino 3000 del YAML, con ese puerto libre, iniciar desde `backend`:

```powershell
npm.cmd run stress:server
```

En otra terminal, también dentro de `backend`:

```powershell
npm.cmd run artillery -- run ../stress-test.yml --output ../pruebas/resultados/artillery-manual.json
```

Esto invoca el binario local de Artillery con Node 24, sin instalación global. Para cerrar la instancia manual y eliminar únicamente su base de pruebas:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/__stress__/shutdown'
```

La variante automática `npm.cmd run stress` ya realiza estos pasos y las comprobaciones de persistencia.

## Fuentes técnicas

- [Artillery: escenarios y fases](https://www.artillery.io/docs/reference/test-script).
- [Artillery: motor HTTP y hooks](https://www.artillery.io/docs/reference/engines/http).
- [Artillery: ensure](https://www.artillery.io/docs/reference/extensions/ensure).
- [Artillery: expect](https://www.artillery.io/docs/reference/extensions/expect).
