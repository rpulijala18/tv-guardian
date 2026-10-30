@echo off
title TV Guardian - Parental Control Server
color 0b
echo ========================================================
echo        TV GUARDIAN - SMART TV PARENTAL CONTROL          
echo        "Smart Screen Time. Safer Childhood."            
echo ========================================================
echo.
echo Starting TV Guardian local server on http://localhost:5173/ ...
echo.
start http://localhost:5173/
node "%~dp0start-server.js"
pause

