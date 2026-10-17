import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { MongoEmployeeRepository } from '../src/repository/empleado.repositorio.js';

// Prueba explícita de integración: usa MongoDB real y limpia únicamente su propio registro.
test('MongoDB real: listado, POST, GET por ID, PATCH, PUT, rechazo de inyección y DELETE', async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1/usuarios_db', {
    serverSelectionTimeoutMS: 5000
  });
  const repository = new MongoEmployeeRepository();
  const server = createApp(repository).listen(0, '127.0.0.1');
  let id: string | undefined;
  const body = (method: string, data: unknown) => ({
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  try {
    await once(server, 'listening');
    const url = 'http://127.0.0.1:' + (server.address() as AddressInfo).port + '/api/empleados';
    const initial = await (await fetch(url)).json();
    const data = {
      nombre: 'Prueba integración ' + Date.now(), cargo: 'QA temporal',
      departamento: 'Pruebas', sueldo: 1000
    };
    const created = await fetch(url, body('POST', data));
    assert.equal(created.status, 201);
    id = (await created.json()).data._id;
    assert.ok(id);
    assert.equal((await repository.findById(id))?.nombre, data.nombre);
    const itemUrl = url + '/' + id;
    assert.equal((await (await fetch(itemUrl)).json()).data._id, id);

    const patch = await fetch(itemUrl, body('PATCH', { sueldo: 1500 }));
    assert.equal(patch.status, 200);
    assert.equal((await repository.findById(id))?.sueldo, 1500);
    assert.equal((await repository.findById(id))?.nombre, data.nombre);

    const put = await fetch(itemUrl, body('PUT', { ...data, cargo: 'QA actualizado', sueldo: 2000 }));
    assert.equal(put.status, 200);
    assert.equal((await repository.findById(id))?.cargo, 'QA actualizado');
    const unsafe = await fetch(itemUrl, body('PATCH', { $set: { sueldo: 0 } }));
    assert.equal(unsafe.status, 400);
    assert.equal((await repository.findById(id))?.sueldo, 2000);

    const paged = await (await fetch(url + '?page=1&limit=1')).json();
    assert.equal(paged.data.length, 1);
    assert.equal(paged.meta.total, initial.meta.total + 1);
    assert.equal((await fetch(itemUrl, { method: 'DELETE' })).status, 200);
    assert.equal(await repository.findById(id), null);
    assert.equal((await fetch(itemUrl)).status, 404);
    assert.equal((await (await fetch(url)).json()).meta.total, initial.meta.total);
  } finally {
    if (id) await repository.delete(id);
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await mongoose.disconnect();
  }
});
