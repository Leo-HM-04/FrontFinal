# Script para limpiar y reiniciar la aplicación Next.js
Write-Host "Limpiando caché y reiniciando la aplicación..." -ForegroundColor Cyan

# Detener cualquier instancia en ejecución de Next.js
Write-Host "Deteniendo procesos en ejecución..." -ForegroundColor Yellow
taskkill /f /im node.exe 2>$null

# Eliminar directorios de caché
Write-Host "Eliminando caché..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "Carpeta .next eliminada." -ForegroundColor Green
}

if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
    Write-Host "Caché de node_modules eliminada." -ForegroundColor Green
}

# Opcional: Reinstalar dependencias
$reinstallDeps = Read-Host "¿Desea reinstalar las dependencias? (s/n)"
if ($reinstallDeps -eq "s") {
    Write-Host "Reinstalando dependencias..." -ForegroundColor Yellow
    npm ci
} else {
    Write-Host "Omitiendo reinstalación de dependencias." -ForegroundColor Yellow
}

# Compilar la aplicación desde cero
Write-Host "Compilando la aplicación desde cero..." -ForegroundColor Yellow
npm run build

# Iniciar el servidor de desarrollo
Write-Host "Iniciando el servidor de desarrollo..." -ForegroundColor Green
npm run dev
