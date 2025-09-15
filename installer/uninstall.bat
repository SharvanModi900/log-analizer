@echo off
title Rust Log Analyzer Uninstaller
echo Uninstalling Rust Log Analyzer...
echo ============================

REM Remove installation directory
rd /s /q "%ProgramFiles%\Rust Log Analyzer" >nul 2>&1

REM Remove desktop shortcut
del "%USERPROFILE%\Desktop\Rust Log Analyzer.lnk" >nul 2>&1

echo Uninstall completed successfully!
pause
