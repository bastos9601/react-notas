# Scripts de inicio rápido para Windows

## Backend
```batch
@echo off
echo Iniciando servidor backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python main.py
pause
```

## Frontend
```batch
@echo off
echo Iniciando servidor frontend...
cd frontend
npm install
npm start
pause
```

## Ambos servicios
```batch
@echo off
echo Iniciando sistema completo...
start "Backend" cmd /k "cd backend && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && python main.py"
timeout /t 5
start "Frontend" cmd /k "cd frontend && npm install && npm start"
pause
```
