@echo off
REM Navigate to the batch file's location, switch drives if necessary
cd /d "%~dp0"
if not exist node_modules call npm install
node main.js