@echo off
title Rust Log Analyzer Installation

echo Rust Log Analyzer Installation
echo =============================
echo.

REM Check if Node.js is installed
echo Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed.
    echo Please download and install Node.js from https://nodejs.org/
    echo Then run this installation again.
    pause
    exit /b 1
)

REM Check if Python is installed
echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed.
    echo Please download and install Python from https://www.python.org/
    echo Then run this installation again.
    pause
    exit /b 1
)

REM Create installation directory
echo Creating installation directory...
set "INSTALL_DIR=%ProgramFiles%\Rust Log Analyzer"
mkdir "%INSTALL_DIR%" >nul 2>&1

REM Copy application files
echo Copying application files...
xcopy "electron" "%INSTALL_DIR%\electron\" /E /I /H /Y >nul 2>&1
xcopy "rust" "%INSTALL_DIR%\rust\" /E /I /H /Y >nul 2>&1
copy "requirements.txt" "%INSTALL_DIR%\" >nul 2>&1
copy "package.json" "%INSTALL_DIR%\" >nul 2>&1
copy "Rust Log Analyzer.exe" "%INSTALL_DIR%\" >nul 2>&1

REM Install Node.js dependencies
echo Installing Node.js dependencies...
cd /d "%INSTALL_DIR%"
npm install > install.log 2>&1

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt > install.log 2>&1

REM Create desktop shortcut
echo Creating desktop shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > create_shortcut.vbs
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Rust Log Analyzer.lnk" >> create_shortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> create_shortcut.vbs
echo oLink.TargetPath = "%INSTALL_DIR%\Rust Log Analyzer.exe" >> create_shortcut.vbs
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> create_shortcut.vbs
echo oLink.IconLocation = "%INSTALL_DIR%\electron\app-icon.ico" >> create_shortcut.vbs
echo oLink.Save >> create_shortcut.vbs
cscript create_shortcut.vbs >nul 2>&1
del create_shortcut.vbs >nul 2>&1

echo.
echo Installation completed successfully!
echo.
echo You can now run Rust Log Analyzer from your desktop shortcut.
echo.
pause