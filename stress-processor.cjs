module.exports = {
  contarValido(_request, _context, events, next) {
    events.emit('counter', 'traffic.valid.sent', 1);
    next();
  },
  contarCorrupto(_request, _context, events, next) {
    events.emit('counter', 'traffic.corrupt.sent', 1);
    next();
  },
  comprobarZod(_request, response, _context, events, next) {
    let body;
    try { body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body; }
    catch { return next(new Error('La respuesta del DTO no es JSON válido')); }
    const rejected = response.statusCode === 400 && body?.success === false
      && body.errors?.some(issue => issue.field === 'sueldo');
    if (!rejected) return next(new Error('El payload corrupto no fue rechazado por Zod'));
    events.emit('counter', 'zod.rejected', 1);
    next();
  },
};
