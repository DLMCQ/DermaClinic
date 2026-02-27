#!/bin/bash
set -e

echo "🚀 Starting DermaClinic..."

# Compilar Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

echo "🔨 Building frontend..."
npm run build

# Instalar y correr Backend
echo "📦 Installing backend dependencies..."
cd ../backend
npm install

echo "✅ Starting server..."
npm start
