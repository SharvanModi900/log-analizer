@echo off
title Rust Log Analyzer Installer Creator

echo Creating Rust Log Analyzer Installer...
echo ======================================

REM Create installer directory
mkdir "installer" >nul 2>&1

REM Copy all necessary files to installer directory
echo Copying application files...
xcopy "..\electron" "installer\electron\" /E /I /H /Y >nul 2>&1
xcopy "..\rust" "installer\rust\" /E /I /H /Y >nul 2>&1
copy "..\requirements.txt" "installer\" >nul 2>&1
copy "..\package.json" "installer\" >nul 2>&1
copy "Rust Log Analyzer.exe" "installer\" >nul 2>&1

REM Create installation script
echo Creating installation script...
(
echo @echo off
echo title Rust Log Analyzer Setup
echo echo Installing Rust Log Analyzer...
echo echo ==========================
echo.
echo REM Create installation directory
echo set "INSTALL_DIR=%%ProgramFiles%%\Rust Log Analyzer"
echo mkdir "%%INSTALL_DIR%%" ^>nul 2^>^&1
echo.
echo REM Copy files
echo xcopy "electron" "%%INSTALL_DIR%%\electron\" /E /I /H /Y ^>nul 2^>^&1
echo xcopy "rust" "%%INSTALL_DIR%%\rust\" /E /I /H /Y ^>nul 2^>^&1
echo copy "requirements.txt" "%%INSTALL_DIR%%\" ^>nul 2^>^&1
echo copy "package.json" "%%INSTALL_DIR%%\" ^>nul 2^>^&1
echo copy "Rust Log Analyzer.exe" "%%INSTALL_DIR%%\" ^>nul 2^>^&1
echo.
echo REM Create desktop shortcut
echo echo Set oWS = WScript.CreateObject^("WScript.Shell"^) ^> create_shortcut.vbs
echo echo sLinkFile = oWS.SpecialFolders^("Desktop"^) ^^^& "\Rust Log Analyzer.lnk" ^>^> create_shortcut.vbs
echo echo Set oLink = oWS.CreateShortcut^(sLinkFile^) ^>^> create_shortcut.vbs
echo echo oLink.TargetPath = "%%INSTALL_DIR%%\Rust Log Analyzer.exe" ^>^> create_shortcut.vbs
echo echo oLink.WorkingDirectory = "%%INSTALL_DIR%%" ^>^> create_shortcut.vbs
echo echo oLink.IconLocation = "%%INSTALL_DIR%%\electron\app-icon.ico" ^>^> create_shortcut.vbs
echo echo oLink.Save ^>^> create_shortcut.vbs
echo cscript create_shortcut.vbs ^>nul 2^>^&1
echo del create_shortcut.vbs ^>nul 2^>^&1
echo.
echo echo Setup completed successfully!
echo pause
) > "installer\install.bat"

REM Create uninstall script
echo Creating uninstall script...
(
echo @echo off
echo title Rust Log Analyzer Uninstaller
echo echo Uninstalling Rust Log Analyzer...
echo echo ============================
echo.
echo REM Remove installation directory
echo rd /s /q "%%ProgramFiles%%\Rust Log Analyzer" ^>nul 2^>^&1
echo.
echo REM Remove desktop shortcut
echo del "%%USERPROFILE%%\Desktop\Rust Log Analyzer.lnk" ^>nul 2^>^&1
echo.
echo echo Uninstall completed successfully!
echo pause
) > "installer\uninstall.bat"

echo.
echo Installer package created successfully!
echo.
echo Contents of the installer package:
echo - All application files
echo - Executable launcher (Rust Log Analyzer.exe)
echo - Installation script (install.bat)
echo - Uninstallation script (uninstall.bat)
echo.
pause