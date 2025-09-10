@echo off
REM -----------------------------------------------------------------
REM Script para crear la estructura de directorios para test-automation
REM -----------------------------------------------------------------

echo Creando la estructura de directorios para 'test-automation'...
echo.

REM --- Crea el directorio raíz ---
mkdir test-automation
cd test-automation

REM --- Crea la estructura de backend ---
echo Creando directorios de backend...
mkdir backend
mkdir backend\api
mkdir backend\hardware
mkdir backend\test_engine
mkdir backend\models
mkdir backend\config

REM --- Crea la estructura de frontend ---
echo Creando directorios de frontend...
mkdir frontend
mkdir frontend\src
mkdir frontend\src\components
mkdir frontend\src\pages
mkdir frontend\src\services

REM --- Crea la estructura de tests ---
echo Creando directorios de tests...
mkdir tests
mkdir tests\sequences
mkdir tests\configs

echo.
echo Estructura de directorios creada exitosamente.
echo.

REM --- Muestra el árbol de directorios creado ---
tree /F

echo.
pause