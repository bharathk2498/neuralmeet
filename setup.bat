@echo off
echo NeuralMeet Backend Setup
echo ========================
echo.

cd backend

echo Installing dependencies...
call npm install

echo.
echo Checking API key configuration...
findstr /C:"DID_API_KEY" .env >nul
if %errorlevel% equ 0 (
    echo [OK] API key configured in .env
) else (
    echo [ERROR] API key not found in .env
    exit /b 1
)

echo.
echo Starting backend server...
echo Backend will run on http://localhost:3000
echo.
call npm start