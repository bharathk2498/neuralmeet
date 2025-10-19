#!/bin/bash

echo "NeuralMeet Backend Setup"
echo "========================"

cd backend

echo "Installing dependencies..."
npm install

echo ""
echo "Checking API key configuration..."
if grep -q "DID_API_KEY" .env; then
    echo "✓ API key configured in .env"
else
    echo "✗ API key not found in .env"
    exit 1
fi

echo ""
echo "Starting backend server..."
echo "Backend will run on http://localhost:3000"
echo ""
npm start