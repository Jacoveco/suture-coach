@echo off
setlocal enabledelayedexpansion
echo Looking for Suture Coach running on port 3000...

set FOUND=0
set KILLED_PIDS=,
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
  echo !KILLED_PIDS! | findstr /c:",%%p," >nul
  if errorlevel 1 (
    set FOUND=1
    set KILLED_PIDS=!KILLED_PIDS!%%p,
    echo Stopping process %%p ...
    taskkill /F /PID %%p >nul 2>&1
  )
)

if "%FOUND%"=="0" (
  echo Nothing is running on port 3000 - it's already off.
) else (
  echo Done. Suture Coach is now off.
)

pause
