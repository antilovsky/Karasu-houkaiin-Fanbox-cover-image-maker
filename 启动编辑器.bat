@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "PORT=8765"

where py >nul 2>nul
if not errorlevel 1 (
  set "PY=py -3"
  goto :start_server
)

where python >nul 2>nul
if not errorlevel 1 (
  set "PY=python"
  goto :start_server
)

echo.
echo [Karasu Houkaiin] 未找到 Python 3。
echo 请先安装 Python 3，或在本目录运行任意静态文件服务器后打开 index.html。
echo.
pause
exit /b 1

:start_server
echo.
echo  KARASU HOUKAIIN · QUICK IMAGE LAB
echo  -------------------------------------
echo  本地服务: http://127.0.0.1:%PORT%/
echo  关闭此窗口即可停止服务。
echo.

start "" /b %PY% -m http.server %PORT% --bind 127.0.0.1
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"

pause >nul
endlocal
