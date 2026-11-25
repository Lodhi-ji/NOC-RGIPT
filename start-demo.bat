@echo off
title RGIPT NOC Portal - Demo
cd /d "%~dp0"
if not exist backend\.env (
  copy backend\.env.example backend\.env >nul
)
if not exist node_modules (
  echo Installing dependencies, this happens only once...
  call npm run setup
)
start "" http://localhost:5173
call npm run demo
