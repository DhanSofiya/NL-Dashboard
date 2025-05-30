@echo off
:: Load environment variable from .env
for /f "delims=" %%i in ('findstr "MONGO_URI=" .env') do set "%%i"

:: Get date in YYYY-MM-DD format
for /f %%a in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set DATE=%%a

:: Set output directory
set OUT_DIR=backups\backup-%DATE%

:: Create directory
mkdir %OUT_DIR%

:: Run mongodump
mongodump --uri="%MONGO_URI%" --out="%OUT_DIR%"

echo Backup completed: %OUT_DIR%
pause
