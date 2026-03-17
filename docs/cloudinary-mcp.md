# Instalar MCP de Cloudinary

## Qué hace
Conecta Claude Code directamente a la cuenta de Cloudinary del proyecto. Habilita comandos como:
- Listar, buscar y eliminar imágenes
- Subir imágenes a carpetas específicas
- Ver uso de almacenamiento
- Transformar imágenes (resize, crop, etc.)

## Pasos

### 1. Crear `.mcp.json` en la raíz del proyecto

Opción A — con variables de entorno (recomendada, segura para repos):
```json
{
  "mcpServers": {
    "cloudinary-asset-management": {
      "url": "https://asset-management.mcp.cloudinary.com/mcp",
      "headers": {
        "cloudinary-cloud-name": "${CLOUDINARY_CLOUD_NAME}",
        "cloudinary-api-key": "${CLOUDINARY_API_KEY}",
        "cloudinary-api-secret": "${CLOUDINARY_API_SECRET}"
      }
    }
  }
}
```

Opción B — con valores directos (más simple, NO commitear):
```json
{
  "mcpServers": {
    "cloudinary-asset-management": {
      "url": "https://asset-management.mcp.cloudinary.com/mcp",
      "headers": {
        "cloudinary-cloud-name": "dn08287xp",
        "cloudinary-api-key": "291824672442252",
        "cloudinary-api-secret": "FPSASee-cfE3x64_DqzkgFbGLJY"
      }
    }
  }
}
```

### 2. Si usás Opción A, agregar al `.gitignore`
No hace falta ignorar el `.mcp.json` porque no tiene credenciales.
Las variables ya están en `backend/.env` (ignorado por git).

### 3. Si usás Opción B, agregar al `.gitignore`
```
.mcp.json
```

### 4. Reiniciar Claude Code
El MCP se carga al iniciar la sesión. Cerrá y volvé a abrir Claude Code en este proyecto.

## Recursos
- Docs oficiales: https://cloudinary.com/documentation/cloudinary_llm_mcp
- GitHub: https://github.com/cloudinary/mcp-servers
