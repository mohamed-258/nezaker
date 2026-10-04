@echo off
title Nezaker - Medical AI Desktop Application
cd /d "%~dp0nezaker"

set PYTHON_EXE=
if exist "..\.venv\Scripts\python.exe" (
    set "PYTHON_EXE=..\.venv\Scripts\python.exe"
) else if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo Starting Nezaker Desktop Application...
"%PYTHON_EXE%" app.py
