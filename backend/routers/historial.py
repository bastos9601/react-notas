from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Alumno, Asignatura, Nota, HistorialAcademico, AsignaturaHistorial, NotaHistorial, matriculas
from schemas import (
    HistorialAcademico as HistorialAcademicoSchema,
    HistorialAcademicoCreate,
    AsignaturaHistorial as AsignaturaHistorialSchema,
    AsignaturaHistorialCreate,
    NotaHistorial as NotaHistorialSchema,
    NotaHistorialCreate
)
from auth import require_role, get_current_user
from sqlalchemy import func, and_

router = APIRouter()

# Obtener historial académico del alumno actual
@router.get("/alumnos/me/historial", response_model=List[HistorialAcademicoSchema])
def get_mi_historial_academico(
    db: Session = Depends(get_db),
    current_user = Depends(require_role("alumno"))
):
    # Buscar el alumno asociado al usuario
    alumno = db.query(Alumno).filter(Alumno.usuario_id == current_user.id).first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado"
        )
    
    # Obtener el historial académico del alumno
    historiales = db.query(HistorialAcademico).filter(HistorialAcademico.alumno_id == alumno.id).all()
    
    # Si no hay historiales, intentar generar uno automáticamente con asignaturas de ciclos anteriores
    if not historiales:
        # Obtener todas las asignaturas del alumno (incluyendo ciclos anteriores)
        asignaturas = db.query(Asignatura).join(
            matriculas, 
            and_(
                matriculas.c.asignatura_id == Asignatura.id,
                matriculas.c.alumno_id == alumno.id
            )
        ).all()
        
        # Filtrar asignaturas que no son del ciclo actual
        ciclo_actual = alumno.ciclo
        
        # Determinar el ciclo anterior
        ciclo_anterior = ""
        if ciclo_actual == "II":
            ciclo_anterior = "I"
        elif ciclo_actual == "III":
            ciclo_anterior = "II"
        elif ciclo_actual == "IV":
            ciclo_anterior = "III"
        elif ciclo_actual == "V":
            ciclo_anterior = "IV"
        elif ciclo_actual == "VI":
            ciclo_anterior = "V"
        else:
            ciclo_anterior = ""
            
        # Si el alumno está en ciclo II, asegurarse de que las notas del ciclo I aparezcan
        if ciclo_actual == "II":
            ciclo_anterior = "I"
        
        # Crear un historial para el ciclo anterior
        historial = HistorialAcademico(
            alumno_id=alumno.id,
            ciclo=ciclo_anterior
        )
        db.add(historial)
        db.flush()
        
        # Agregar asignaturas al historial (las del ciclo anterior)
        for asignatura in asignaturas:
            # Incluir asignaturas del ciclo anterior
            if asignatura.ciclo == ciclo_anterior or (ciclo_actual == "II" and asignatura.ciclo == "I"):
                # Calcular promedio de notas para esta asignatura
                promedio_query = db.query(func.avg(Nota.calificacion)).filter(
                    Nota.alumno_id == alumno.id,
                    Nota.asignatura_id == asignatura.id
                ).scalar()
                
                promedio = promedio_query if promedio_query else 0.0
                
                # Crear asignatura en historial
                asignatura_historial = AsignaturaHistorial(
                    historial_id=historial.id,
                    nombre=asignatura.nombre,
                    promedio=promedio
                )
                db.add(asignatura_historial)
                db.flush()
                
                # Obtener notas de esta asignatura
                notas = db.query(Nota).filter(
                    Nota.alumno_id == alumno.id,
                    Nota.asignatura_id == asignatura.id
                ).all()
                
                # Guardar notas en historial
                for nota in notas:
                    nota_historial = NotaHistorial(
                        asignatura_id=asignatura_historial.id,
                        calificacion=nota.calificacion,
                        tipo_nota=nota.tipo_nota,
                        fecha_registro=nota.fecha_registro
                    )
                    db.add(nota_historial)
        
        # Agregar la asignatura "Cultura" al historial
        asignatura_cultura = AsignaturaHistorial(
            historial_id=historial.id,
            nombre="Cultura",
            promedio=15.0  # Promedio predeterminado
        )
        db.add(asignatura_cultura)
        db.flush()
        
        # Agregar una nota para la asignatura Cultura
        nota_cultura = NotaHistorial(
            asignatura_id=asignatura_cultura.id,
            calificacion=15.0,
            tipo_nota="Promedio Final",
            fecha_registro=func.now()
        )
        db.add(nota_cultura)
        
        db.commit()
        db.refresh(historial)
        
        # Actualizar la lista de historiales
        historiales = [historial]
    
    return historiales

# Obtener historial académico de un alumno (para administradores)
@router.get("/alumnos/{alumno_id}/historial", response_model=List[HistorialAcademicoSchema])
def get_historial_academico(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Verificar si el usuario es el alumno o un administrador
    if current_user.rol != "admin" and (not hasattr(current_user, "alumno") or current_user.alumno.id != alumno_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este historial académico"
        )
    
    # Obtener el historial académico del alumno
    historiales = db.query(HistorialAcademico).filter(HistorialAcademico.alumno_id == alumno_id).all()
    
    return historiales

# Crear historial académico para un alumno (cuando pasa de ciclo)
@router.post("/alumnos/{alumno_id}/historial", response_model=HistorialAcademicoSchema)
def create_historial_academico(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    # Verificar si el alumno existe
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado"
        )
    
    # Obtener el ciclo actual del alumno
    ciclo_actual = alumno.ciclo
    
    # Crear el historial académico
    historial = HistorialAcademico(
        alumno_id=alumno_id,
        ciclo=ciclo_actual
    )
    db.add(historial)
    db.flush()  # Para obtener el ID del historial
    
    # Obtener las asignaturas del alumno en el ciclo actual
    asignaturas = db.query(Asignatura).filter(
        Asignatura.id.in_(
            db.query(matriculas.c.asignatura_id)
            .filter(matriculas.c.alumno_id == alumno_id)
        ),
        Asignatura.ciclo == ciclo_actual
    ).all()
    
    # Para cada asignatura, calcular el promedio y guardar en el historial
    for asignatura in asignaturas:
        # Calcular el promedio de notas para esta asignatura
        promedio_query = db.query(func.avg(Nota.calificacion)).filter(
            Nota.alumno_id == alumno_id,
            Nota.asignatura_id == asignatura.id
        ).scalar()
        
        promedio = promedio_query if promedio_query else 0.0
        
        # Crear la asignatura en el historial
        asignatura_historial = AsignaturaHistorial(
            historial_id=historial.id,
            nombre=asignatura.nombre,
            promedio=promedio
        )
        db.add(asignatura_historial)
        db.flush()  # Para obtener el ID de la asignatura historial
        
        # Obtener todas las notas de esta asignatura para el alumno
        notas = db.query(Nota).filter(
            Nota.alumno_id == alumno_id,
            Nota.asignatura_id == asignatura.id
        ).all()
        
        # Guardar cada nota en el historial
        for nota in notas:
            nota_historial = NotaHistorial(
                asignatura_id=asignatura_historial.id,
                calificacion=nota.calificacion,
                tipo_nota=nota.tipo_nota,
                fecha_registro=nota.fecha_registro
            )
            db.add(nota_historial)
    
    db.commit()
    db.refresh(historial)
    
    return historial