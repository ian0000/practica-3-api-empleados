import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createApp } from '../src/app.js';
import type { Employee, EmployeeData, EmployeeList, Pagination } from '../src/domain/employee.js';
import type { IEmployeeRepository } from '../src/repository/IEmployeeRepository.js';

class MemoryEmployeeRepository implements IEmployeeRepository {
  private employees = new Map<string, Employee>();
  private sequence = 0;

  async findAll(pagination?: Pagination): Promise<EmployeeList> {
    const all = [...this.employees.values()].map(employee => ({ ...employee }));
    const start = pagination ? (pagination.page - 1) * pagination.limit : 0;
    return { items: pagination ? all.slice(start, start + pagination.limit) : all, total: all.length };
  }

  async findById(id: string): Promise<Employee | null> {
    const employee = this.employees.get(id);
    return employee ? { ...employee } : null;
  }

  async create(data: EmployeeData): Promise<Employee> {
    const now = new Date().toISOString();
    const employee: Employee = {
      ...data, _id: (++this.sequence).toString(16).padStart(24, '0'), createdAt: now, updatedAt: now
    };
    this.employees.set(employee._id, employee);
    return { ...employee };
  }

  async update(id: string, data: Partial<EmployeeData>): Promise<Employee | null> {
    const existing = this.employees.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.employees.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }
}

async function withApi(
  run: (url: string) => Promise<void>,
  repository: IEmployeeRepository = new MemoryEmployeeRepository()
) {
  const server = createApp(repository).listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    await run('http://127.0.0.1:' + (server.address() as AddressInfo).port + '/api/empleados');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

const data: EmployeeData = {
  nombre: 'Ana Torres', cargo: 'Desarrolladora', departamento: 'Tecnología', sueldo: 1000
};
const absentId = 'ffffffffffffffffffffffff';
const json = (method: string, body: unknown): RequestInit => ({
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

test('CRUD HTTP: creación 201, consulta por ID, PATCH parcial, PUT completo y eliminación física', async () => {
  await withApi(async url => {
    const initial = await (await fetch(url)).json();
    assert.deepEqual(initial.data, []);
    assert.equal(initial.meta.total, 0);

    const response = await fetch(url, json('POST', { ...data, nombre: '  Ana Torres  ' }));
    assert.equal(response.status, 201);
    const created = await response.json();
    assert.equal(created.success, true);
    assert.equal(created.data.nombre, 'Ana Torres');
    assert.equal(response.headers.get('location'), '/api/empleados/' + created.data._id);
    const itemUrl = url + '/' + created.data._id;

    const single = await (await fetch(itemUrl)).json();
    assert.deepEqual(single.data, created.data);
    const patch = await fetch(itemUrl, json('PATCH', { sueldo: 1500 }));
    assert.equal(patch.status, 200);
    const patched = await patch.json();
    assert.equal(patched.data.sueldo, 1500);
    assert.equal(patched.data.nombre, data.nombre);

    assert.equal((await fetch(itemUrl, json('PUT', { sueldo: 2000 }))).status, 400);
    const put = await fetch(itemUrl, json('PUT', { ...data, cargo: 'Líder', sueldo: 2000 }));
    assert.equal(put.status, 200);
    assert.equal((await put.json()).data.cargo, 'Líder');

    const deleted = await fetch(itemUrl, { method: 'DELETE' });
    assert.equal(deleted.status, 200);
    assert.deepEqual((await deleted.json()).data, { id: created.data._id });
    assert.equal((await fetch(itemUrl)).status, 404);
    assert.deepEqual((await (await fetch(url)).json()).data, []);
  });

  const require = createRequire(import.meta.url);
  assert.equal(Object.keys(require.cache).some(path => /[/\\]node_modules[/\\]mongoose[/\\]/.test(path)), false,
    'La API con repositorio alternativo no debe cargar Mongoose');
});

test('Listado completo y paginado con total, valores por defecto y límites seguros', async () => {
  await withApi(async url => {
    for (const nombre of ['Ana Torres', 'Luis Pérez', 'María Díaz']) {
      await fetch(url, json('POST', { ...data, nombre }));
    }
    assert.equal((await (await fetch(url)).json()).data.length, 3);
    const page = await (await fetch(url + '?page=2&limit=2')).json();
    assert.equal(page.data.length, 1);
    assert.equal(page.data[0].nombre, 'María Díaz');
    assert.deepEqual(page.meta, { page: 2, limit: 2, total: 3, totalPages: 2 });
    assert.equal((await (await fetch(url + '?limit=2')).json()).meta.page, 1);
    assert.equal((await (await fetch(url + '?page=1')).json()).meta.limit, 10);
    assert.deepEqual((await (await fetch(url + '?page=9&limit=2')).json()).data, []);
    for (const query of ['page=0', 'page=1.5', 'limit=101', 'limit=no', 'page[]=1', 'sort=nombre']) {
      assert.equal((await fetch(url + '?' + query)).status, 400, query);
    }
  });
});

test('DTO rechaza tipos incorrectos, espacios, sueldo negativo y propiedades no permitidas', async () => {
  await withApi(async url => {
    for (const body of [
      {}, null, [], { ...data, nombre: '   ' }, { ...data, sueldo: '1000' },
      { ...data, sueldo: -1 }, { ...data, cargo: 9 }, { ...data, _id: absentId },
      { ...data, $set: { sueldo: 0 } }, { ...data, nombre: 'x'.repeat(101) }
    ]) {
      const response = await fetch(url, json('POST', body));
      assert.equal(response.status, 400, JSON.stringify(body));
      const result = await response.json();
      assert.equal(result.success, false);
      assert.equal(result.data, null);
      assert.ok(Array.isArray(result.errors));
      if (body !== null) assert.ok(result.errors.length > 0);
      assert.equal(result.stack, undefined);
    }
    assert.deepEqual((await (await fetch(url)).json()).data, []);
    for (const body of [{}, { _id: absentId }, { $set: { sueldo: 0 } }, { sueldo: null }]) {
      assert.equal((await fetch(url + '/' + absentId, json('PATCH', body))).status, 400);
    }
  });
});

test('Parámetros inválidos producen 400; IDs válidos ausentes producen 404 en todas las operaciones', async () => {
  await withApi(async url => {
    for (const method of ['GET', 'PUT', 'PATCH', 'DELETE']) {
      const options = method === 'PUT' ? json(method, data)
        : method === 'PATCH' ? json(method, { sueldo: 1 }) : { method };
      assert.equal((await fetch(url + '/invalido', options)).status, 400);
      const response = await fetch(url + '/' + absentId, options);
      assert.equal(response.status, 404);
      assert.equal((await response.json()).message, 'Empleado no encontrado');
    }
  });
});

test('El wrapper también cubre JSON roto, cuerpos excesivos y rutas inexistentes', async () => {
  await withApi(async url => {
    const invalid = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"nombre":'
    });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).success, false);
    const large = await fetch(url, json('POST', { ...data, nombre: 'x'.repeat(110000) }));
    assert.equal(large.status, 413);
    assert.equal((await large.json()).data, null);
    const missing = await fetch(url.replace('/empleados', '/desconocida'));
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).success, false);
  });
});

test('Errores internos del repositorio se interceptan sin exponer detalles ni stack', async () => {
  const repository = new MemoryEmployeeRepository();
  repository.findAll = async () => { throw new Error('detalle privado de persistencia'); };
  await withApi(async url => {
    const response = await fetch(url);
    assert.equal(response.status, 500);
    const body = await response.json();
    assert.deepEqual(body, {
      success: false, data: null, message: 'Error interno del servidor', errors: [], meta: null
    });
  }, repository);
});
