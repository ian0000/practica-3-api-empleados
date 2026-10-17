# Práctica 3 · Descripción y conclusiones técnicas

## Descripción corta

Se implementó un sistema CRUD de empleados con una API REST en Express, TypeScript y MongoDB, y una interfaz en Angular. Se aplicaron el patrón Repository, validación de entradas con DTO y Zod, respuestas uniformes y manejo global de errores. En el frontend se utilizó RxJS para administrar el estado de forma reactiva e inmutable, con componentes Smart/Dumb. Se incluyeron pruebas automatizadas, una colección de Postman y una guía de defensa.

## Conclusiones técnicas

1. El patrón Repository y la inyección de dependencias reducen el acoplamiento entre la API y MongoDB: los controladores dependen de una interfaz y pueden probarse con un repositorio en memoria sin cargar Mongoose. Los DTO con Zod y las respuestas uniformes permiten validar entradas y mantener un contrato HTTP consistente.

2. La gestión de estado con BehaviorSubject privados y actualizaciones inmutables centraliza los cambios y evita mutaciones compartidas. La separación Smart/Dumb distribuye responsabilidades entre la coordinación, el formulario y la lista, lo que facilita el mantenimiento y las pruebas de interacción.
