@echo off
echo Iniciando servidor frontend en puerto 3001...
cd frontend
npm install
set PORT=3001
npm start
pause
