import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createWriteStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const backend = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../../pruebas/resultados/', import.meta.url);
mkdirSync(output, { recursive: true });
const serverLog = createWriteStream(new URL('servidor-stress.log', output));
const child = spawn(process.execPath, ['--import', 'tsx', 'scripts/start-stress.ts'], {
  cwd: backend, env: { ...process.env, PORT: '0', STRESS_DB_NAME: `practica5_stress_${Date.now()}` },
  windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
child.stdout.pipe(serverLog);
child.stderr.pipe(serverLog);
let endpoint;
try {
  endpoint = await new Promise((resolve, reject) => {
    let text = '';
    const timer = setTimeout(() => reject(new Error('El backend de carga no inició. Revisa MongoDB y servidor-stress.log.')), 15000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`Backend de carga terminado: ${code}`)); });
    child.stdout.on('data', chunk => {
      text += chunk;
      const match = text.match(/STRESS_READY (http:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
  });
  console.log('Carga local sobre:', endpoint, '| Node:', process.version);
  const artilleryPackage = JSON.parse(readFileSync(new URL('../node_modules/artillery/package.json', import.meta.url)));
  const bin = typeof artilleryPackage.bin === 'string' ? artilleryPackage.bin : artilleryPackage.bin.artillery;
  const cli = fileURLToPath(new URL('../node_modules/artillery/' + bin, import.meta.url));
  const artilleryLog = createWriteStream(new URL('artillery.log', output));
  const runner = spawn(process.execPath, [cli, 'run', fileURLToPath(new URL('../../stress-test.yml', import.meta.url)),
    '--target', endpoint, '--output', fileURLToPath(new URL('artillery.json', output))], {
    cwd: backend, env: { ...process.env, ARTILLERY_DISABLE_TELEMETRY: '1' }, windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  runner.stdout.pipe(process.stdout);
  runner.stderr.pipe(process.stderr);
  runner.stdout.pipe(artilleryLog);
  runner.stderr.pipe(artilleryLog);
  const [code] = await once(runner, 'exit');
  await new Promise(resolve => artilleryLog.end(resolve));
  const metrics = await (await fetch(endpoint + '/__stress__/metrics')).json();
  writeFileSync(new URL('backend-metricas.json', output), JSON.stringify(metrics, null, 2) + '\n');
  const report = JSON.parse(readFileSync(new URL('artillery.json', output)));
  const counters = report.aggregate.counters;
  const verified = metrics.repositoryCreates === counters['http.codes.201']
    && metrics.stored === counters['http.codes.201'] && metrics.invalidRepositoryCalls === 0
    && counters['http.codes.400'] === counters['traffic.corrupt.sent']
    && counters['zod.rejected'] === counters['traffic.corrupt.sent'];
  console.log('Persistencia real: llamadas create =', metrics.repositoryCreates, '| registros =', metrics.stored,
    '| llamadas con sueldo negativo =', metrics.invalidRepositoryCalls);
  console.log('Correspondencia de tráfico y persistencia:', verified ? 'PASS' : 'FAIL');
  writeFileSync(new URL('resultado-ejecucion.json', output), JSON.stringify({ artilleryExitCode: code,
    persistenciaVerificada: verified, endpoint, node: process.version, dbName: metrics.dbName }, null, 2) + '\n');
  process.exitCode = code === 0 && verified ? 0 : 1;
} finally {
  if (endpoint && child.exitCode === null) {
    try {
      const response = await fetch(endpoint + '/__stress__/shutdown', { method: 'POST', signal: AbortSignal.timeout(10000) });
      console.log('Limpieza:', await response.text());
      await Promise.race([once(child, 'exit'), new Promise(resolve => setTimeout(resolve, 3000))]);
    } catch (error) { console.error('No se completó la limpieza automática:', error.message); }
  }
  if (child.exitCode === null) child.kill();
  serverLog.end();
}
