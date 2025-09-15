const fs = require('fs');
const path = require('path');

// Simple ICO file structure
function createBasicIco() {
    console.log('Creating a basic ICO file...');
    
    // Create the directory if it doesn't exist
    const icoDir = path.join(__dirname, '..', 'build', 'icons', 'win');
    if (!fs.existsSync(icoDir)) {
        fs.mkdirSync(icoDir, { recursive: true });
    }
    
    // Create a very simple ICO file structure
    // This is a minimal valid ICO file header
    const icoHeader = Buffer.from([
        0x00, 0x00,  // Reserved
        0x01, 0x00,  // ICO type
        0x01, 0x00   // Number of images
    ]);
    
    // Image directory entry (16x16, 32-bit)
    const imageDir = Buffer.from([
        0x10, 0x00,  // Width (16)
        0x10, 0x00,  // Height (16)
        0x00,        // Color palette
        0x00,        // Reserved
        0x01, 0x00,  // Color planes
        0x20, 0x00,  // Bits per pixel (32)
        0x88, 0x00, 0x00, 0x00,  // Image size (136 bytes)
        0x16, 0x00, 0x00, 0x00   // Image offset (22 bytes)
    ]);
    
    // Simple 16x16 bitmap data (all black for simplicity)
    const bitmapData = Buffer.alloc(128, 0x00);
    
    // Combine all parts
    const icoFile = Buffer.concat([icoHeader, imageDir, bitmapData]);
    
    // Write the ICO file
    const icoPath = path.join(icoDir, 'icon.ico');
    fs.writeFileSync(icoPath, icoFile);
    
    console.log('Created basic ICO file at:', icoPath);
    console.log('This is a minimal ICO file that should work in the taskbar.');
    
    return true;
}

try {
    createBasicIco();
    console.log('\nNow test your application with: npm start');
    console.log('The taskbar should show the new icon.');
} catch (error) {
    console.error('Error creating ICO file:', error.message);
    
    // Fallback: Create a more detailed instruction file
    const icoDir = path.join(__dirname, '..', 'build', 'icons', 'win');
    if (!fs.existsSync(icoDir)) {
        fs.mkdirSync(icoDir, { recursive: true });
    }
    
    const instructions = `
TASKBAR ICON CREATION FAILED
============================

To create a proper taskbar icon, please follow these steps:

1. ONLINE CONVERSION (RECOMMENDED):
   a. Go to https://convertICO.com
   b. Upload your icon.svg file
   c. Download the ICO file
   d. Save as: build/icons/win/icon.ico

2. ALTERNATIVE METHOD:
   a. Open icon.svg in a browser
   b. Take a screenshot (16x16 or 32x32)
   c. Convert to ICO using https://online-converter.com/ico
   d. Save as: build/icons/win/icon.ico

3. TEST THE ICON:
   a. Run: npm start
   b. Check the taskbar for your new icon

The new icon design without text will appear larger and cleaner in the taskbar.
`;
    
    const icoPath = path.join(icoDir, 'icon.ico');
    fs.writeFileSync(icoPath, instructions);
    
    console.log('Created detailed instructions at:', icoPath);
}