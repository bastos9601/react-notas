from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)  # admin, docente, alumno
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    alumno = relationship("Alumno", back_populates="usuario", uselist=False)
    docente = relationship("Docente", back_populates="usuario", uselist=False)

class Alumno(Base):
    __tablename__ = "alumnos"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(200), nullable=False)
    dni = Column(String(20), unique=True, index=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=True)
    genero = Column(String(20), nullable=True)  # Masculino, Femenino, Otro
    telefono = Column(String(20), nullable=True)
    ciclo = Column(String(50), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="alumno")
    notas = relationship("Nota", back_populates="alumno")
    asignaturas_matriculadas = relationship("Asignatura", secondary="matriculas", overlaps="alumnos_matriculados")
    historiales = relationship("HistorialAcademico", back_populates="alumno")

class HistorialAcademico(Base):
    __tablename__ = "historiales_academicos"
    
    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("alumnos.id"), nullable=False)
    ciclo = Column(String(50), nullable=False)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relaciones
    alumno = relationship("Alumno", back_populates="historiales")
    asignaturas = relationship("AsignaturaHistorial", back_populates="historial")

class AsignaturaHistorial(Base):
    __tablename__ = "asignaturas_historial"
    
    id = Column(Integer, primary_key=True, index=True)
    historial_id = Column(Integer, ForeignKey("historiales_academicos.id"), nullable=False)
    nombre = Column(String(200), nullable=False)
    promedio = Column(Float, nullable=False)
    
    # Relaciones
    historial = relationship("HistorialAcademico", back_populates="asignaturas")
    notas = relationship("NotaHistorial", back_populates="asignatura")

class NotaHistorial(Base):
    __tablename__ = "notas_historial"
    
    id = Column(Integer, primary_key=True, index=True)
    asignatura_id = Column(Integer, ForeignKey("asignaturas_historial.id"), nullable=False)
    calificacion = Column(Float, nullable=False)
    tipo_nota = Column(String(50), nullable=False)
    fecha_registro = Column(DateTime(timezone=True), nullable=False)
    
    # Relaciones
    asignatura = relationship("AsignaturaHistorial", back_populates="notas")

class Docente(Base):
    __tablename__ = "docentes"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(200), nullable=False)
    dni = Column(String(20), unique=True, index=True, nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="docente")
    asignaturas = relationship("Asignatura", back_populates="docente")

class Asignatura(Base):
    __tablename__ = "asignaturas"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    ciclo = Column(String(50), nullable=False)
    docente_id = Column(Integer, ForeignKey("docentes.id"), nullable=False)
    
    # Relaciones
    docente = relationship("Docente", back_populates="asignaturas")
    notas = relationship("Nota", back_populates="asignatura")
    alumnos_matriculados = relationship("Alumno", secondary="matriculas", overlaps="asignaturas_matriculadas")

class Nota(Base):
    __tablename__ = "notas"
    
    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("alumnos.id"), nullable=False)
    asignatura_id = Column(Integer, ForeignKey("asignaturas.id"), nullable=False)
    calificacion = Column(Float, nullable=False)  # 0-20
    tipo_nota = Column(String(50), nullable=False)  # examen_final, examen_parcial, practica, participacion, etc.
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    publicada = Column(Boolean, default=False, nullable=False)  # Si la nota está publicada para el alumno
    
    # Relaciones
    alumno = relationship("Alumno", back_populates="notas")
    asignatura = relationship("Asignatura", back_populates="notas")

# Tabla de relación muchos a muchos para matrículas
from sqlalchemy import Table

matriculas = Table(
    'matriculas',
    Base.metadata,
    Column('alumno_id', Integer, ForeignKey('alumnos.id'), primary_key=True),
    Column('asignatura_id', Integer, ForeignKey('asignaturas.id'), primary_key=True)
)

class Promedio(Base):
    __tablename__ = "promedios"
    
    id = Column(Integer, primary_key=True, index=True)
    alumno_id = Column(Integer, ForeignKey("alumnos.id"), nullable=False)
    asignatura_id = Column(Integer, ForeignKey("asignaturas.id"), nullable=False)
    actividades = Column(Float, nullable=True)
    practicas = Column(Float, nullable=True)
    parciales = Column(Float, nullable=True)
    examen_final = Column(Float, nullable=True)
    promedio_final = Column(Float, nullable=True)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relaciones
    alumno = relationship("Alumno", backref="promedios")
    asignatura = relationship("Asignatura", backref="promedios")

class ReporteDocente(Base):
    __tablename__ = "reportes_docentes"

    id = Column(Integer, primary_key=True, index=True)
    docente_id = Column(Integer, ForeignKey("docentes.id"), nullable=False)
    nombre_docente = Column(String(200), nullable=False)
    asignatura = Column(String(200), nullable=False)
    tipo_evaluacion = Column(String(100), nullable=False)
    archivo_path = Column(String(500), nullable=False)
    fecha_envio = Column(DateTime(timezone=True), server_default=func.now())

    # Relaciones
    docente = relationship("Docente")
