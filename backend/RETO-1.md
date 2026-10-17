# Reto 1: Repository y persistencia inversa

El controlador depende de `IEmployeeRepository` y de los datos simples de `domain/employee.ts`. No importa Mongoose ni su modelo.

- `src/repository/IEmployeeRepository.ts`: contrato de listado, consulta por ID, creación, actualización y eliminación.
- `src/repository/empleado.repositorio.ts`: implementación MongoDB y conversión de documentos a datos simples.
- `src/controllers/empleados.controllers.ts`: valida los datos HTTP y utiliza el contrato inyectado.
- `src/index.ts`: elige `MongoEmployeeRepository`.
- `tests/employee-api.test.ts`: implementación alternativa en memoria y prueba de que Mongoose no se carga.

```text
Controlador -> IEmployeeRepository <- MongoEmployeeRepository -> modelo Mongoose
```

Desde backend:

```powershell
npm run typecheck
npm test
```

La solución completa de los cuatro retos, el wrapper y los contratos actualizados se documentan en [README general](../README.md) y [DEFENSA.md](../DEFENSA.md).
