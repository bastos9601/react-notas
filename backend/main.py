from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, admin, docente, alumno, historial
from auth import require_role  # para dependencias de rol en rutas directas
from database import engine, Base, get_db
from models import Usuario
from sqlalchemy.orm import Session
import os

# Asegurar que estamos en el directorio correcto
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
print(f"Directorio de trabajo actual: {os.getcwd()}")
print(f"Usando la base de datos en: {os.path.join(backend_dir, 'sistema_notas.db')}")

# Crear las tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Gestión de Notas",
    description="API para gestión académica de notas con roles de Admin, Docente y Alumno",
    version="1.0.0"
)

# Configurar CORS
# En la configuración CORS (líneas 20-25):
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas las origenes para desarrollo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/auth", tags=["autenticación"])
app.include_router(admin.router, prefix="/admin", tags=["administrador"])
app.include_router(docente.router, prefix="/docente", tags=["docente"])
app.include_router(alumno.router, prefix="/alumno", tags=["alumno"])
app.include_router(historial.router, prefix="/historial", tags=["historial académico"])

@app.get("/")
async def root():
    return {"message": "Sistema de Gestión de Notas API"}


@app.get("/debug/users")
async def debug_users(db: Session = Depends(get_db)):
    """Endpoint de debug para verificar usuarios"""
    import os
    from sqlalchemy import text
    
    # Información de debug adicional
    debug_info = {
        "database_url": os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sistema_notas.db')}"),
        "current_directory": os.getcwd(),
        "database_exists": os.path.exists("../sistema_notas.db"),
        "database_path": os.path.abspath("../sistema_notas.db") if os.path.exists("../sistema_notas.db") else None
    }
    
    # Consulta usando SQLAlchemy ORM
    users = db.query(Usuario).all()
    
    # Consulta directa usando SQL
    direct_count = 0
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM usuarios"))
            direct_count = result.fetchone()[0]
    except Exception as e:
        debug_info["sql_error"] = str(e)
    
    return {
        "total_users_orm": len(users),
        "total_users_sql": direct_count,
        "debug_info": debug_info,
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "nombre": user.nombre,
                "rol": user.rol,
                "activo": user.activo
            }
            for user in users
        ]
    }

@app.get("/debug/database")
async def debug_database():
    """Endpoint de debug para verificar configuración de base de datos"""
    import os
    from database import DATABASE_URL
    return {
        "database_url": DATABASE_URL,
        "current_directory": os.getcwd(),
        "database_exists": os.path.exists("sistema_notas.db"),
        "database_path": os.path.abspath("sistema_notas.db") if os.path.exists("sistema_notas.db") else None
    }

@app.get("/debug/users-detailed")
async def debug_users_detailed(db: Session = Depends(get_db)):
    """Endpoint de debug detallado para verificar usuarios"""
    import os
    users = db.query(Usuario).all()
    return {
        "total_users": len(users),
        "database_url": os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sistema_notas.db')}"),
        "current_directory": os.getcwd(),
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "nombre": user.nombre,
                "rol": user.rol,
                "activo": user.activo,
                "password_hash": user.password_hash[:50] + "..." if user.password_hash else None
            }
            for user in users
        ]
    }


@app.get("/debug/routes")
async def debug_routes():
    """Devuelve la lista de rutas registradas y sus métodos (útil para depuración)."""
    routes = []
    for route in app.router.routes:
        try:
            methods = list(route.methods) if hasattr(route, 'methods') and route.methods else []
            path = getattr(route, 'path', None) or getattr(route, 'rule', None)
            routes.append({
                'path': path,
                'name': getattr(route, 'name', None),
                'methods': methods
            })
        except Exception:
            continue
    return {"count": len(routes), "routes": routes}

# Ruta directa para enviar reporte por correo, como respaldo si el router no se actualiza
@app.post("/docente/reportes/enviar-email")
async def enviar_reporte_email_direct(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente"))
):
    """Proxy que delega al handler del router de docente para enviar el reporte por email.
    Esto garantiza que la ruta exista aun cuando el servidor no recargó correctamente el módulo docente.
    """
    from routers.docente import enviar_reporte_email as enviar
    return await enviar(payload, db, current_user)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
