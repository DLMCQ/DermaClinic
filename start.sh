#!/bin/bash
set -e

echo "🚀 Starting DermaClinic..."
echo "📦 Installing dependencies..."

cd backend
npm install

echo "✅ Starting server..."
npm start
