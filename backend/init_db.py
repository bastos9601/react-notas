#!/usr/bin/env python3
"""
Script para inicializar la base de datos con datos de ejemplo
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, Usuario, Alumno, Docente, Asignatura, Nota, matriculas
from auth import get_password_hash

def create_sample_data():
    """Crear datos de ejemplo para el sistema"""
    
    # Crear las tablas
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Verificar si ya existen datos
        if db.query(Usuario).first():
            print("La base de datos ya contiene datos. Saltando inicialización.")
            return
        
        print("Creando datos de ejemplo...")
        
        # 1. Crear usuarios
        admin_user = Usuario(
            nombre="Administrador",
            email="admin@sistema.com",
            password_hash=get_password_hash("admin123"),
            rol="admin"
        )
        
        docente1_user = Usuario(
            nombre="Juan",
            email="juan.docente@sistema.com",
            password_hash=get_password_hash("docente123"),
            rol="docente"
        )
        
        docente2_user = Usuario(
            nombre="María",
            email="maria.docente@sistema.com",
            password_hash=get_password_hash("docente123"),
            rol="docente"
        )
        
        alumno1_user = Usuario(
            nombre="Carlos",
            email="carlos.alumno@sistema.com",
            password_hash=get_password_hash("alumno123"),
            rol="alumno"
        )
        
        alumno2_user = Usuario(
            nombre="Ana",
            email="ana.alumno@sistema.com",
            password_hash=get_password_hash("alumno123"),
            rol="alumno"
        )
        
        alumno3_user = Usuario(
            nombre="Luis",
            email="luis.alumno@sistema.com",
            password_hash=get_password_hash("alumno123"),
            rol="alumno"
        )
        
        db.add_all([admin_user, docente1_user, docente2_user, alumno1_user, alumno2_user, alumno3_user])
        db.commit()
        
        # 2. Crear docentes
        docente1 = Docente(
            nombre_completo="Juan Pérez García",
            dni="12345678",
            usuario_id=docente1_user.id
        )
        
        docente2 = Docente(
            nombre_completo="María López Rodríguez",
            dni="87654321",
            usuario_id=docente2_user.id
        )
        
        db.add_all([docente1, docente2])
        db.commit()
        
        # 3. Crear alumnos
        alumno1 = Alumno(
            nombre_completo="Carlos Mendoza Silva",
            dni="11111111",
            ciclo="2024-I",
            usuario_id=alumno1_user.id
        )
        
        alumno2 = Alumno(
            nombre_completo="Ana Torres Vega",
            dni="22222222",
            ciclo="2024-I",
            usuario_id=alumno2_user.id
        )
        
        alumno3 = Alumno(
            nombre_completo="Luis Ramírez Castro",
            dni="33333333",
            ciclo="2024-I",
            usuario_id=alumno3_user.id
        )
        
        db.add_all([alumno1, alumno2, alumno3])
        db.commit()
        
        # 4. Crear asignaturas
        asignatura1 = Asignatura(
            nombre="Matemáticas I",
            docente_id=docente1.id
        )
        
        asignatura2 = Asignatura(
            nombre="Física I",
            docente_id=docente1.id
        )
        
        asignatura3 = Asignatura(
            nombre="Programación I",
            docente_id=docente2.id
        )
        
        asignatura4 = Asignatura(
            nombre="Base de Datos",
            docente_id=docente2.id
        )
        
        db.add_all([asignatura1, asignatura2, asignatura3, asignatura4])
        db.commit()
        
        # 5. Crear matrículas
        matriculas_data = [
            {"alumno_id": alumno1.id, "asignatura_id": asignatura1.id},
            {"alumno_id": alumno1.id, "asignatura_id": asignatura2.id},
            {"alumno_id": alumno1.id, "asignatura_id": asignatura3.id},
            {"alumno_id": alumno2.id, "asignatura_id": asignatura1.id},
            {"alumno_id": alumno2.id, "asignatura_id": asignatura3.id},
            {"alumno_id": alumno2.id, "asignatura_id": asignatura4.id},
            {"alumno_id": alumno3.id, "asignatura_id": asignatura2.id},
            {"alumno_id": alumno3.id, "asignatura_id": asignatura4.id},
        ]
        
        for matricula in matriculas_data:
            db.execute(matriculas.insert().values(**matricula))
        
        db.commit()
        
        # 6. Crear algunas notas de ejemplo
        nota1 = Nota(
            alumno_id=alumno1.id,
            asignatura_id=asignatura1.id,
            calificacion=16.5,
            tipo_nota="examen_final"
        )
        
        nota2 = Nota(
            alumno_id=alumno1.id,
            asignatura_id=asignatura2.id,
            calificacion=14.0,
            tipo_nota="practica"
        )
        
        nota3 = Nota(
            alumno_id=alumno2.id,
            asignatura_id=asignatura1.id,
            calificacion=18.0,
            tipo_nota="proyecto"
        )
        
        nota4 = Nota(
            alumno_id=alumno2.id,
            asignatura_id=asignatura3.id,
            calificacion=12.5,
            tipo_nota="examen_parcial"
        )
        
        nota5 = Nota(
            alumno_id=alumno3.id,
            asignatura_id=asignatura2.id,
            calificacion=15.0,
            tipo_nota="participacion"
        )
        
        db.add_all([nota1, nota2, nota3, nota4, nota5])
        db.commit()
        
        print("Datos de ejemplo creados exitosamente!")
        print("\nUsuarios de prueba:")
        print("Admin: admin@sistema.com / admin123")
        print("Docente 1: juan.docente@sistema.com / docente123")
        print("Docente 2: maria.docente@sistema.com / docente123")
        print("Alumno 1: carlos.alumno@sistema.com / alumno123")
        print("Alumno 2: ana.alumno@sistema.com / alumno123")
        print("Alumno 3: luis.alumno@sistema.com / alumno123")
        
    except Exception as e:
        print(f"Error al crear datos de ejemplo: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_data()
