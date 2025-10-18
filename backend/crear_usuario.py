import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Usuario, Base
from auth import get_password_hash

# Configuración de la base de datos - usando la base de datos local en el backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "sistema_notas.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def crear_usuario(email, password, nombre, rol):
    db = SessionLocal()
    
    # Verificar si el usuario ya existe
    usuario_existente = db.query(Usuario).filter(Usuario.email == email).first()
    if usuario_existente:
        print(f"⚠️ El usuario con email {email} ya existe")
        db.close()
        return False
    
    # Crear nuevo usuario
    password_hash = get_password_hash(password)
    nuevo_usuario = Usuario(
        email=email,
        password_hash=password_hash,
        nombre=nombre,
        rol=rol,
        activo=True
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    print(f"✅ Usuario creado exitosamente:")
    print(f"   Email: {nuevo_usuario.email}")
    print(f"   Nombre: {nuevo_usuario.nombre}")
    print(f"   Rol: {nuevo_usuario.rol}")
    
    db.close()
    return True

if __name__ == "__main__":
    # Crear un usuario de prueba
    crear_usuario(
        email="usuario@test.com",
        password="password123",
        nombre="Usuario de Prueba",
        rol="admin"
    )