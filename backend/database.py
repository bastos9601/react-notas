from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de la base de datos
# Usamos ruta absoluta para asegurar que en desarrollo use la base local
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "sistema_notas.db")
# Imprimir la ruta local para verificar dónde se está creando la base de datos
print(f"Ruta de la base de datos (local): {DB_PATH}")

# Usar DATABASE_URL si está definido (producción), de lo contrario usar SQLite local (desarrollo)
DATABASE_URL = os.getenv("DATABASE_URL") or f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
