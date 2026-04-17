@echo off
title INICIANDO PROJETO

echo ===============================
echo INICIANDO NEXT.JS
echo ===============================

start cmd /k "cd /d C:\Users\ALVES\Desktop\asas && npm run dev"

timeout /t 5

echo ===============================
echo INICIANDO NGROK
echo ===============================

start cmd /k "ngrok http 3000"

echo ===============================
echo TUDO INICIADO
echo ===============================

pause