@echo off
echo.
echo ================================================
echo    DermaClinic - Instalacion y arranque
echo ================================================
echo.

node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: Node.js no esta instalado.
  echo Descargalo desde: https://nodejs.org  ^(version LTS^)
  echo Luego vuelve a ejecutar este archivo.
  pause
  exit /b 1
)

echo OK - Node.js detectado:
node --version

echo.
echo Instalando dependencias del backend...
cd backend
call npm install
if %errorlevel% neq 0 (
  echo ERROR instalando backend
  pause
  exit /b 1
)

echo.
echo Instalando dependencias del frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
  echo ERROR instalando frontend
  pause
  exit /b 1
)

echo.
echo Compilando el frontend ^(puede tardar 1-2 minutos^)...
call npm run build:local
if %errorlevel% neq 0 (
  echo ERROR compilando frontend
  pause
  exit /b 1
)

echo.
echo Copiando archivos compilados...
xcopy /E /Y /I build ..\frontend\build\ >nul

echo.
echo ================================================
echo    Instalacion completada con exito!
echo ================================================
echo.
echo Iniciando servidor DermaClinic...
echo.
cd ..\backend
node src/server.js
pause
