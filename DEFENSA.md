# Cómo defender la práctica 3

## Guion de apertura (30 segundos)

> Implementé un módulo de gestión de empleados con cinco operaciones: listar, registrar, consultar por ID, actualizar y eliminar. La solución separa el acceso a datos de HTTP, valida las entradas en ejecución y mantiene el estado de Angular en un servicio reactivo. Dividí la vista en un componente orquestador, un formulario y una tabla. Mantuve la estructura pequeña para poder explicar cada responsabilidad.

## Reto 1: Repository y dependencia inversa

Abre estos archivos, en este orden:

1. `backend/src/domain/employee.ts`: son datos TypeScript simples.
2. `backend/src/repository/IEmployeeRepository.ts`: define qué operaciones se necesitan.
3. `backend/src/controllers/empleados.controllers.ts`: recibe la interfaz como parámetro.
4. `backend/src/index.ts`: elige e inyecta `new MongoEmployeeRepository()`.

Puedes decir:

> El controlador no conoce el modelo Empleado ni importa Mongoose. Solo utiliza IEmployeeRepository. La implementación MongoEmployeeRepository adapta ese contrato a Mongoose y convierte sus documentos en objetos simples. El punto de composición es index.ts.

```text
Controlador Express -> IEmployeeRepository <- MongoEmployeeRepository -> Mongoose
```

**Cómo lo demuestras:** ejecuta `npm run typecheck` y `npm test` desde backend. Las pruebas inyectan un repositorio en memoria en `createApp(repository)`, hacen peticiones HTTP y verifican que Mongoose no se cargó.

**Si preguntan cómo cambiarías a PostgreSQL:** implementarías la misma interfaz y cambiarías la implementación inyectada en index.ts. La interfaz, los DTO y el controlador podrían conservarse si se mantiene el contrato de IDs y datos.

**Si preguntan si eliminarías Mongoose por completo:** el controlador y la API con otro repositorio funcionan sin cargarlo. El arranque actual de producción sí utiliza Mongoose porque se eligió MongoDB como persistencia.

## Reto 2: DTO, wrapper e interceptor de errores

Abre `backend/src/dto/employee.dto.ts`.

> TypeScript revisa tipos al compilar, pero un cliente HTTP puede enviar cualquier JSON. Zod valida ese JSON durante la ejecución, antes de que llegue al repositorio. Rechazo sueldos negativos, números escritos como texto, nombres vacíos, IDs mal formados y propiedades no autorizadas.

Muestra las diferencias:

- POST y PUT usan `createEmployeeDto`: requieren los cuatro campos.
- PATCH usa `updateEmployeeDto`: permite un subconjunto, pero rechaza un cuerpo vacío.
- `employeeParamsDto` valida el ID.
- `employeeQueryDto` valida página y límite.

Abre `backend/src/http/response.ts` y `error-handler.ts`.

> Todas las respuestas tienen success, data, message, errors y meta. El middleware global convierte los errores de Zod en 400, los registros ausentes en 404 y los errores internos en 500 sin enviar al cliente excepciones ni stack traces. Express 5 envía también los rechazos de controladores async al middleware.

**Demostración:** manda POST con `"sueldo": -1`. Luego consulta un ID mal formado y otro válido que no exista. Compara las respuestas: cambia el estado HTTP, pero se conserva la estructura JSON.

**Qué significa mutación segura aquí:** el DTO acepta solo campos editables; el repositorio utiliza `$set` con esos campos y `runValidators: true`. El cliente no puede modificar `_id` ni enviar operadores arbitrarios.

**Por qué DELETE responde 200 y no 204:** se decidió devolver un cuerpo con el mismo wrapper y el ID eliminado. Un 204 no llevaría cuerpo.

## Reto 3: RxJS e inmutabilidad

Abre `frontend/src/app/services/empleado.service.ts`. La clase se llama **EmployeeService**.

> El servicio es el único que consume HttpClient y administra la lista. El BehaviorSubject es privado, tiene un valor inicial y entrega el último estado a nuevos suscriptores. La vista recibe empleados$ mediante asObservable; no puede invocar next desde ese contrato público.

Señala estas tres operaciones:

```ts
// Crear: un arreglo nuevo.
[...this.empleadosSubject.value, response.data]

// Actualizar: reemplazar solo el objeto modificado en un arreglo nuevo.
this.empleadosSubject.value.map(
  empleado => empleado._id === id ? response.data : empleado
)

// Eliminar: producir otro arreglo sin el registro.
this.empleadosSubject.value.filter(empleado => empleado._id !== id)
```

> Espero la respuesta exitosa del backend antes de publicar el nuevo estado. Si falla una petición, se conserva la lista anterior, se publica el error y finalize libera el estado de carga para reintentar.

**Por qué no push o splice:** alterarían el arreglo compartido. Con referencias nuevas se conserva el estado anterior y se facilita la detección de cambios, especialmente con OnPush.

**¿El símbolo $ hace reactivo al dato?** No. Es una convención para identificar observables. La reactividad proviene de RxJS y de la suscripción que hace el async pipe.

**¿Readonly congela objetos en ejecución?** No. Es una restricción de TypeScript. Además se usan copias y operaciones que producen nuevas referencias; las pruebas comprueban que los estados anteriores siguen intactos.

## Reto 4: Smart vs. Dumb

Abre el HTML de `frontend/src/app/components/empleado`.

> EmpleadoComponent es el orquestador: obtiene los observables del servicio, los consume con async y atiende las intenciones de la vista. EmpleadoFormComponent y EmpleadoListComponent son presentacionales: reciben datos por Input y emiten eventos por Output. Ninguno inyecta EmployeeService ni HttpClient.

```text
EmployeeService -> empleados$ -> async -> EmpleadoComponent
                                         | Input
                                         v
                             Formulario / Tabla
                                         | Output
                                         v
                                  Orquestador -> servicio
```

**¿El formulario puede tener estado local?** Sí. Tiene un borrador para los campos que el usuario está escribiendo; no administra la colección de empleados ni hace llamadas HTTP. Copia el Input para no modificar una fila antes de guardar.

**¿Por qué hay subscribe en el orquestador?** Las acciones de guardar, consultar o eliminar deben iniciar peticiones HTTP finitas. La lectura continua del estado de la vista utiliza async. No se mantienen suscripciones manuales a la colección.

**¿Qué hace async?** Se suscribe al observable, actualiza la vista cuando emite y se desuscribe cuando la vista se destruye.

## Demostración en vivo (3 minutos)

1. Abre la aplicación y pulsa Recargar lista.
2. Crea un empleado temporal con nombre `Demo defensa`, cargo `Analista`, departamento `Sistemas` y sueldo `1200`.
3. Pulsa Editar. Esa acción utiliza GET por ID.
4. Cambia el nombre del formulario y señala que la fila todavía conserva el anterior.
5. Guarda los cambios. Explica que se hace PUT y el servicio publica otra referencia.
6. Escribe un borrador y pulsa Limpiar. Señala que no se creó ni actualizó ningún registro.
7. En Postman, usa el ID del empleado temporal: GET por ID, GET paginado y PATCH con `{ "sueldo": 1500 }`.
8. Envía un PATCH inválido con `{ "sueldo": -1 }` y muestra el 400 con wrapper.
9. Recarga la lista y elimina únicamente el empleado temporal. GET de ese mismo ID devuelve 404.
10. Ejecuta las pruebas y muestra los resultados.

La colección `Practica-3.postman_collection.json` guarda automáticamente `empleadoId` al ejecutar su petición de creación. No ejecutes la creación de nuevo si aún no terminaste de eliminar el registro temporal anterior.

## Preguntas rápidas

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué principio aplicaste con Repository? | Inversión de dependencias: el controlador depende de una abstracción. |
| ¿Qué gana cada componente al separarse? | Una responsabilidad concreta y pruebas independientes de sus datos y eventos. |
| ¿Por qué validar también en el backend? | Un cliente puede omitir el formulario y llamar directamente a la API. |
| ¿Por qué validar también en Mongoose? | Es una segunda defensa al escribir en la persistencia. |
| ¿Por qué hay PUT y PATCH? | PUT exige todos los campos editables; PATCH solo los que cambian. |
| ¿Cuál es el ID? | El _id único de MongoDB, conservado para esta práctica. No es un entero consecutivo. |
| ¿Cómo se elimina? | Físicamente con findByIdAndDelete; responde con el ID eliminado. |
| ¿Hay paginación? | La API la soporta con page y limit. La UI usa el listado completo permitido por el enunciado. |
| ¿Se agregó cédula? | No; se validan los campos del modelo original y la estructura del ID. |
| ¿Cómo compruebas el desacoplamiento? | Typecheck y peticiones HTTP con un repositorio alternativo sin cargar Mongoose. |

## Qué evidencia corresponde a cada prueba

- Backend: 6 pruebas con servidor HTTP temporal y repositorio en memoria.
- MongoDB: 1 prueba de integración separada, con lectura de lo persistido y limpieza de su registro temporal.
- Angular: 5 pruebas en navegador, con HTTP simulado. Cubren referencias inmutables y eventos reales del DOM.
- Build Angular: compila TypeScript y las plantillas con tipado estricto, y genera la aplicación.

Los comandos y requisitos de arranque están en [README.md](README.md). Las pruebas de Angular con HTTP simulado y la prueba real de MongoDB son evidencias complementarias.
