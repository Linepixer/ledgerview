# Reglas del Proyecto LedgerView

## Base de Datos
- **PROHIBIDO ELIMINAR O LIMPIAR LA BASE DE DATOS:** A partir del 2026-07-01, la base de datos de LedgerView contiene datos reales (historial de SPY, transacciones del usuario, etc.). **Bajo ninguna circunstancia** se deben ejecutar scripts como `wipe_db.py`, hacer un DROP de tablas, o usar comandos destructivos en la base de datos.
- **Cambios Estructurales (Alembic):** Si un nuevo requerimiento exige modificar la estructura (schema) de la base de datos, está estrictamente prohibido hacerlo automáticamente. Se debe comunicar claramente al usuario el cambio requerido y obtener su aprobación explícita antes de generar o aplicar cualquier migración de Alembic.
