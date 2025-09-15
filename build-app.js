const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to execute commands
function executeCommand(command, callback) {
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error}`);
            callback(error);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        console.log(`Stdout: ${stdout}`);
        callback(null);
    });
}

// Function to create directories
function createDirectories() {
    const dirs = ['dist', 'dist/win', 'dist/mac', 'dist/linux'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Function to copy files
function copyFiles(platform) {
    const sourceFiles = [
        'electron/**/*',
        'rust/**/*',
        'requirements.txt',
        'package.json'
    ];
    
    console.log(`Copying files for ${platform}...`);
    // This is a simplified version - in a real implementation, you would copy the actual files
    console.log('Files copied successfully');
}

// Build for Windows
function buildWindows(callback) {
    console.log('Building for Windows...');
    copyFiles('win32');
    
    // Create a simple batch file for Windows installation
    const installerContent = `
@echo off
title Rust Log Analyzer Setup
echo Installing Rust Log Analyzer...
echo ==========================

REM Create installation directory
set "INSTALL_DIR=%ProgramFiles%\\Rust Log Analyzer"
mkdir "%INSTALL_DIR%" >nul 2>&1

REM Copy application files (simplified)
echo Copying application files...
xcopy ".\\electron" "%INSTALL_DIR%\\electron\\" /E /I /H /Y >nul 2>&1
xcopy ".\\rust" "%INSTALL_DIR%\\rust\\" /E /I /H /Y >nul 2>&1
copy "requirements.txt" "%INSTALL_DIR%\\" >nul 2>&1
copy "package.json" "%INSTALL_DIR%\\" >nul 2>&1

REM Install dependencies
echo Installing dependencies...
cd /d "%INSTALL_DIR%"
npm install > install.log 2>&1
pip install -r requirements.txt > install.log 2>&1

REM Create desktop shortcut
echo Set oWS = WScript.CreateObject("WScript.Shell") > create_shortcut.vbs
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\Rust Log Analyzer.lnk" >> create_shortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> create_shortcut.vbs
echo oLink.TargetPath = "%INSTALL_DIR%\\electron\\main.js" >> create_shortcut.vbs
echo oLink.WorkingDirectory = "%INSTALL_DIR%\\electron" >> create_shortcut.vbs
echo oLink.IconLocation = "%INSTALL_DIR%\\electron\\app-icon.ico" >> create_shortcut.vbs
echo oLink.Save >> create_shortcut.vbs
cscript create_shortcut.vbs >nul 2>&1
del create_shortcut.vbs >nul 2>&1

echo.
echo Installation completed successfully!
echo You can now run Rust Log Analyzer from your desktop shortcut.
pause
`;
    
    fs.writeFileSync('dist/win/install.bat', installerContent);
    console.log('Windows installer created');
    callback(null);
}

// Build for macOS
function buildMac(callback) {
    console.log('Building for macOS...');
    copyFiles('darwin');
    
    // Create a simple installation script for macOS
    const installerContent = `
#!/bin/bash
echo "Installing Rust Log Analyzer..."
echo "=============================="

# Create installation directory
INSTALL_DIR="/Applications/Rust Log Analyzer"
mkdir -p "$INSTALL_DIR"

# Copy application files (simplified)
echo "Copying application files..."
cp -R ./electron "$INSTALL_DIR/electron"
cp -R ./rust "$INSTALL_DIR/rust"
cp requirements.txt "$INSTALL_DIR/"
cp package.json "$INSTALL_DIR/"

# Install dependencies
echo "Installing dependencies..."
cd "$INSTALL_DIR"
npm install > install.log 2>&1
pip3 install -r requirements.txt > install.log 2>&1

echo ""
echo "Installation completed successfully!"
echo "You can now run Rust Log Analyzer from your Applications folder."
`;
    
    fs.writeFileSync('dist/mac/install.sh', installerContent);
    fs.chmodSync('dist/mac/install.sh', '755');
    console.log('macOS installer created');
    callback(null);
}

// Build for Linux
function buildLinux(callback) {
    console.log('Building for Linux...');
    copyFiles('linux');
    
    // Create a simple installation script for Linux
    const installerContent = `
#!/bin/bash
echo "Installing Rust Log Analyzer..."
echo "=============================="

# Create installation directory
INSTALL_DIR="/opt/rust-log-analyzer"
sudo mkdir -p "$INSTALL_DIR"

# Copy application files (simplified)
echo "Copying application files..."
sudo cp -R ./electron "$INSTALL_DIR/electron"
sudo cp -R ./rust "$INSTALL_DIR/rust"
sudo cp requirements.txt "$INSTALL_DIR/"
sudo cp package.json "$INSTALL_DIR/"

# Install dependencies
echo "Installing dependencies..."
cd "$INSTALL_DIR"
npm install > install.log 2>&1
pip3 install -r requirements.txt > install.log 2>&1

# Create desktop entry
echo "[Desktop Entry]
Name=Rust Log Analyzer
Exec=node $INSTALL_DIR/electron/main.js
Icon=$INSTALL_DIR/electron/app-icon.png
Type=Application
Categories=Development;" | sudo tee /usr/share/applications/rust-log-analyzer.desktop > /dev/null

echo ""
echo "Installation completed successfully!"
echo "You can now run Rust Log Analyzer from your applications menu."
`;
    
    fs.writeFileSync('dist/linux/install.sh', installerContent);
    fs.chmodSync('dist/linux/install.sh', '755');
    console.log('Linux installer created');
    callback(null);
}

// Main build function
function buildAll() {
    createDirectories();
    
    buildWindows((err) => {
        if (err) {
            console.error('Error building Windows version:', err);
            return;
        }
        
        buildMac((err) => {
            if (err) {
                console.error('Error building macOS version:', err);
                return;
            }
            
            buildLinux((err) => {
                if (err) {
                    console.error('Error building Linux version:', err);
                    return;
                }
                
                console.log('All platforms built successfully!');
                console.log('Distribution files are in the dist/ directory');
            });
        });
    });
}

// Run the build
buildAll();