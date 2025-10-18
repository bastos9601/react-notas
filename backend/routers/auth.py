from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from database import get_db
from models import Usuario, Alumno, Docente
from schemas import Token, UsuarioCreate, Usuario as UsuarioSchema
from auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Iniciar sesión"""
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UsuarioSchema)
async def register(user_data: UsuarioCreate, db: Session = Depends(get_db)):
    """Registrar nuevo usuario (solo admin puede crear usuarios)"""
    # Verificar si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    db_user = Usuario(
        nombre=user_data.nombre,
        email=user_data.email,
        password_hash=hashed_password,
        rol=user_data.rol
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.get("/me", response_model=UsuarioSchema)
async def read_users_me(current_user: Usuario = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return current_user

@router.post("/recuperar-contrasena")
async def recuperar_contrasena(
    email_data: dict,
    db: Session = Depends(get_db)
):
    """Enviar enlace de recuperación de contraseña por email"""
    email = email_data.get("email")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email es requerido"
        )
    
    # Buscar el usuario por email
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        # Por seguridad, no revelamos si el email existe o no
        return {
            "message": "Si el email existe en nuestro sistema, se ha enviado un enlace de recuperación"
        }
    
    # Generar nueva contraseña temporal
    import secrets
    import string
    
    # Generar contraseña temporal de 8 caracteres
    password_chars = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(password_chars) for _ in range(8))
    
    # Actualizar la contraseña en la base de datos
    user.password_hash = get_password_hash(temp_password)
    db.commit()
    
    # Intentar enviar email
    try:
        from email_config import send_password_recovery_email
        
        # Obtener el nombre del usuario según su rol
        nombre_usuario = user.nombre
        if user.rol == "alumno":
            alumno = db.query(Alumno).filter(Alumno.usuario_id == user.id).first()
            if alumno:
                nombre_usuario = alumno.nombre_completo
        elif user.rol == "docente":
            docente = db.query(Docente).filter(Docente.usuario_id == user.id).first()
            if docente:
                nombre_usuario = docente.nombre_completo
        
        email_result = await send_password_recovery_email(
            email=user.email,
            nombre=nombre_usuario,
            temp_password=temp_password
        )
        
        if email_result["success"]:
            return {
                "message": "Se ha enviado un enlace de recuperación a tu email",
                "email_sent": True
            }
        else:
            # Si falla el email, retornar la contraseña para mostrar al usuario
            return {
                "message": "Se ha generado una contraseña temporal, pero falló el envío por email",
                "temp_password": temp_password,
                "email_sent": False,
                "instructions": "Configura las credenciales de email en el archivo .env para recibir notificaciones por correo"
            }
    except Exception as e:
        # Si hay error en el servicio de email, retornar la contraseña
        return {
            "message": "Se ha generado una contraseña temporal, pero falló el envío por email",
            "temp_password": temp_password,
            "email_sent": False,
            "email_error": f"Error en el servicio de email: {str(e)}",
            "instructions": "Verifica la configuración de email en el archivo .env"
        }
