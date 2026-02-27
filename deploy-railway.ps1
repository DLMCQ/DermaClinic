# DermaClinic Deployment to Railway
# Este script automatiza el deployment a Railway

param(
    [switch]$SetupOnly = $false,
    [switch]$DeployOnly = $false
)

function Write-Header {
    Write-Host "`n================================================" -ForegroundColor Cyan
    Write-Host "   DermaClinic - Deploy to Railway" -ForegroundColor Cyan
    Write-Host "================================================`n" -ForegroundColor Cyan
}

function Test-Railways {
    Write-Host "Verificando requisitos..." -ForegroundColor Yellow
    
    # Verificar Node.js
    $node = node --version
    Write-Host "✓ Node.js: $node" -ForegroundColor Green
    
    # Verificar npm
    $npm = npm --version
    Write-Host "✓ npm: $npm" -ForegroundColor Green
    
    # Verificar Git
    $git = git --version
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Git: $git" -ForegroundColor Green
    } else {
        Write-Host "✗ Git no instalado" -ForegroundColor Red
        Write-Host "  Descarga desde: https://git-scm.com" -ForegroundColor Yellow
        exit 1
    }
    
    # Verificar Railway CLI
    $railway = railway --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Railway CLI: $railway" -ForegroundColor Green
    } else {
        Write-Host "⚠ Railway CLI no encontrada" -ForegroundColor Yellow
        Write-Host "  Instalando..." -ForegroundColor Yellow
        npm install -g railway
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Railway CLI instalada" -ForegroundColor Green
        } else {
            Write-Host "✗ Error instalando Railway CLI" -ForegroundColor Red
            exit 1
        }
    }
}

function Initialize-Git {
    Write-Host "`nInicializando Git..." -ForegroundColor Yellow
    
    if (!(Test-Path ".git")) {
        git init
        git add .
        git commit -m "Initial commit - DermaClinic"
        Write-Host "✓ Git inicializado" -ForegroundColor Green
    } else {
        Write-Host "✓ Git ya inicializado" -ForegroundColor Green
    }
}

function Build-Frontend {
    Write-Host "`nCompilando frontend..." -ForegroundColor Yellow
    
    cd frontend
    npm run build:local
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Frontend compilado exitosamente" -ForegroundColor Green
        cd ..
    } else {
        Write-Host "✗ Error compilando frontend" -ForegroundColor Red
        exit 1
    }
}

function Deploy-Railway {
    Write-Host "`nConectando a Railway..." -ForegroundColor Yellow
    
    # Login si es necesario
    railway whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Necesitas ingresar a tu cuenta Railway" -ForegroundColor Yellow
        railway login
    }
    
    # Deploy
    Write-Host "`nIniciando deployment..." -ForegroundColor Cyan
    railway up
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ ¡Deployment completado!" -ForegroundColor Green
        Write-Host "`nObtener detalles del deployment:" -ForegroundColor Cyan
        Write-Host "  railway status" -ForegroundColor Gray
        Write-Host "`nVer logs:" -ForegroundColor Cyan
        Write-Host "  railway logs" -ForegroundColor Gray
        Write-Host "`nAbrir dashboard:" -ForegroundColor Cyan
        Write-Host "  railway open" -ForegroundColor Gray
    } else {
        Write-Host "✗ Error en el deployment" -ForegroundColor Red
        exit 1
    }
}

function Setup-Environment {
    Write-Host "`n========== SETUP INICIAL ==========" -ForegroundColor Cyan
    
    # Compilar frontend
    Build-Frontend
    
    # Inicializar Git
    Initialize-Git
    
    Write-Host "`n✓ Setup completado" -ForegroundColor Green
    Write-Host "`nProximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Abre https://railway.app" -ForegroundColor Gray
    Write-Host "  2. Conecta tu repositorio GitHub (si la hiciste)" -ForegroundColor Gray
    Write-Host "  3. Railway detectará automáticamente el Procfile" -ForegroundColor Gray
    Write-Host "  4. Configura variables de entorno (ver DEPLOYMENT_RAILWAY.md)" -ForegroundColor Gray
}

function Deploy {
    Write-Host "`n========== DEPLOYMENT ==========" -ForegroundColor Cyan
    
    # Compilar frontend
    Build-Frontend
    
    # Commit cambios
    Write-Host "`nCommiteando cambios..." -ForegroundColor Yellow
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git add .
    git commit -m "Deploy: $date" -q 2>$null
    if ($?) {
        Write-Host "✓ Cambios commiteados" -ForegroundColor Green
    }
    
    # Deploy a Railway
    Deploy-Railway
}

# Main
Write-Header
Test-Requirements

if ($SetupOnly) {
    Setup-Environment
} elseif ($DeployOnly) {
    Deploy
} else {
    Write-Host "Opciones:" -ForegroundColor Cyan
    Write-Host "  .\deploy.ps1 -SetupOnly   : Solo configuración inicial" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1 -DeployOnly  : Solo deployment" -ForegroundColor Gray
    Write-Host "  .\deploy.ps1              : Setup completo + Deploy" -ForegroundColor Gray
    Write-Host "`nEnte en el proyecto DermaClinic primero:" -ForegroundColor Yellow
    Write-Host "  cd 'c:\Users\majac\Documents\Chamba\DermaClinic\DermaClinic'" -ForegroundColor Gray
    
    $response = Read-Host "`n¿Continuar con Setup + Deploy? (s/n)"
    if ($response -eq 's') {
        Setup-Environment
        Write-Host "`n¿Proceder al deployment? (s/n)" -ForegroundColor Yellow
        $response = Read-Host
        if ($response -eq 's') {
            Deploy
        }
    }
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   Fin del script" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan
