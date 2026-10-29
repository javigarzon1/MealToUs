"""Migración mínima: añade columnas nuevas a tablas que ya existen.

`create_all` crea las tablas que faltan pero no modifica las existentes. Esto evita
tener que borrar `mealtous.db` al añadir `user_id` a la despensa y a las preferencias.
"""
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

# tabla -> [(columna, tipo SQL)]   (valores fijos del código, no entrada de usuario)
_NEW_COLUMNS = {
    "pantry_items": [("user_id", "INTEGER")],
    "user_preferences": [("user_id", "INTEGER")],
}


def ensure_columns(engine: Engine) -> None:
    inspector = inspect(engine)
    with engine.begin() as conn:
        for table, columns in _NEW_COLUMNS.items():
            if not inspector.has_table(table):
                continue
            existing = {c["name"] for c in inspector.get_columns(table)}
            for name, sql_type in columns:
                if name not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {sql_type}"))
