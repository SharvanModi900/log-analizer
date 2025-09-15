@echo off
echo Packaging Rust Log Analyzer Application...
echo ========================================

REM Create directory structure
echo Creating directory structure...
mkdir "Rust Log Analyzer" >nul 2>&1
cd "Rust Log Analyzer"

REM Copy Electron files
echo Copying Electron application files...
xcopy "..\electron" "electron\" /E /I /H /Y >nul 2>&1

REM Copy Rust files
echo Copying Rust analysis files...
xcopy "..\rust" "rust\" /E /I /H /Y >nul 2>&1

REM Copy other necessary files
echo Copying configuration files...
copy "..\requirements.txt" "." >nul 2>&1
copy "..\package.json" "." >nul 2>&1

REM Create a simple launcher script
echo Creating launcher script...
echo @echo off > "Rust Log Analyzer.bat"
echo cd /d "%%~dp0" >> "Rust Log Analyzer.bat"
echo npm start >> "Rust Log Analyzer.bat"

echo.
echo Packaging complete!
echo.
echo To run the application:
echo 1. Extract this package to a folder
echo 2. Install Node.js and Python if not already installed
echo 3. Run "npm install" in the extracted folder
echo 4. Run "pip install -r requirements.txt"
echo 5. Double-click "Rust Log Analyzer.bat" to start the application
echo.
pause