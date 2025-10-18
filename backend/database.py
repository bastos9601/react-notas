from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de la base de datos - usando la base de datos local en el backend
# Usamos ruta absoluta para asegurar que siempre use la base de datos del directorio backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "sistema_notas.db")
# Imprimir la ruta para verificar dónde se está creando la base de datos
print(f"Ruta de la base de datos: {DB_PATH}")

# Forzar el uso de la base de datos del directorio backend
# Ignorar cualquier variable de entorno DATABASE_URL
DATABASE_URL = f"sqlite:///{DB_PATH}"

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
