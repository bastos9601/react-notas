#!/usr/bin/env python3
"""
Script para crear usuario administrador inicial
Ejecutar desde el directorio backend/
"""

import sys
import os
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Usuario, Base
from auth import get_password_hash
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def create_admin_user():
    """Crear usuario administrador inicial"""
    
    # Crear las tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    # Crear sesión de base de datos
    db = SessionLocal()
    
    try:
        # Verificar si ya existe un usuario admin
        existing_admin = db.query(Usuario).filter(Usuario.rol == "admin").first()
        
        if existing_admin:
            print(f"✅ Ya existe un usuario administrador: {existing_admin.email}")
            print(f"   Nombre: {existing_admin.nombre}")
            print(f"   Activo: {existing_admin.activo}")
            return
        
        # Crear usuario administrador
        admin_email = "admin@sistema-notas.com"
        admin_password = "admin123"  # Cambiar en producción
        admin_name = "Administrador del Sistema"
        
        # Hashear contraseña
        password_hash = get_password_hash(admin_password)
        
        # Crear usuario
        admin_user = Usuario(
            nombre=admin_name,
            email=admin_email,
            password_hash=password_hash,
            rol="admin",
            activo=True
        )
        
        # Agregar a la base de datos
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("🎉 Usuario administrador creado exitosamente!")
        print(f"   Email: {admin_email}")
        print(f"   Contraseña: {admin_password}")
        print(f"   Nombre: {admin_name}")
        print(f"   ID: {admin_user.id}")
        print("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login")
        
    except Exception as e:
        print(f"❌ Error al crear usuario administrador: {e}")
        db.rollback()
    finally:
        db.close()

def list_users():
    """Listar todos los usuarios existentes"""
    db = SessionLocal()
    
    try:
        users = db.query(Usuario).all()
        
        if not users:
            print("📭 No hay usuarios en la base de datos")
            return
        
        print("👥 Usuarios existentes:")
        print("-" * 60)
        for user in users:
            status = "✅ Activo" if user.activo else "❌ Inactivo"
            print(f"ID: {user.id} | Email: {user.email} | Rol: {user.rol} | {status}")
            print(f"   Nombre: {user.nombre}")
            print(f"   Creado: {user.fecha_creacion}")
            print("-" * 60)
            
    except Exception as e:
        print(f"❌ Error al listar usuarios: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    print("🔧 Script de gestión de usuarios administradores")
    print("=" * 50)
    
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        list_users()
    else:
        create_admin_user()
        print("\n" + "=" * 50)
        print("💡 Para listar usuarios existentes, ejecuta:")
        print("   python create_admin.py list")
