@echo off
title Rust Log Analyzer Uninstallation

echo Rust Log Analyzer Uninstallation
echo ===============================
echo.

echo This will uninstall Rust Log Analyzer from your system.
echo All application data will be removed.
echo.
echo Do you want to continue? (Y/N)
set /p choice=
if /i not "%choice%"=="Y" if /i not "%choice%"=="YES" goto :cancel

REM Remove installation directory
echo Removing application files...
rd /s /q "%ProgramFiles%\Rust Log Analyzer" >nul 2>&1

REM Remove desktop shortcut
echo Removing desktop shortcut...
del "%USERPROFILE%\Desktop\Rust Log Analyzer.lnk" >nul 2>&1

echo.
echo Uninstallation completed successfully!
echo.
echo Rust Log Analyzer has been removed from your system.
echo.
pause
goto :eof

:cancel
echo.
echo Uninstallation cancelled.
echo.
pause