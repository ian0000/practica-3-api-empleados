import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { MongoEmployeeRepository } from "./repository/empleado.repositorio.js";

// Punto de composición: aquí se elige la implementación de persistencia.
const app = createApp(new MongoEmployeeRepository());
const port = Number(app.get("puerto"));
await connectDatabase();

app.listen(port, () => {
  console.log("Servidor escuchando en el puerto " + port);
});
