@echo off
setlocal

cd /d "%~dp0"

set "AWS_PROFILE=terraform-admin"
set "AWS_SDK_LOAD_CONFIG=1"

echo Starting learning-service local server...
echo Working directory: %CD%
echo AWS_PROFILE: %AWS_PROFILE%
echo.

where npm >nul 2>&1
if errorlevel 1 (
  echo ERROR: npm was not found in PATH.
  echo Please install Node.js and reopen this script.
  pause
  exit /b 1
)

if not exist ".env" (
  echo WARNING: .env file not found in this folder.
  echo The server may fail if required environment variables are missing.
  echo.
)

call npm run start:local
set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo auth-service process exited with code %EXIT_CODE%.
if not "%EXIT_CODE%"=="0" (
  echo Press any key to close this window.
  pause >nul
)

endlocal & exit /b %EXIT_CODE%
