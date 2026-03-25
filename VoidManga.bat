@echo off
REM Navigate to the batch file's location, switch drives if necessary
cd /d "%~dp0"
npm install --silent && node main.js