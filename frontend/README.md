# Frontend Angular · Gestión de empleados

Desde esta carpeta:

```powershell
npm ci
npm start
```

Abre http://localhost:4200. Requiere el backend activo en http://localhost:3000 y MongoDB.

- `EmployeeService`: HTTP, BehaviorSubject privados y observables públicos.
- `EmpleadoComponent`: orquestador y async pipe.
- `EmpleadoFormComponent`: formulario con copia local del Input y eventos Output.
- `EmpleadoListComponent`: tabla y eventos Output.

```powershell
npm run build
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Para Edge, define CHROME_BIN con la ruta de su ejecutable antes del comando de pruebas. Consulta [README general](../README.md) y [guía de defensa](../DEFENSA.md).
