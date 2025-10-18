#!/usr/bin/env python3
"""
Script para migrar datos desde SQLite (archivo local) a PostgreSQL.

Uso:
  - Establece variables de entorno:
      SQLITE_PATH (opcional) -> ruta del archivo SQLite, por defecto backend/sistema_notas.db
      POSTGRES_URL (requerido) -> cadena de conexión de PostgreSQL
  - Ejecuta:
      python backend/tools/migrate_sqlite_to_postgres.py

Nota:
  - Este script asume que la base de datos de destino (Postgres) está vacía.
  - Inserta los IDs explícitos para preservar relaciones; luego reajusta secuencias.
  - Requiere acceso a Internet para conectar a Postgres administrado (e.g., Neon, Supabase).
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, select
from sqlalchemy.orm import sessionmaker

# Importar modelos y tabla de asociación
# Asegurar que el directorio backend esté en el sys.path
import sys
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(BACKEND_DIR)
from models import (
    Base,
    Usuario,
    Alumno,
    Docente,
    Asignatura,
    Nota,
    Promedio,
    ReporteDocente,
    HistorialAcademico,
    AsignaturaHistorial,
    NotaHistorial,
    matriculas,
)

load_dotenv()

SQLITE_PATH = os.getenv("SQLITE_PATH") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sistema_notas.db")
POSTGRES_URL = os.getenv("POSTGRES_URL")

if not POSTGRES_URL:
    raise RuntimeError("POSTGRES_URL no está definido. Establece la variable de entorno con tu cadena de conexión de PostgreSQL.")

# Construir URL de SQLite absoluta
SQLITE_PATH = os.path.abspath(SQLITE_PATH)
sqlite_url = f"sqlite:///{SQLITE_PATH}"
print(f"Usando SQLite en: {SQLITE_PATH}")
print(f"Conectando a Postgres: {POSTGRES_URL}")

sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
pg_engine = create_engine(POSTGRES_URL)

SQLiteSession = sessionmaker(bind=sqlite_engine)
PGSession = sessionmaker(bind=pg_engine)

src = SQLiteSession()
dst = PGSession()

# Crear tablas en Postgres según los modelos
print("Creando tablas en Postgres si no existen...")
Base.metadata.create_all(bind=pg_engine)

def copy_model(model):
    columns = [c.name for c in model.__table__.columns]
    rows = src.query(model).all()
    print(f"Copiando {len(rows)} filas de {model.__tablename__}...")
    for r in rows:
        data = {col: getattr(r, col) for col in columns}
        dst.add(model(**data))
    dst.commit()

# Evitar duplicar si ya hay datos
if dst.query(Usuario).first():
    raise RuntimeError("La base de datos Postgres ya contiene datos. Aborta para evitar duplicados.")

try:
    # Orden respetando claves foráneas
    copy_model(Usuario)
    copy_model(Docente)
    copy_model(Alumno)
    copy_model(Asignatura)
    # Tabla de asociación muchos-a-muchos
    assoc_rows = src.execute(select(matriculas)).fetchall()
    print(f"Copiando {len(assoc_rows)} filas de tabla de asociación 'matriculas'...")
    for row in assoc_rows:
        dst.execute(matriculas.insert().values(alumno_id=row.alumno_id, asignatura_id=row.asignatura_id))
    dst.commit()
    # Resto de tablas
    copy_model(Nota)
    copy_model(Promedio)
    copy_model(HistorialAcademico)
    copy_model(AsignaturaHistorial)
    copy_model(NotaHistorial)

    # Ajustar secuencias en Postgres para que el siguiente ID no colisione
    print("Ajustando secuencias en Postgres...")
    seq_tables = [
        Usuario.__tablename__,
        Docente.__tablename__,
        Alumno.__tablename__,
        Asignatura.__tablename__,
        Nota.__tablename__,
        Promedio.__tablename__,
        ReporteDocente.__tablename__,
        HistorialAcademico.__tablename__,
        AsignaturaHistorial.__tablename__,
        NotaHistorial.__tablename__,
    ]
    for t in seq_tables:
        dst.execute(text(
            f"SELECT setval(pg_get_serial_sequence('\"{t}\"','id'), COALESCE((SELECT MAX(id) FROM \"{t}\"), 1), true)"
        ))
    dst.commit()

    print("Migración completada exitosamente.")
except Exception as e:
    dst.rollback()
    raise
finally:
    src.close()
    dst.close()