import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { MongoEmployeeRepository } from '../src/repository/empleado.repositorio.js';
import type { EmployeeData } from '../src/domain/employee.js';

// Entrada exclusiva del laboratorio: nunca utiliza usuarios_db.
const dbName = process.env.STRESS_DB_NAME ?? `practica5_stress_${Date.now()}`;
if (!/^practica5_stress_[a-z\d_]+$/.test(dbName)) throw new Error('Nombre de base de pruebas inválido');
await mongoose.connect('mongodb://127.0.0.1:27017/' + dbName, { serverSelectionTimeoutMS: 5000 });
if (await mongoose.connection.collection('empleados').countDocuments() !== 0) {
  throw new Error('La base de pruebas ya contiene registros; no se modifica.');
}

const stats = { repositoryCreates: 0, invalidRepositoryCalls: 0, codes: {} as Record<string, number> };
class ObservedRepository extends MongoEmployeeRepository {
  override async create(data: EmployeeData) {
    stats.repositoryCreates++;
    if (data.sueldo < 0) stats.invalidRepositoryCalls++;
    return super.create(data);
  }
}
const app = createApp(new ObservedRepository());
const delay = monitorEventLoopDelay({ resolution: 10 });
delay.enable();
let utilization = performance.eventLoopUtilization();
const started = performance.now();
const samples: object[] = [];
const timer = setInterval(() => {
  const current = performance.eventLoopUtilization();
  samples.push({ seconds: (performance.now() - started) / 1000,
    codes: { ...stats.codes }, repositoryCreates: stats.repositoryCreates,
    eventLoopP99Ms: delay.percentile(99) / 1e6,
    eventLoopUtilization: performance.eventLoopUtilization(current, utilization).utilization,
    heapMB: process.memoryUsage().heapUsed / 1024 / 1024 });
  utilization = current;
  delay.reset();
}, 1000);

const server = createServer(async (req, res) => {
  if (req.url === '/__stress__/metrics' && req.method === 'GET') {
    const stored = await mongoose.connection.collection('empleados').countDocuments();
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ node: process.version, dbName, stored, ...stats, samples }));
    return;
  }
  if (req.url === '/__stress__/shutdown' && req.method === 'POST') {
    // Solo se elimina la base nueva creada para esta ejecución, verificada por nombre.
    if (mongoose.connection.name !== dbName) throw new Error('La base actual no coincide');
    await mongoose.connection.dropDatabase();
    res.end('Base temporal eliminada');
    clearInterval(timer);
    delay.disable();
    server.close(() => { void mongoose.disconnect(); });
    return;
  }
  res.on('finish', () => {
    const code = String(res.statusCode);
    stats.codes[code] = (stats.codes[code] ?? 0) + 1;
  });
  app(req, res);
});
server.listen(Number(process.env.PORT ?? 3000), '127.0.0.1', () => {
  console.log(`STRESS_READY http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  console.log(`Base aislada: ${dbName}; runtime: ${process.version}`);
});
