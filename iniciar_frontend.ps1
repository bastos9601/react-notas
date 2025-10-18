# Script de PowerShell para iniciar el frontend en puerto 3001
Write-Host "Iniciando frontend en puerto 3001..." -ForegroundColor Green

# Cambiar al directorio frontend
Set-Location -Path "frontend"

# Establecer la variable de entorno PORT
$env:PORT = "3001"

# Iniciar el servidor de desarrollo
npm start
