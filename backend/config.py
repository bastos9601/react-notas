import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de la aplicación
SECRET_KEY = os.getenv("SECRET_KEY", "tu-clave-secreta-muy-segura-aqui-cambiar-en-produccion")
# Configuración para usar siempre la base de datos del directorio backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "sistema_notas.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
