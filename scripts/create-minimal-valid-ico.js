const fs = require('fs');
const path = require('path');

function createMinimalValidIco() {
    console.log('Creating a minimal but valid ICO file...');
    
    // Create a simple but valid ICO file with a basic icon
    // This creates a 16x16 1-bit icon with a simple pattern
    
    // ICO file header (6 bytes)
    const header = Buffer.from([
        0x00, 0x00,  // Reserved
        0x01, 0x00,  // ICO type
        0x01, 0x00   // Number of images
    ]);
    
    // Directory entry (16 bytes)
    const dirEntry = Buffer.from([
        0x10, 0x00,  // Width (16)
        0x10, 0x00,  // Height (16)
        0x02,        // Color palette (2 colors)
        0x00,        // Reserved
        0x01, 0x00,  // Color planes
        0x01, 0x00,  // Bits per pixel
        0x46, 0x00, 0x00, 0x00,  // Image size (70 bytes)
        0x16, 0x00, 0x00, 0x00   // Image offset (22 bytes)
    ]);
    
    // Color palette (8 bytes for 2 colors: black and white)
    const palette = Buffer.from([
        0x00, 0x00, 0x00, 0x00,  // Black
        0xFF, 0xFF, 0xFF, 0x00   // White
    ]);
    
    // XOR bitmap data (32 bytes for 16x16 1-bit)
    // This creates a simple pattern that will be visible in the taskbar
    const xorData = Buffer.from([
        0xFF, 0xFF, 0xFF, 0xFF,  // Row 1
        0xC0, 0x00, 0x00, 0x03,  // Row 2
        0xC0, 0x00, 0x00, 0x03,  // Row 3
        0xC0, 0x00, 0x00, 0x03,  // Row 4
        0xC0, 0x00, 0x00, 0x03,  // Row 5
        0xC0, 0x00, 0x00, 0x03,  // Row 6
        0xC0, 0x00, 0x00, 0x03,  // Row 7
        0xFF, 0xFF, 0xFF, 0xFF   // Row 8
    ]);
    
    // AND bitmap mask (32 bytes for 16x16 1-bit)
    const andData = Buffer.from([
        0x00, 0x00, 0x00, 0x00,  // Row 1
        0x3F, 0xFF, 0xFF, 0xFC,  // Row 2
        0x3F, 0xFF, 0xFF, 0xFC,  // Row 3
        0x3F, 0xFF, 0xFF, 0xFC,  // Row 4
        0x3F, 0xFF, 0xFF, 0xFC,  // Row 5
        0x3F, 0xFF, 0xFF, 0xFC,  // Row 6
        0x3F, 0xFF, 0xFF, 0xFC,  // Row 7
        0x00, 0x00, 0x00, 0x00   // Row 8
    ]);
    
    // Combine all parts
    const icoFile = Buffer.concat([header, dirEntry, palette, xorData, andData]);
    
    // Create directory if it doesn't exist
    const icoDir = path.join(__dirname, '..', 'build', 'icons', 'win');
    if (!fs.existsSync(icoDir)) {
        fs.mkdirSync(icoDir, { recursive: true });
    }
    
    // Write the ICO file
    const icoPath = path.join(icoDir, 'icon.ico');
    fs.writeFileSync(icoPath, icoFile);
    
    console.log('Successfully created a minimal valid ICO file at:');
    console.log(icoPath);
    console.log('\nThis ICO file should now display in the taskbar.');
    console.log('However, for a better looking icon, follow the guide in CUSTOM_ICON_GUIDE.txt');
    console.log('to create a proper ICO from your SVG design.');
    
    return true;
}

try {
    createMinimalValidIco();
    console.log('\nNow test your application with: npm start');
    console.log('You should see a simple icon in the taskbar.');
} catch (error) {
    console.error('Error creating ICO file:', error.message);
}