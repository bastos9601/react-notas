from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from database import get_db
from models import Usuario, Docente, Asignatura, Alumno, Nota, matriculas, Promedio
from schemas import (
    Asignatura as AsignaturaSchema,
    Alumno as AlumnoSchema,
    NotaCreate, NotaUpdate, Nota as NotaSchema
)
from pydantic import BaseModel, EmailStr
from typing import Optional, Any
from auth import require_role, verify_password, get_password_hash
from datetime import datetime
import os
import csv
from models import ReporteDocente
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet

router = APIRouter()

# Utilidad para normalizar y mapear tipos de evaluación provenientes del frontend
def _normalize_tipo_evaluacion(tipo: str) -> str:
    """Normaliza el tipo de evaluación recibido (ids o nombres) a claves internas.
    Retorna uno de: actividades, practicas, parciales, examen_final, promedio_final
    """
    if not tipo:
        return ""
    t = tipo.strip().lower()
    mapping = {
        # Actividades
        "actividad": "actividades",
        "actividades": "actividades",
        # Práctica(s)
        "practica": "practicas",
        "práctica": "practicas",
        "practicas": "practicas",
        "prácticas": "practicas",
        # Parcial(es)
        "parcial": "parciales",
        "parciales": "parciales",
        # Examen Final
        "examen final": "examen_final",
        "final": "examen_final",
        "examen_final": "examen_final",
        # Promedio Final
        "promedio": "promedio_final",
        "promedio final": "promedio_final",
        "promedio_final": "promedio_final",
    }
    return mapping.get(t, t)

class PromedioCreate(BaseModel):
    alumno_id: int
    asignatura_id: int
    actividades: Optional[float] = None
    practicas: Optional[float] = None
    parciales: Optional[float] = None
    examen_final: Optional[float] = None
    promedio_final: Optional[float] = None
    
class TipoEvaluacion(BaseModel):
    id: str
    nombre: str
    
@router.get("/tipos-evaluacion", response_model=List[TipoEvaluacion])
async def obtener_tipos_evaluacion(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener los tipos de evaluación disponibles en la tabla de promedios"""
    try:
        # Definimos los tipos de evaluación basados en las columnas de la tabla promedios
        tipos_evaluacion = [
            {"id": "actividades", "nombre": "Actividades"},
            {"id": "practicas", "nombre": "Práctica"},
            {"id": "parciales", "nombre": "Parcial"},
            {"id": "examen_final", "nombre": "Examen Final"},
            {"id": "promedio_final", "nombre": "Promedio Final"}
        ]
        return tipos_evaluacion
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener tipos de evaluación: {str(e)}"
        )

@router.post("/guardar-promedios")
async def guardar_promedios(
    promedios: List[PromedioCreate],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Guardar los promedios de los alumnos para una asignatura"""
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    resultados = []
    for promedio_data in promedios:
        # Verificar que la asignatura pertenece al docente
        asignatura = db.query(Asignatura).filter(
            Asignatura.id == promedio_data.asignatura_id,
            Asignatura.docente_id == docente.id
        ).first()
        
        if not asignatura:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene permiso para esta asignatura: {promedio_data.asignatura_id}"
            )
        
        # Verificar si ya existe un promedio para este alumno y asignatura
        promedio_existente = db.query(Promedio).filter(
            Promedio.alumno_id == promedio_data.alumno_id,
            Promedio.asignatura_id == promedio_data.asignatura_id
        ).first()
        
        if promedio_existente:
            # Actualizar el promedio existente
            promedio_existente.actividades = promedio_data.actividades
            promedio_existente.practicas = promedio_data.practicas
            promedio_existente.parciales = promedio_data.parciales
            promedio_existente.examen_final = promedio_data.examen_final
            promedio_existente.promedio_final = promedio_data.promedio_final
            db.commit()
            db.refresh(promedio_existente)
            resultados.append({"id": promedio_existente.id, "actualizado": True})
        else:
            # Crear un nuevo promedio
            nuevo_promedio = Promedio(
                alumno_id=promedio_data.alumno_id,
                asignatura_id=promedio_data.asignatura_id,
                actividades=promedio_data.actividades,
                practicas=promedio_data.practicas,
                parciales=promedio_data.parciales,
                examen_final=promedio_data.examen_final,
                promedio_final=promedio_data.promedio_final
            )
            db.add(nuevo_promedio)
            db.commit()
            db.refresh(nuevo_promedio)
            resultados.append({"id": nuevo_promedio.id, "actualizado": False})
    
    return {"message": "Promedios guardados correctamente", "resultados": resultados}

@router.delete("/eliminar-promedios/{alumno_id}/{asignatura_id}")
async def eliminar_promedios(
    alumno_id: int,
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Eliminar los promedios de un alumno para una asignatura cuando no hay notas para calcular"""
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permiso para esta asignatura"
        )
    
    # Buscar el promedio a eliminar
    promedio = db.query(Promedio).filter(
        Promedio.alumno_id == alumno_id,
        Promedio.asignatura_id == asignatura_id
    ).first()
    
    if not promedio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Promedio no encontrado"
        )
    
    # Eliminar el promedio
    db.delete(promedio)
    db.commit()
    
    return {"message": "Promedio eliminado correctamente"}

@router.get("/mis-asignaturas", response_model=List[AsignaturaSchema])
async def mis_asignaturas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener asignaturas del docente actual"""
    # Buscar el docente asociado al usuario
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    asignaturas = db.query(Asignatura).filter(Asignatura.docente_id == docente.id).all()
    return asignaturas

@router.get("/asignaturas/{asignatura_id}/alumnos", response_model=List[AlumnoSchema])
async def alumnos_por_asignatura(
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener alumnos matriculados en una asignatura específica"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
@router.get("/asignatura/{asignatura_id}/alumnos", response_model=List[AlumnoSchema])
async def alumnos_por_asignatura_nuevo(
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener alumnos matriculados en una asignatura específica (nuevo endpoint)"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    # Obtener alumnos matriculados usando consulta directa
    from sqlalchemy import text
    matriculas_data = db.execute(
        text("SELECT alumno_id FROM matriculas WHERE asignatura_id = :asignatura_id"),
        {"asignatura_id": asignatura_id}
    ).fetchall()
    
    alumnos = []
    for matricula in matriculas_data:
        alumno_id = matricula[0]  # El resultado es una tupla
        alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
        if alumno:
            alumnos.append(alumno)
    
    return alumnos

@router.get("/asignatura/{asignatura_id}/notas", response_model=List[NotaSchema])
async def get_notas_por_asignatura_nuevo(
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener todas las notas de una asignatura específica (nuevo endpoint)"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    # Obtener alumnos matriculados
    from sqlalchemy import text
    matriculas_data = db.execute(
        text("SELECT alumno_id FROM matriculas WHERE asignatura_id = :asignatura_id"),
        {"asignatura_id": asignatura_id}
    ).fetchall()
    
    alumno_ids = [matricula[0] for matricula in matriculas_data]
    
    # Obtener todas las notas de estos alumnos para esta asignatura
    notas = db.query(Nota).filter(
        Nota.alumno_id.in_(alumno_ids),
        Nota.asignatura_id == asignatura_id
    ).all()
    
    return notas

@router.get("/asignaturas/{asignatura_id}/notas", response_model=List[NotaSchema])
async def get_notas_por_asignatura(
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener todas las notas de una asignatura específica"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    # Obtener todas las notas de la asignatura
    notas = db.query(Nota).filter(Nota.asignatura_id == asignatura_id).all()
    return notas

@router.post("/notas", response_model=NotaSchema)
async def registrar_nota(
    nota_data: NotaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Registrar nueva nota"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == nota_data.asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    # Verificar que el alumno está matriculado en la asignatura
    matricula = db.execute(
        matriculas.select().where(
            matriculas.c.alumno_id == nota_data.alumno_id,
            matriculas.c.asignatura_id == nota_data.asignatura_id
        )
    ).first()
    
    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El alumno no está matriculado en esta asignatura"
        )
    
    # Validar calificación
    if not (0 <= nota_data.calificacion <= 20):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La calificación debe estar entre 0 y 20"
        )
    
    # Crear nota
    db_nota = Nota(
        alumno_id=nota_data.alumno_id,
        asignatura_id=nota_data.asignatura_id,
        calificacion=nota_data.calificacion,
        tipo_nota=nota_data.tipo_nota
    )
    
    db.add(db_nota)
    db.commit()
    db.refresh(db_nota)
    
    return db_nota

@router.put("/notas/{nota_id}", response_model=NotaSchema)
async def actualizar_nota(
    nota_id: int,
    nota_data: NotaUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Actualizar nota existente"""
    # Verificar que el docente tiene acceso a esta nota
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    nota = db.query(Nota).filter(Nota.id == nota_id).first()
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == nota.asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para modificar esta nota"
        )
    
    # Validar calificación
    if not (0 <= nota_data.calificacion <= 20):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La calificación debe estar entre 0 y 20"
        )
    
    # Actualizar nota
    nota.calificacion = nota_data.calificacion
    nota.tipo_nota = nota_data.tipo_nota
    db.commit()
    db.refresh(nota)
    
    return nota

@router.get("/asignaturas/{asignatura_id}/notas", response_model=List[NotaSchema])
async def notas_por_asignatura(
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener todas las notas de una asignatura"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    notas = db.query(Nota).filter(Nota.asignatura_id == asignatura_id).all()
    return notas

@router.delete("/notas/{nota_id}")
async def eliminar_nota(
    nota_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Eliminar nota"""
    # Verificar que el docente tiene acceso a esta nota
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    nota = db.query(Nota).filter(Nota.id == nota_id).first()
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == nota.asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar esta nota"
        )
    
    db.delete(nota)
    db.commit()
    
    return {"message": "Nota eliminada correctamente"}

@router.get("/alumnos-por-ciclo")
async def obtener_alumnos_por_ciclo(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener alumnos organizados por ciclo para el docente actual"""
    # Buscar el docente asociado al usuario
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Obtener asignaturas del docente
    asignaturas = db.query(Asignatura).filter(Asignatura.docente_id == docente.id).all()
    asignatura_ids = [asignatura.id for asignatura in asignaturas]
    
    if not asignatura_ids:
        return {"ciclos": []}
    
    # Obtener alumnos matriculados en las asignaturas del docente
    alumnos_matriculados = db.execute(
        matriculas.select().where(matriculas.c.asignatura_id.in_(asignatura_ids))
    ).fetchall()
    
    # Obtener IDs de alumnos únicos
    alumno_ids = list(set([row.alumno_id for row in alumnos_matriculados]))
    
    if not alumno_ids:
        return {"ciclos": []}
    
    # Obtener información completa de los alumnos
    alumnos = db.query(Alumno).filter(Alumno.id.in_(alumno_ids)).all()
    
    # Organizar por ciclo
    ciclos = {}
    for alumno in alumnos:
        ciclo = alumno.ciclo
        if ciclo not in ciclos:
            ciclos[ciclo] = []
        
        # Obtener asignaturas del alumno en las que enseña este docente
        asignaturas_alumno = []
        for matricula in alumnos_matriculados:
            if matricula.alumno_id == alumno.id:
                asignatura = next((a for a in asignaturas if a.id == matricula.asignatura_id), None)
                if asignatura:
                    asignaturas_alumno.append({
                        "id": asignatura.id,
                        "nombre": asignatura.nombre
                    })
        
        ciclos[ciclo].append({
            "id": alumno.id,
            "nombre_completo": alumno.nombre_completo,
            "dni": alumno.dni,
            "ciclo": alumno.ciclo,
            "email": alumno.usuario.email,
            "asignaturas": asignaturas_alumno
        })
    
    # Convertir a lista ordenada
    ciclos_lista = []
    for ciclo, alumnos_ciclo in sorted(ciclos.items()):
        ciclos_lista.append({
            "ciclo": ciclo,
            "alumnos": sorted(alumnos_ciclo, key=lambda x: x["nombre_completo"]),
            "total_alumnos": len(alumnos_ciclo)
        })
    
    return {"ciclos": ciclos_lista}

@router.put("/notas/{nota_id}/publicar")
async def publicar_nota(
    nota_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Publicar una nota para que el alumno pueda verla"""
    # Buscar la nota
    nota = db.query(Nota).filter(Nota.id == nota_id).first()
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada"
        )
    
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(Asignatura.id == nota.asignatura_id).first()
    if not asignatura or asignatura.docente_id != docente.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para publicar esta nota"
        )
    
    # Verificar si la nota ya está publicada
    if nota.publicada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta nota ya está publicada"
        )
    
    # Publicar la nota
    nota.publicada = True
    db.commit()
    db.refresh(nota)
    
    # Obtener información del alumno
    alumno = db.query(Alumno).filter(Alumno.id == nota.alumno_id).first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado"
        )
    
    return {
        "message": "Nota publicada exitosamente",
        "nota": {
            "id": nota.id,
            "calificacion": nota.calificacion,
            "tipo_nota": nota.tipo_nota,
            "publicada": nota.publicada,
            "alumno": {
                "nombre": alumno.nombre_completo,
                "email": alumno.usuario.email
            },
            "asignatura": asignatura.nombre
        }
    }

@router.put("/notas/{nota_id}/despublicar")
async def despublicar_nota(
    nota_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Despublicar una nota para que el alumno no pueda verla"""
    # Buscar la nota
    nota = db.query(Nota).filter(Nota.id == nota_id).first()
    if not nota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nota no encontrada"
        )
    
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(Asignatura.id == nota.asignatura_id).first()
    if not asignatura or asignatura.docente_id != docente.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para despublicar esta nota"
        )
    
    # Verificar si la nota ya está despublicada
    if not nota.publicada:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta nota ya está despublicada"
        )
    
    # Despublicar la nota
    nota.publicada = False
    db.commit()
    db.refresh(nota)
    
    # Obtener información del alumno
    alumno = db.query(Alumno).filter(Alumno.id == nota.alumno_id).first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado"
        )
    
    return {
        "message": "Nota despublicada exitosamente",
        "nota": {
            "id": nota.id,
            "calificacion": nota.calificacion,
            "tipo_nota": nota.tipo_nota,
            "publicada": nota.publicada,
            "alumno": {
                "nombre": alumno.nombre_completo,
                "email": alumno.usuario.email
            },
            "asignatura": asignatura.nombre
        }
    }

@router.put("/asignaturas/{asignatura_id}/publicar-todas-notas")
async def publicar_todas_notas(
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Publicar todas las notas de una asignatura específica"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    # Obtener todas las notas no publicadas de la asignatura
    notas_no_publicadas = db.query(Nota).filter(
        Nota.asignatura_id == asignatura_id,
        Nota.publicada == False
    ).all()
    
    if not notas_no_publicadas:
        return {
            "message": "No hay notas pendientes por publicar en esta asignatura",
            "notas_publicadas": 0
        }
    
    # Publicar todas las notas
    for nota in notas_no_publicadas:
        nota.publicada = True
    
    db.commit()
    
    return {
        "message": "Todas las notas han sido publicadas exitosamente",
        "notas_publicadas": len(notas_no_publicadas),
        "asignatura": asignatura.nombre
    }

@router.post("/asignaturas/{asignatura_id}/alumnos/{alumno_id}/enviar-notas")
async def enviar_todas_las_notas(
    asignatura_id: int,
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Enviar todas las notas de un alumno en una asignatura específica por email"""
    
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    # Verificar que el alumno está matriculado en la asignatura
    matricula = db.execute(
        matriculas.select().where(
            matriculas.c.alumno_id == alumno_id,
            matriculas.c.asignatura_id == asignatura_id
        )
    ).first()
    
    if not matricula:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El alumno no está matriculado en esta asignatura"
        )
    
    # Obtener información del alumno
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado"
        )
    
    # Verificar que el alumno tenga notas publicadas en esta asignatura
    notas = db.query(Nota).filter(
        Nota.alumno_id == alumno_id,
        Nota.asignatura_id == asignatura_id,
        Nota.publicada == True
    ).all()
    
    if not notas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El alumno no tiene notas publicadas en esta asignatura"
        )
    
    # Intentar enviar notificación por email
    try:
        from email_config import send_grades_published_notification
        email_result = await send_grades_published_notification(
            email=alumno.usuario.email,
            nombre_alumno=alumno.nombre_completo,
            asignatura_nombre=asignatura.nombre
        )
        
        if email_result["success"]:
            return {
                "message": "Notificación enviada exitosamente por email",
                "alumno": {
                    "id": alumno.id,
                    "nombre": alumno.nombre_completo,
                    "email": alumno.usuario.email
                },
                "asignatura": {
                    "id": asignatura.id,
                    "nombre": asignatura.nombre
                },
                "notas_publicadas": len(notas),
                "email_sent": True,
                "email_message": email_result["message"]
            }
        else:
            return {
                "message": "Error al enviar la notificación por email",
                "alumno": {
                    "id": alumno.id,
                    "nombre": alumno.nombre_completo,
                    "email": alumno.usuario.email
                },
                "asignatura": {
                    "id": asignatura.id,
                    "nombre": asignatura.nombre
                },
                "notas_publicadas": len(notas),
                "email_sent": False,
                "email_error": email_result["message"],
                "instructions": "Verifica la configuración de email en el sistema."
            }
    except Exception as e:
        return {
            "message": "Error al enviar la notificación por email",
            "alumno": {
                "id": alumno.id,
                "nombre": alumno.nombre_completo,
                "email": alumno.usuario.email
            },
            "asignatura": {
                "id": asignatura.id,
                "nombre": asignatura.nombre
            },
            "notas_publicadas": len(notas),
            "email_sent": False,
            "email_error": f"Error en el servicio de email: {str(e)}",
            "instructions": "Verifica la configuración de email en el sistema."
        }

@router.get("/reportes/{asignatura_id}/{tipo_evaluacion}")
async def obtener_reporte(
    asignatura_id: int,
    tipo_evaluacion: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener reporte de notas por asignatura y tipo de evaluación"""
    # Verificar que el docente tiene acceso a esta asignatura
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Verificar que la asignatura pertenece al docente
    asignatura = db.query(Asignatura).filter(
        Asignatura.id == asignatura_id,
        Asignatura.docente_id == docente.id
    ).first()
    
    if not asignatura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada o no tienes acceso a ella"
        )
    
    # Obtener alumnos matriculados en la asignatura
    from sqlalchemy import text
    matriculas_data = db.execute(
        text("SELECT alumno_id FROM matriculas WHERE asignatura_id = :asignatura_id"),
        {"asignatura_id": asignatura_id}
    ).fetchall()
    
    alumno_ids = [matricula[0] for matricula in matriculas_data]

    # Normalizar tipo de evaluación recibido y preparar mapeos
    tipo_norm = _normalize_tipo_evaluacion(tipo_evaluacion)
    promedio_cols = {
        "actividades": "actividades",
        "practicas": "practicas",
        "parciales": "parciales",
        "examen_final": "examen_final",
        "promedio_final": "promedio_final",
    }
    # Tipos de notas en la tabla "notas" que respaldan cada categoría
    nota_tipos_map = {
        "actividades": [
            "participacion", "tarea", "quiz", "laboratorio",
            "proyecto", "trabajo_grupal", "exposicion"
        ],
        "practicas": ["practica"],
        "parciales": ["examen_parcial", "parcial"],
        "examen_final": ["examen_final"],
        "promedio_final": [],
    }

    # Obtener notas del tipo especificado para estos alumnos
    reporte_data = []
    for alumno_id in alumno_ids:
        alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
        if not alumno:
            continue
        # Calcular calificación según promedio o, en su defecto, por notas registradas
        calificacion = 0  # Valor predeterminado
        promedio = db.query(Promedio).filter(
            Promedio.alumno_id == alumno_id,
            Promedio.asignatura_id == asignatura_id
        ).first()

        # 1) Intentar obtener desde la tabla de promedios
        col = promedio_cols.get(tipo_norm)
        if promedio and col and getattr(promedio, col) is not None:
            calificacion = getattr(promedio, col)
        else:
            # 2) Si no hay promedio, intentar respaldarse en notas registradas
            tipos_nota = nota_tipos_map.get(tipo_norm, [])
            if tipos_nota:
                if tipo_norm == "actividades":
                    # Promedio de todas las actividades registradas
                    notas_act = db.query(Nota).filter(
                        Nota.alumno_id == alumno_id,
                        Nota.asignatura_id == asignatura_id,
                        Nota.tipo_nota.in_(tipos_nota)
                    ).all()
                    if notas_act:
                        valores = [n.calificacion for n in notas_act if n.calificacion is not None]
                        if valores:
                            calificacion = sum(valores) / len(valores)
                else:
                    # Tomar la última nota registrada del tipo correspondiente
                    nota = db.query(Nota).filter(
                        Nota.alumno_id == alumno_id,
                        Nota.asignatura_id == asignatura_id,
                        Nota.tipo_nota.in_(tipos_nota)
                    ).order_by(Nota.fecha_registro.desc()).first()
                    if nota and nota.calificacion is not None:
                        calificacion = nota.calificacion

        # Agregar al reporte
        reporte_data.append({
            "alumno": alumno.nombre_completo,
            "asignatura": asignatura.nombre,
            "ciclo": alumno.ciclo,
            "tipo_evaluacion": tipo_evaluacion,
            "calificacion": calificacion
        })
    
    return {
        "reporte": reporte_data,
        "total_alumnos": len(reporte_data),
        "asignatura": asignatura.nombre,
        "tipo_evaluacion": tipo_evaluacion
    }

@router.post("/reportes/enviar-admin")
async def enviar_reporte_admin(
    reporte_data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Enviar reporte de notas al administrador"""
    # Verificar que el docente existe
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Preparar carpeta de reportes
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    reports_dir = os.path.join(backend_dir, "reports")
    try:
        os.makedirs(reports_dir, exist_ok=True)
    except Exception:
        # Si falla usar directorio actual
        reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
        os.makedirs(reports_dir, exist_ok=True)

    # Construir nombre de archivo
    asignatura = str(reporte_data.get("asignatura", "asignatura")).replace(" ", "_")
    tipo_eval = str(reporte_data.get("tipo_evaluacion", "evaluacion")).replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"reporte_{docente.id}_{asignatura}_{tipo_eval}_{timestamp}.csv"
    file_path = os.path.join(reports_dir, filename)

    # Guardar CSV con los datos del reporte
    columnas = ["alumno", "ciclo", "asignatura", "tipo_evaluacion", "calificacion"]
    try:
        with open(file_path, mode="w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=columnas)
            writer.writeheader()
            for fila in reporte_data.get("reporte", []):
                writer.writerow({
                    "alumno": fila.get("alumno", ""),
                    "ciclo": fila.get("ciclo", ""),
                    "asignatura": fila.get("asignatura", asignatura),
                    "tipo_evaluacion": fila.get("tipo_evaluacion", tipo_eval),
                    "calificacion": fila.get("calificacion", "")
                })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo generar el archivo de reporte: {e}")

    # Persistir registro en DB
    reporte_record = ReporteDocente(
        docente_id=docente.id,
        nombre_docente=docente.nombre_completo,
        asignatura=reporte_data.get("asignatura", ""),
        tipo_evaluacion=reporte_data.get("tipo_evaluacion", ""),
        archivo_path=file_path
    )
    db.add(reporte_record)
    db.commit()
    db.refresh(reporte_record)

    return {
        "message": "Reporte enviado al administrador exitosamente",
        "docente": docente.nombre_completo,
        "reporte_id": reporte_record.id,
        "archivo": filename,
        "fecha_envio": str(datetime.now())
    }

@router.post("/reportes/enviar-email")
async def enviar_reporte_email(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Generar el PDF del reporte y enviarlo por correo a la dirección indicada.

    Espera un payload con:
    - email/correo: str (se acepta cualquiera de las dos claves)
    - asignatura: str
    - tipo_evaluacion: str
    - reporte: lista de filas con keys: alumno, ciclo, asignatura, tipo_evaluacion, calificacion
    """
    # Verificar que el docente existe
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )

    # Aceptar distintas claves desde el frontend: "email" o "correo"
    email = payload.get("email") or payload.get("correo") or payload.get("destinatario")
    # Normalizar y validar de forma tolerante
    if not email:
        raise HTTPException(status_code=400, detail="Email requerido")
    email = str(email).strip()
    # Evitar validación estricta que puede fallar por espacios u otros caracteres
    # Usar una validación sencilla para permitir correos válidos típicos
    import re
    if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise HTTPException(status_code=400, detail="Email inválido")

    # Preparar carpeta de reportes
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    reports_dir = os.path.join(backend_dir, "reports")
    try:
        os.makedirs(reports_dir, exist_ok=True)
    except Exception:
        reports_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
        os.makedirs(reports_dir, exist_ok=True)

    # Construir nombre de archivo (PDF)
    asignatura = str(payload.get("asignatura", "asignatura")).replace(" ", "_")
    tipo_eval = str(payload.get("tipo_evaluacion", "evaluacion")).replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"reporte_{docente.id}_{asignatura}_{tipo_eval}_{timestamp}.pdf"
    file_path = os.path.join(reports_dir, filename)

    # Generar PDF con los datos del reporte
    try:
        styles = getSampleStyleSheet()
        story = []

        titulo = f"Reporte de Notas - {payload.get('asignatura', asignatura)} ({payload.get('tipo_evaluacion', tipo_eval)})"
        story.append(Paragraph(titulo, styles["Title"]))
        story.append(Spacer(1, 12))
        story.append(Paragraph(f"Docente: {docente.nombre_completo}", styles["Normal"]))
        story.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # Encabezados y filas
        encabezados = ["Alumno", "Ciclo", "Asignatura", "Tipo Evaluación", "Calificación"]
        filas = []
        for fila in payload.get("reporte", []):
            filas.append([
                str(fila.get("alumno", "")),
                str(fila.get("ciclo", "")),
                str(fila.get("asignatura", payload.get("asignatura", asignatura))),
                str(fila.get("tipo_evaluacion", payload.get("tipo_evaluacion", tipo_eval))),
                str(fila.get("calificacion", "")),
            ])

        data = [encabezados] + (filas if filas else [["-","-","-","-","-"]])
        table = Table(data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0,0), (-1,0), colors.black),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,0), 10),
            ('BOTTOMPADDING', (0,0), (-1,0), 8),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('FONTSIZE', (0,1), (-1,-1), 9),
        ]))
        story.append(table)

        # Construir el documento
        doc = SimpleDocTemplate(file_path, pagesize=letter)
        doc.build(story)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo generar el PDF del reporte: {e}")

    # Enviar correo con adjunto
    try:
        from email_config import send_report_with_attachment
        email_result = await send_report_with_attachment(
            email=email,
            nombre_docente=docente.nombre_completo,
            asignatura=payload.get("asignatura", asignatura),
            tipo_evaluacion=payload.get("tipo_evaluacion", tipo_eval),
            file_path=file_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo enviar el correo: {e}")

    # Persistir registro en DB (opcionalmente marcar que se envió por correo)
    reporte_record = ReporteDocente(
        docente_id=docente.id,
        nombre_docente=docente.nombre_completo,
        asignatura=payload.get("asignatura", ""),
        tipo_evaluacion=payload.get("tipo_evaluacion", ""),
        archivo_path=file_path
    )
    db.add(reporte_record)
    db.commit()
    db.refresh(reporte_record)

    return {
        "message": email_result.get("message", "Reporte enviado"),
        "success": email_result.get("success", False),
        "docente": docente.nombre_completo,
        "reporte_id": reporte_record.id,
        "archivo": filename,
        "email": email,
        "fecha_envio": str(datetime.now())
    }

@router.get("/asignatura/{asignatura_id}/promedios", response_model=List[Dict[str, Any]])
async def obtener_promedios_asignatura(
    asignatura_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Obtener todos los promedios de una asignatura"""
    try:
        # Verificar que el docente tiene acceso a esta asignatura
        docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
        if not docente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Docente no encontrado"
            )
        
        # Verificar que la asignatura pertenece al docente
        asignatura = db.query(Asignatura).filter(
            Asignatura.id == asignatura_id,
            Asignatura.docente_id == docente.id
        ).first()
        
        if not asignatura:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asignatura no encontrada o no tienes acceso a ella"
            )
        
        # Obtener todos los promedios de la asignatura
        promedios = db.query(Promedio).filter(
            Promedio.asignatura_id == asignatura_id
        ).all()
        
        # Obtener todos los alumnos matriculados en la asignatura
        alumnos_matriculados = db.query(Alumno).join(
            matriculas, 
            matriculas.c.alumno_id == Alumno.id
        ).filter(
            matriculas.c.asignatura_id == asignatura_id
        ).all()
        
        # Convertir a formato JSON
        promedios_data = []
        for alumno in alumnos_matriculados:
            # Buscar el promedio del alumno
            promedio = next((p for p in promedios if p.alumno_id == alumno.id), None)
            
            # Verificar que el alumno existe
            if alumno:
                # Crear diccionario con valores predeterminados
                datos_promedio = {
                    "alumno_id": alumno.id,
                    "asignatura_id": asignatura_id,
                    "nombre_alumno": f"{alumno.apellidos} {alumno.nombres}" if alumno.apellidos and alumno.nombres else "Sin nombre",
                    "actividades": None,
                    "practicas": None,
                    "parciales": None,
                    "examen_final": None,
                    "promedio_final": None
                }
                
                # Si existe un promedio para este alumno, actualizar los valores
                if promedio:
                    datos_promedio.update({
                        "id": promedio.id,
                        "actividades": promedio.actividades,
                        "practicas": promedio.practicas,
                        "parciales": promedio.parciales,
                        "examen_final": promedio.examen_final,
                        "promedio_final": promedio.promedio_final
                    })
                
                promedios_data.append(datos_promedio)
        
        return promedios_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener promedios: {str(e)}"
        )
        
        return promedios_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener promedios: {str(e)}"
        )
@router.put("/mi-perfil")
async def actualizar_mi_perfil(
    perfil_data: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Actualizar el perfil del docente (contraseña)"""
    # Obtener el docente
    docente = db.query(Docente).filter(Docente.usuario_id == current_user.id).first()
    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado"
        )
    
    # Verificar que se proporcionó la contraseña actual
    password_actual = perfil_data.get("password_actual")
    if not password_actual:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es requerida"
        )
    
    # Verificar la contraseña actual
    if not verify_password(password_actual, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    # Verificar que se proporcionó la nueva contraseña
    nueva_password = perfil_data.get("nueva_password")
    if not nueva_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña es requerida"
        )
    
    # Verificar que la nueva contraseña tiene al menos 6 caracteres
    if len(nueva_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 6 caracteres"
        )
    
    # Actualizar la contraseña
    current_user.password_hash = get_password_hash(nueva_password)
    db.commit()
    db.refresh(current_user)
    
    return {
        "message": "Contraseña actualizada exitosamente",
        "docente": {
            "id": docente.id,
            "nombre_completo": docente.nombre_completo,
            "email": current_user.email
        }
    }
