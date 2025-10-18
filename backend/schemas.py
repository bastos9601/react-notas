from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date

# Constantes para tipos de registros académicos
TIPO_REGISTRO = {
    "MATRICULA": "matricula",
    "NOTA": "nota",
    "ASISTENCIA": "asistencia"
}

# Schemas para Usuario
class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: str

class UsuarioCreate(UsuarioBase):
    password: str

class Usuario(UsuarioBase):
    id: int
    activo: bool
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

# Schemas para Alumno
class AlumnoBase(BaseModel):
    nombre_completo: str
    dni: str
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    ciclo: str

class AlumnoCreate(AlumnoBase):
    email: EmailStr
    password: str

class AlumnoUpdate(BaseModel):
    nombre_completo: str
    dni: str
    fecha_nacimiento: Optional[date] = None
    genero: Optional[str] = None
    telefono: Optional[str] = None
    ciclo: str
    email: EmailStr
    password: str | None = None  # Opcional para actualización

class Alumno(AlumnoBase):
    id: int
    usuario_id: int
    usuario: Usuario
    
    class Config:
        from_attributes = True

# Schemas para Docente
class DocenteBase(BaseModel):
    nombre_completo: str
    dni: str

class DocenteCreate(DocenteBase):
    email: EmailStr
    password: str

class Docente(DocenteBase):
    id: int
    usuario_id: int
    usuario: Usuario
    
    class Config:
        from_attributes = True

# Schemas para Asignatura
class AsignaturaBase(BaseModel):
    nombre: str
    ciclo: str

class AsignaturaCreate(AsignaturaBase):
    docente_id: int

class Asignatura(AsignaturaBase):
    id: int
    docente_id: int
    docente: Docente
    
    class Config:
        from_attributes = True

# Schemas para Nota
class NotaBase(BaseModel):
    calificacion: float
    tipo_nota: str
    publicada: bool = False

class NotaCreate(NotaBase):
    alumno_id: int
    asignatura_id: int

class NotaUpdate(BaseModel):
    calificacion: float
    tipo_nota: str
    publicada: bool = False

class Nota(NotaBase):
    id: int
    alumno_id: int
    asignatura_id: int
    fecha_registro: datetime
    alumno: Alumno
    asignatura: Asignatura
    
    class Config:
        from_attributes = True

# Schemas para autenticación
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Schemas para matrículas
class MatriculaCreate(BaseModel):
    alumno_id: int
    asignatura_id: int

class Matricula(BaseModel):
    alumno_id: int
    asignatura_id: int
    alumno: Alumno
    asignatura: Asignatura
    
    class Config:
        from_attributes = True

# Schemas para historial académico
class NotaHistorialBase(BaseModel):
    calificacion: float
    tipo_nota: str
    fecha_registro: datetime

class NotaHistorialCreate(NotaHistorialBase):
    asignatura_id: int

class NotaHistorial(NotaHistorialBase):
    id: int
    asignatura_id: int
    
    class Config:
        from_attributes = True

class AsignaturaHistorialBase(BaseModel):
    nombre: str
    promedio: float

class AsignaturaHistorialCreate(AsignaturaHistorialBase):
    historial_id: int

class AsignaturaHistorial(AsignaturaHistorialBase):
    id: int
    historial_id: int
    notas: List[NotaHistorial] = []
    
    class Config:
        from_attributes = True

class HistorialAcademicoBase(BaseModel):
    ciclo: str

class HistorialAcademicoCreate(HistorialAcademicoBase):
    alumno_id: int

class HistorialAcademico(HistorialAcademicoBase):
    id: int
    alumno_id: int
    fecha_registro: datetime
    asignaturas: List[AsignaturaHistorial] = []
    
    class Config:
        from_attributes = True

# Schemas para respuestas con listas
class AlumnoConNotas(Alumno):
    notas: List[Nota] = []
    historiales: List[HistorialAcademico] = []

class AsignaturaConNotas(Asignatura):
    notas: List[Nota] = []
    alumnos_matriculados: List[Alumno] = []

# Schemas para Reportes enviados por Docentes
class ReporteDocenteBase(BaseModel):
    docente_id: int
    nombre_docente: str
    asignatura: str
    tipo_evaluacion: str
    archivo_path: str

class ReporteDocente(ReporteDocenteBase):
    id: int
    fecha_envio: datetime

    class Config:
        from_attributes = True
