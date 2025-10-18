# Sistema de Gestión de Notas Académicas

Un sistema completo de gestión académica de notas con backend en Python (FastAPI) y frontend en React + TailwindCSS, con tres roles: Administrador, Docente y Alumno.

## 🚀 Inicio Rápido

### Opción 1: Instalación Manual (Recomendado para desarrollo)

#### Prerrequisitos
- Python 3.8+
- Node.js 16+
- npm o yarn

#### Backend

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd sisetmas-notas-react
   ```

2. **Configurar el backend:**
   ```bash
   cd backend
   
   # Crear entorno virtual
   python -m venv venv
   
   # Activar entorno virtual
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   
   # Instalar dependencias
   pip install -r requirements.txt
   ```

3. **Configurar variables de entorno:**
   ```bash
   # Copiar archivo de ejemplo
   cp env.example .env
   
   # Editar el archivo .env con tus valores
   # Mínimo necesario: cambiar SECRET_KEY
   ```

4. **Ejecutar el backend:**
   ```bash
   python main.py
   ```
   
   El backend estará disponible en: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

#### Frontend

1. **Configurar el frontend:**
   ```bash
   cd frontend
   
   # Instalar dependencias
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Crear archivo .env en frontend/
   echo "PORT=3001" > .env
   echo "REACT_APP_API_URL=http://localhost:8000" >> .env
   ```

3. **Ejecutar el frontend:**
   ```bash
   npm start
   ```
   
   El frontend estará disponible en: `http://localhost:3001`

### Opción 2: Docker (Recomendado para producción)

```bash
# Construir y ejecutar con Docker Compose
docker-compose up --build

# El sistema estará disponible en:
# Frontend: http://localhost:3001
# Backend: http://localhost:8000
```

## 📋 Configuración Detallada

### Variables de Entorno del Backend

Crea un archivo `.env` en `backend/` basado en `env.example`:

```env
# Configuración mínima para desarrollo
SECRET_KEY=tu-clave-secreta-muy-segura-aqui-cambiar-en-produccion
DATABASE_URL=sqlite:///../sistema_notas.db

# Configuración de email (opcional)
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-password-de-app-gmail
MAIL_FROM=tu-email@gmail.com
```

> 📍 **Nota:** La base de datos `sistema_notas.db` se crea automáticamente en la raíz del proyecto cuando ejecutas el servidor.

### Variables de Entorno del Frontend

Crea un archivo `.env` en `frontend/`:

```env
PORT=3001
REACT_APP_API_URL=http://localhost:8000
```

## 🔑 Credenciales de Acceso

### Usuario Administrador
- **Email:** `admin@sistema.com`
- **Contraseña:** `admin123`

### Usuarios de Prueba
- **Docentes:** `juan.docente@sistema.com` / `maria.docente@sistema.com` (contraseña: `docente123`)
- **Alumnos:** `carlos.alumno@sistema.com` / `ana.alumno@sistema.com` (contraseña: `alumno123`)

> 📋 Ver archivo `CREDENCIALES.md` para la lista completa de usuarios

## 🔧 Solución de Problemas Comunes

### Error: "ModuleNotFoundError: No module named 'fastapi_mail'"
**Solución:** Ejecuta `pip install -r requirements.txt` en el entorno virtual activado.

### Error: "No module named 'dotenv'"
**Solución:** Asegúrate de tener el archivo `.env` y ejecuta `pip install python-dotenv`.

### Error de CORS en el frontend
**Solución:** Verifica que `REACT_APP_API_URL` en el frontend coincida con la URL del backend.

### Error de base de datos
**Solución:** El archivo `sistema_notas.db` se crea automáticamente. Si hay problemas, elimínalo y reinicia el backend.

### No puedo iniciar sesión
**Solución:** Usa las credenciales del archivo `CREDENCIALES.md`. Si necesitas crear más usuarios, ejecuta `python create_admin.py` en el directorio backend.

## 🏗️ Estructura del Proyecto

## Uso del Sistema

### Roles y Permisos

#### Administrador
- **Dashboard**: Estadísticas generales del sistema
- **Gestionar Alumnos**: Crear, editar y eliminar alumnos
- **Gestionar Docentes**: Crear, editar y eliminar docentes
- **Gestionar Asignaturas**: Crear y asignar asignaturas a docentes
- **Matricular Alumnos**: Matricular alumnos en asignaturas

#### Docente
- **Mis Asignaturas**: Ver asignaturas asignadas
- **Registrar Notas**: Registrar y gestionar notas de alumnos
- **Ver Alumnos**: Ver alumnos matriculados en sus asignaturas

#### Alumno
- **Mis Asignaturas**: Ver asignaturas matriculadas
- **Mis Notas**: Ver calificaciones y promedios
- **Promedios**: Ver promedios por asignatura y general

### Flujo de Trabajo

1. **Configuración inicial (Admin):**
   - Crear docentes
   - Crear alumnos
   - Crear asignaturas y asignarlas a docentes
   - Matricular alumnos en asignaturas

2. **Gestión académica (Docente):**
   - Ver asignaturas asignadas
   - Registrar notas de alumnos matriculados
   - Actualizar notas existentes

3. **Consulta académica (Alumno):**
   - Ver asignaturas matriculadas
   - Consultar calificaciones
   - Ver promedios y estadísticas

## API Endpoints

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener usuario actual

### Administrador
- `GET /admin/dashboard` - Dashboard con estadísticas
- `GET|POST /admin/alumnos` - Gestión de alumnos
- `GET|POST /admin/docentes` - Gestión de docentes
- `GET|POST /admin/asignaturas` - Gestión de asignaturas
- `GET|POST /admin/matriculas` - Gestión de matrículas

### Docente
- `GET /docente/mis-asignaturas` - Asignaturas del docente
- `GET /docente/asignaturas/{id}/alumnos` - Alumnos por asignatura
- `GET|POST|PUT|DELETE /docente/notas` - Gestión de notas

### Alumno
- `GET /alumno/mis-asignaturas` - Asignaturas del alumno
- `GET /alumno/mis-notas` - Notas del alumno
- `GET /alumno/promedio` - Promedio general
- `GET /alumno/promedio-por-asignatura` - Promedios por asignatura

## Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno y rápido
- **SQLAlchemy**: ORM para Python
- **SQLite**: Base de datos ligera
- **JWT**: Autenticación con tokens
- **Pydantic**: Validación de datos
- **Uvicorn**: Servidor ASGI

### Frontend
- **React**: Biblioteca de interfaz de usuario
- **React Router**: Enrutamiento
- **TailwindCSS**: Framework de CSS
- **Axios**: Cliente HTTP
- **Lucide React**: Iconos
- **Context API**: Gestión de estado

## Desarrollo

### Estructura de Base de Datos

```sql
-- Usuarios del sistema
usuarios (id, nombre, email, password_hash, rol, activo, fecha_creacion)

-- Información de alumnos
alumnos (id, nombre_completo, dni, ciclo, usuario_id)

-- Información de docentes
docentes (id, nombre_completo, dni, usuario_id)

-- Asignaturas
asignaturas (id, nombre, docente_id)

-- Notas
notas (id, alumno_id, asignatura_id, calificacion, fecha_registro)

-- Matrículas (relación muchos a muchos)
matriculas (alumno_id, asignatura_id)
```

### Validaciones Implementadas
- DNI único por tipo de usuario
- Email único en el sistema
- Calificaciones entre 0 y 20
- Contraseñas encriptadas con bcrypt
- Tokens JWT con expiración

## Despliegue

### Backend en Producción
1. Cambiar `DATABASE_URL` a PostgreSQL
2. Configurar `SECRET_KEY` segura
3. Usar servidor WSGI como Gunicorn
4. Configurar proxy reverso (Nginx)

### Frontend en Producción
1. Ejecutar `npm run build`
2. Servir archivos estáticos
3. Configurar variables de entorno de producción

## Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico o preguntas, contactar al administrador del sistema.
