> Nueva práctica de pruebas: consulta [las guías, capturas e informe](pruebas/README.md).

# Práctica 3 · Sistema de Gestión de Empleados

Implementación sencilla de los cuatro retos: Repository, DTO con Zod, respuestas uniformes, estado reactivo y componentes Smart/Dumb. Se conservan nombre, cargo, departamento, sueldo y el identificador `_id` de MongoDB.

- [Descripción corta y dos conclusiones técnicas](ENTREGA.md)
- [Guía para defender la práctica](DEFENSA.md)
- [Colección importable de Postman](Practica-3.postman_collection.json)
- [Backend](backend/src) · [Frontend](frontend/src/app)

## Arranque local

Requisitos: Node.js, npm y MongoDB. El backend instala Node.js 24.22.0 como dependencia local para las herramientas de pruebas; compruébalo con `npm.cmd run runtime` desde `backend`. Angular CLI se utiliza desde el proyecto con npm; no requiere instalación global.

Clona el repositorio y entra a su carpeta:

```powershell
git clone https://github.com/ian0000/practica-3-api-empleados.git
cd practica-3-api-empleados
```

1. Inicia MongoDB. Con Docker Desktop abierto, crea el contenedor la primera vez:

   ```powershell
   docker run -d --name mongo-practica3 -p 127.0.0.1:27017:27017 -v mongo-practica3-data:/data/db mongo:7
   ```

   Si el contenedor ya existe, inícialo:

   ```powershell
   docker start mongo-practica3
   ```

   Compass es el cliente gráfico; la conexión es `mongodb://127.0.0.1:27017/usuarios_db`. El backend también admite la variable `MONGO_URI` para otra instancia.

2. Desde `backend`:

   ```powershell
   npm ci
   npm run dev
   ```

3. En otra terminal, desde `frontend`:

   ```powershell
   npm ci
   npm start
   ```

4. Abre [Angular](http://localhost:4200). La API usa [localhost:3000/api/empleados](http://localhost:3000/api/empleados).

Ejecuta `npm ci` en ambas carpetas para instalar las dependencias de los archivos de bloqueo.

## Contratos REST

| Operación | Método y ruta | Resultado |
| --- | --- | --- |
| Consulta completa | GET `/api/empleados` | 200 y lista |
| Consulta paginada | GET `/api/empleados?page=1&limit=10` | 200, lista y metadatos |
| Registro | POST `/api/empleados` | 201, empleado creado y cabecera Location |
| Consulta por ID | GET `/api/empleados/:id` | 200 o 404 |
| Actualización total de campos editables | PUT `/api/empleados/:id` | 200; exige los cuatro campos |
| Actualización parcial | PATCH `/api/empleados/:id` | 200; al menos un campo |
| Eliminación física | DELETE `/api/empleados/:id` | 200 y el ID eliminado |

Si solo envías `page`, `limit` vale 10; si solo envías `limit`, `page` vale 1. El límite es de 1 a 100. Sin ambos parámetros se devuelve la lista completa. La interfaz utiliza esta consulta completa para mantener la práctica simple.

Ejemplo de POST o PUT:

```json
{
  "nombre": "Ana Torres",
  "cargo": "Desarrolladora",
  "departamento": "Tecnología",
  "sueldo": 1200
}
```

Ejemplo de PATCH:

```json
{ "sueldo": 1500 }
```

Los textos se recortan y deben tener entre 2 y 100 caracteres. El sueldo debe ser un número finito mayor o igual a cero. No se aceptan campos adicionales, `_id`, fechas ni operadores de MongoDB en los cuerpos. Los IDs deben tener 24 caracteres hexadecimales. Un ID mal formado produce 400; uno válido que no existe produce 404.

Se mantiene `_id`, según lo confirmado para esta práctica. Es un identificador único de MongoDB; no es una secuencia numérica 1, 2, 3. La validación de identidad cubre los campos definidos y la estructura del ID; no se agregó una cédula que el modelo inicial no contiene.

## Respuesta universal

Todas las respuestas generadas por la aplicación conservan las mismas cinco propiedades:

```json
{
  "success": true,
  "data": [],
  "message": "Empleados consultados",
  "errors": [],
  "meta": { "page": 1, "limit": 0, "total": 0, "totalPages": 0 }
}
```

En un error, `success` es false, `data` y `meta` son null, y `errors` contiene los detalles de validación cuando corresponda. Un fallo interno devuelve 500 con un mensaje genérico; su detalle se registra únicamente en el servidor. DELETE usa 200 para poder devolver el wrapper.

## Dónde está cada reto

| Reto | Archivos principales | Evidencia |
| --- | --- | --- |
| 1. Repository | `backend/src/repository/IEmployeeRepository.ts`, `empleado.repositorio.ts`, `src/index.ts` | Pruebas HTTP con otro repositorio sin cargar Mongoose |
| 2. DTO y wrapper | `backend/src/dto/employee.dto.ts`, `src/http/response.ts`, `error-handler.ts` | Casos inválidos 400, ausentes 404 y excepción 500 |
| 3. Reactividad | `frontend/src/app/services/empleado.service.ts` (clase EmployeeService) | BehaviorSubject privados, asObservable, spread, map y filter |
| 4. Smart/Dumb | `components/empleado`, `empleado-form`, `empleado-list` | async pipe, Input/Output y pruebas de interacción |

## Verificación reproducible

Desde backend:

```powershell
npm run typecheck
npm test
npm run test:api
npm run test:mongo
```

- `npm test`: 7 pruebas unitarias Jest del controlador con mocks; no necesita MongoDB.
- `npm run test:api`: 7 pruebas con HTTP real y repositorio en memoria, incluido el alias `/api/v1/employees`; no necesita MongoDB.
- `npm run test:mongo`: 1 prueba con persistencia real. Necesita MongoDB activo. Crea y elimina únicamente su empleado temporal y comprueba que el total de registros regresa al valor inicial.

Desde frontend:

```powershell
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

En PowerShell, si npm no pasa correctamente los argumentos, usa `npm.cmd`. Para utilizar Edge instalado en este equipo:

```powershell
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm.cmd test -- --watch=false --browsers=ChromeHeadless
```

Las 5 pruebas de Angular verifican referencias inmutables, errores recuperables y los eventos reales de crear, editar, guardar, limpiar y eliminar. Usan HTTP simulado mediante HttpTestingController. La prueba `test:mongo` verifica la persistencia real por separado.

## Procedencia del material base

La práctica parte de los repositorios docentes [pmpvhr/code](https://github.com/pmpvhr/code) (backend) y [pmpvhr/maestria](https://github.com/pmpvhr/maestria) (frontend). Se conserva el enunciado inicial en `backend/README.md`; los contratos y comandos actuales están documentados en este README.
