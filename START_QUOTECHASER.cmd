@echo off
title QuoteChaser Local Server
cd /d "%~dp0"
echo Stopping any old QuoteChaser server...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do taskkill /PID %%P /F >nul 2>&1
timeout /t 2 /nobreak >nul
echo Clearing old website files...
if exist ".next" rmdir /s /q ".next"
start "" cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000/app?fresh=1"
echo Starting QuoteChaser...
echo.
echo Keep this window open while using the app.
echo Close this window when you are finished.
echo.
echo The newest design will open automatically.
echo.
npm run dev
pause
