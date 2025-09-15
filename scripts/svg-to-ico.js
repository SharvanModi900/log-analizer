const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { createICO } = require('icojs');

// Function to convert SVG to PNG and then to ICO
async function svgToIco() {
  try {
    // Read the SVG file
    const svgPath = path.join(__dirname, '..', 'icon.svg');
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    console.log('SVG content read successfully');
    
    // For now, we'll use the electron-icon-builder since it's already in the project
    // This is a simpler approach that should work
    const { execSync } = require('child_process');
    
    // Run the electron-icon-builder command
    execSync('npx electron-icon-builder --input=./icon.svg --output=./build/icons', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    
    console.log('Icons generated successfully');
    
    // Copy the generated ICO file to the correct location
    const sourceIco = path.join(__dirname, '..', 'build', 'icons', 'icons', 'win', 'icon.ico');
    const destIco = path.join(__dirname, '..', 'build', 'icons', 'win', 'icon.ico');
    
    // Ensure destination directory exists
    const destDir = path.dirname(destIco);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourceIco, destIco);
    console.log('ICO file copied to:', destIco);
    
  } catch (error) {
    console.error('Error converting SVG to ICO:', error.message);
  }
}

svgToIco();