@echo off
echo.
echo ================================================
echo    DermaClinic - Servidor con Acceso Remoto
echo ================================================
echo.
echo Este script inicia el servidor y lo expone a internet con ngrok
echo.

REM Verificar que ngrok está instalado
where ngrok >nul 2>&1
if %errorlevel% neq 0 (
  echo ERROR: ngrok no está instalado o no está en PATH
  echo.
  echo Descárgalo desde: https://ngrok.com/download
  echo Después de instalar, agrega ngrok a tu PATH o pon ngrok.exe en este directorio
  echo.
  pause
  exit /b 1
)

REM Iniciar servidor backend en background
echo Iniciando servidor backend en puerto 3001...
start "DermaClinic Backend" cmd /k "cd backend && npm start"

REM Esperar a que el servidor inicie
timeout /t 3 /nobreak

REM Iniciar ngrok en background
echo.
echo Iniciando ngrok (exponiendo servidor a internet)...
start "DermaClinic ngrok" cmd /k "ngrok http --authtoken="" 3001"

REM Esperar a que ngrok inicie
timeout /t 3 /nobreak

REM Mostrar info
cls
echo.
echo ================================================
echo    DermaClinic - En Linea (Remoto)
echo ================================================
echo.
echo ACCESO:
echo   URL Remota: Busca en ventana "DermaClinic ngrok"
echo   Ejemplo:    https://abc123-def456.ngrok.io
echo.
echo CREDENCIALES:
echo   Email: demo@dermaclinic.com
echo   Contraseña: password
echo.
echo INSTRUCCIONES:
echo   1. Busca en ventana "DermaClinic ngrok" la linea "Forwarding"
echo   2. Copia la URL HTTPS (abc123.ngrok.io)
echo   3. Comparte esa URL con otros usuarios
echo.
echo CIERRE:
echo   Ctrl+C en ambas ventanas para detener
echo.
pause
