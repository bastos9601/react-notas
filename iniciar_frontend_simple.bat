@echo off
echo Configurando puerto 3001 para el frontend...
cd frontend
set PORT=3001
echo Puerto configurado: %PORT%
echo Iniciando servidor...
npm start
