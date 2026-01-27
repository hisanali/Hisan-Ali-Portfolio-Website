@echo off
echo Starting local web server on http://localhost:8000
echo.
echo Open your browser and go to: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
cd /d "%~dp0"
npx http-server -p 8000 -c-1
