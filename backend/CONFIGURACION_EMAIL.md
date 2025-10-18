# Configuración de Email para el Sistema de Notas

## Configuración de Gmail

Para que el sistema pueda enviar emails con las notas de los alumnos, necesitas configurar las credenciales de Gmail.

### 1. Crear un archivo `.env` en la carpeta `backend`

Crea un archivo llamado `.env` en la carpeta `backend` con el siguiente contenido:

```env
# Configuración de Email para Gmail
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-password-de-aplicacion
MAIL_FROM=tu-email@gmail.com

# Configuración de la base de datos
DATABASE_URL=sqlite:///./sistema_notas.db

# Configuración de JWT
SECRET_KEY=tu-clave-secreta-muy-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración del servidor
HOST=localhost
PORT=8000
```

### 2. Configurar Gmail para aplicaciones

1. **Habilitar la verificación en 2 pasos** en tu cuenta de Gmail
2. **Generar una contraseña de aplicación**:
   - Ve a tu cuenta de Google
   - Seguridad → Verificación en 2 pasos
   - Contraseñas de aplicaciones
   - Genera una nueva contraseña para "Mail"
   - Usa esta contraseña en el archivo `.env`

### 3. Instalar dependencias de email

El sistema ya incluye las dependencias necesarias en `requirements.txt`:
- `fastapi-mail`
- `python-multipart`

### 4. Verificar la configuración

Una vez configurado el archivo `.env`, el sistema podrá:
- Enviar notificaciones individuales cuando se publique una nota
- Enviar reportes completos de todas las notas de un alumno
- Enviar emails de recuperación de contraseña

### 5. Funcionalidades de Email

El sistema incluye las siguientes funcionalidades de email:

#### Envío de Notas Individuales
- Se envía automáticamente cuando un docente publica una nota
- Incluye detalles de la calificación y estado

#### Envío de Reporte Completo
- Botón "Enviar Email" en el panel de docente
- Envía todas las notas de un alumno en una asignatura
- Incluye promedio y tabla detallada

#### Recuperación de Contraseña
- Envío de contraseña temporal por email

### 6. Plantillas de Email

Las plantillas están diseñadas con:
- Diseño responsive
- Colores según el estado de las notas
- Información clara y organizada
- Criterios de evaluación incluidos

### 7. Solución de Problemas

Si los emails no se envían:

1. **Verifica las credenciales** en el archivo `.env`
2. **Confirma que la verificación en 2 pasos** está habilitada
3. **Usa la contraseña de aplicación** correcta
4. **Revisa los logs** del servidor para errores específicos

### 8. Seguridad

- Nunca compartas tu archivo `.env`
- Usa contraseñas de aplicación, no tu contraseña principal
- Mantén actualizadas las credenciales
