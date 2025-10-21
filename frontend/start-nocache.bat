@echo off
echo Iniciando servidor frontend SIN cache...
http-server -p 3000 --cors -c-1 -a 0.0.0.0
pause