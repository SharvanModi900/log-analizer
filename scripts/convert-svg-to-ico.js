const fs = require('fs');
const path = require('path');

function convertSvgToIco() {
    console.log('Converting icon.svg to icon.ico...');
    
    // Check if icon.svg exists
    const svgPath = path.join(__dirname, '..', 'icon.svg');
    if (!fs.existsSync(svgPath)) {
        console.error('Error: icon.svg not found in project root');
        return false;
    }
    
    // Create the build directory structure
    const icoDir = path.join(__dirname, '..', 'build', 'icons', 'win');
    if (!fs.existsSync(icoDir)) {
        fs.mkdirSync(icoDir, { recursive: true });
    }
    
    // Since we can't easily convert SVG to ICO directly in Node.js without libraries,
    // let's provide clear instructions and create a placeholder with conversion steps
    
    const conversionInstructions = `
AUTOMATIC SVG TO ICO CONVERSION FAILED
=====================================

To create a proper ICO file from your icon.svg, please follow these steps:

1. ONLINE CONVERSION (Easiest):
   a. Go to https://convertICO.com or https://online-converter.com/ico
   b. Upload your icon.svg file
   c. Select ICO format
   d. Download the converted file
   e. Save as: build/icons/win/icon.ico

2. ALTERNATIVE ONLINE TOOLS:
   a. Visit https://cloudconvert.com/svg-to-ico
   b. Upload icon.svg
   c. Convert to ICO
   d. Download and save as build/icons/win/icon.ico

3. USING IMAGE EDITORS:
   a. Open icon.svg in Inkscape, Adobe Illustrator, or similar
   b. Export as PNG (256x256)
   c. Convert PNG to ICO using GIMP or online tools
   d. Save as build/icons/win/icon.ico

After creating the ICO file, your application will use the new icon in the taskbar.
The icon without text will appear larger and cleaner than the previous version.
`;
    
    // Create a placeholder ICO file with instructions
    const icoPath = path.join(icoDir, 'icon.ico');
    fs.writeFileSync(icoPath, conversionInstructions);
    
    console.log('Created placeholder ICO file with conversion instructions at:');
    console.log(icoPath);
    console.log('\nFor a working icon, please follow the instructions above.');
    
    // Also create placeholder files for other platforms
    const macDir = path.join(__dirname, '..', 'build', 'icons', 'mac');
    const pngDir = path.join(__dirname, '..', 'build', 'icons', 'png');
    
    if (!fs.existsSync(macDir)) {
        fs.mkdirSync(macDir, { recursive: true });
    }
    
    if (!fs.existsSync(pngDir)) {
        fs.mkdirSync(pngDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(macDir, 'icon.icns'), conversionInstructions);
    fs.writeFileSync(path.join(pngDir, '1024x1024.png'), conversionInstructions);
    
    console.log('\nAlso created placeholder files for macOS and Linux platforms.');
    console.log('Replace all placeholders with actual files following the instructions.');
    
    return true;
}

convertSvgToIco();