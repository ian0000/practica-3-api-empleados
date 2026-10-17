import express from "express";
import morgan from "morgan";
import cors from "cors";
import { createEmpleadosRoutes } from "./routes/empleados.routes.js";
import type { IEmployeeRepository } from "./repository/IEmployeeRepository.js";
import { AppError, errorHandler } from "./http/error-handler.js";

export function createApp(repository: IEmployeeRepository) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.set("puerto", process.env.PORT || 3000);
  app.set("nombreApp", "Gestión de empleados");
  app.use(morgan("dev"));
  app.use("/api", createEmpleadosRoutes(repository));
  app.use((_req, _res, next) => next(new AppError(404, "Ruta no encontrada")));
  // Express 5 deriva aquí también los rechazos de los controladores async.
  app.use(errorHandler);

  return app;
}
