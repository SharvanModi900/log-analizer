@echo off
title Rust Log Analyzer Setup
echo Installing Rust Log Analyzer...
echo ==========================

REM Create installation directory
set "INSTALL_DIR=%ProgramFiles%\Rust Log Analyzer"
mkdir "%INSTALL_DIR%" >nul 2>&1

REM Copy files
xcopy "electron" "%INSTALL_DIR%\electron\" /E /I /H /Y >nul 2>&1
xcopy "rust" "%INSTALL_DIR%\rust\" /E /I /H /Y >nul 2>&1
copy "requirements.txt" "%INSTALL_DIR%\" >nul 2>&1
copy "package.json" "%INSTALL_DIR%\" >nul 2>&1
copy "Rust Log Analyzer.exe" "%INSTALL_DIR%\" >nul 2>&1

REM Create desktop shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > create_shortcut.vbs
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Rust Log Analyzer.lnk" >> create_shortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> create_shortcut.vbs
echo oLink.TargetPath = "%INSTALL_DIR%\Rust Log Analyzer.exe" >> create_shortcut.vbs
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> create_shortcut.vbs
echo oLink.IconLocation = "%INSTALL_DIR%\electron\app-icon.ico" >> create_shortcut.vbs
echo oLink.Save >> create_shortcut.vbs
cscript create_shortcut.vbs >nul 2>&1
del create_shortcut.vbs >nul 2>&1

echo Setup completed successfully!
pause
