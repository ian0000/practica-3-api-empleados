# Fase A: probar el controlador sin una base de datos

## Qué queremos demostrar

El controlador debe funcionar con cualquier objeto que cumpla `IEmployeeRepository`. Por eso podemos probarlo con funciones simuladas en lugar de conectarlo a MongoDB.

Una prueba unitaria llama directamente al controlador y comprueba sus decisiones. No arranca Express, no abre un puerto y no inicializa una conexión de base de datos.

## Qué se añadió

- [jest.config.js](../backend/jest.config.js): configura Jest para TypeScript y ESM.
- [employee.controller.spec.ts](../backend/src/modules/employee/controllers/employee.controller.spec.ts): contiene siete pruebas aisladas.
- Herramientas de desarrollo locales en `backend/package.json`, incluido Node `24.22.0`.

El controlador existente utiliza la función `createEmpleadoController(repository)`. Cumple el mismo propósito de inyección que el constructor `new EmployeeController(repository)` del ejemplo de la consigna. Se conservó la arquitectura existente y su wrapper de respuesta.

El repositorio real devuelve `{ items, total }`, y la API devuelve `{ success, data, message, errors, meta }`. El mock y las expectativas respetan esos contratos; no se copió literalmente el arreglo plano del ejemplo.

## Cómo funciona el mock

```ts
repository = {
  findAll: jest.fn<IEmployeeRepository['findAll']>(),
  findById: jest.fn<IEmployeeRepository['findById']>(),
  create: jest.fn<IEmployeeRepository['create']>(),
  update: jest.fn<IEmployeeRepository['update']>(),
  delete: jest.fn<IEmployeeRepository['delete']>(),
};
controller = createEmpleadoController(repository);
```

Cada `jest.fn()` sustituye una operación del repositorio. Podemos decidir qué devuelve y luego comprobar cuántas veces se invocó y con qué argumentos.

Por ejemplo, `findAll.mockResolvedValue({ items: [employee], total: 1 })` simula una búsqueda exitosa. Cuando el controlador llama a `findAll`, recibe ese resultado sin acceder a la red.

También simulamos `res.status()`, `res.json()` y `res.location()`. Así podemos comprobar la respuesta HTTP que prepararía el controlador.

## Qué comprueban las siete pruebas

| Caso | Comprobación |
|---|---|
| Listado | Devuelve 200, los datos del mock y los metadatos; llama una sola vez a `findAll`. |
| Paginación | Convierte y entrega al repositorio los valores validados de página y límite. |
| Creación válida | Normaliza el nombre, llama a `create` y devuelve 201. |
| Sueldo negativo | Zod rechaza el payload y `repository.create` no se ejecuta. |
| ID inválido | Zod rechaza el ID antes de consultar el repositorio. |
| ID válido ausente | El resultado `null` del repositorio provoca un error 404. |
| Fallo de persistencia | El controlador propaga el error al interceptor HTTP. |

En las pruebas directas de errores no se espera que el controlador devuelva un JSON 400 o 500: esa tarea corresponde al middleware global. Las pruebas HTTP existentes verifican el interceptor.

## Cómo ejecutarlo

Desde la carpeta `Practica 3`:

```powershell
cd backend
npm.cmd run runtime
npm.cmd test
```

`runtime` muestra Node `v24.22.0`, instalado localmente como herramienta de desarrollo. `npm test` utiliza ese runtime local e inicia Jest con soporte de módulos ESM.

El Node global del equipo no se reemplazó. TypeScript se alineó a `6.0.3` porque la versión instalada de `ts-jest` declara compatibilidad con TypeScript `>=4.3 <7`; el TypeScript 7 previo quedó preservado en el respaldo original.

Resultados de la ejecución real: **1 suite aprobada, 7 pruebas aprobadas**. El log está en [jest.log](resultados/jest.log).

![Ejecución real de Jest](capturas/01-jest.jpg)

La captura muestra el log real guardado, abierto como texto en el navegador local.

## Respuesta a la pregunta de control

La inversión de dependencias hace que el controlador dependa del contrato `IEmployeeRepository`, no de la clase que utiliza MongoDB. En la prueba inyectamos un objeto con las mismas operaciones, implementadas con mocks. Por eso se puede comprobar el controlador sin arrancar Docker ni inicializar MongoDB.

El archivo de pruebas no importa Mongoose, el modelo de persistencia ni `src/index.ts`. Este último es el punto de composición que selecciona la implementación real y abre la conexión. Sus funciones no participan en esta suite.

## Otras comprobaciones

```powershell
npm.cmd run typecheck
npm.cmd run test:api
```

El chequeo de tipos pasó. También pasaron las siete pruebas HTTP de regresión, incluida la ruta `/api/v1/employees` requerida por la nueva consigna. La ruta `/api/empleados` del frontend sigue funcionando.

Esto aporta evidencia de modularidad y capacidad de prueba, dentro del atributo de mantenibilidad solicitado en la consigna. No constituye una certificación del sistema completo.

## Fuentes técnicas

- [Jest: módulos ESM](https://jestjs.io/docs/ecmascript-modules).
- [ts-jest: configuración ESM](https://kulshekhar.github.io/ts-jest/docs/guides/esm-support).
