@echo off
setlocal

rem --- Preparamos el entorno ---
echo Preparando la instalacion...
set PYTHON_URL=https://www.python.org/ftp/python/3.12.3/python-3.12.3-amd64.exe
set PYTHON_INSTALLER=python-3.12.3-amd64.exe
set PYTHON_PATH=C:\Python\Python312\Scripts
set PATH=%PATH%;%PYTHON_PATH%

rem --- Descargamos el instalador de Python si no existe ---
if not exist "%PYTHON_INSTALLER%" (
    echo Descargando Python...
    powershell -Command "Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_INSTALLER%'"
)

rem --- Instalamos Python en modo silencioso ---
echo Instalando Python. Esto puede tardar unos minutos...
start /wait "" "%PYTHON_INSTALLER%" /quiet InstallAllUsers=1 PrependPath=1

rem --- Verificamos la instalacion de Python ---
echo.
echo Verificando la instalacion de Python...
python --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: No se pudo instalar Python. Por favor, revisa la configuracion.
    echo.
    pause
    exit /b 1
)

rem --- Instalamos las librerias con pip ---
echo.
echo Instalando las librerias necesarias (TestEngine, Pytest, PyVISA, Matplotlib)...
pip install testengine
pip install pytest
pip install pyvisa
pip install matplotlib

echo.
echo La instalacion ha finalizado correctamente.
echo La libreria 'sqlite3' ya viene incluida con Python, por lo que no es necesario instalarla.
echo.
echo Ahora puedes empezar a trabajar en tu proyecto de automatizacion de pruebas.
echo.
pause