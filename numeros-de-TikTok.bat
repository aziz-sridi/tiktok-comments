@echo off
cd /d "%~dp0"
start "" node server.js
timeout /t 3 >nul
start "" http://localhost:8081

