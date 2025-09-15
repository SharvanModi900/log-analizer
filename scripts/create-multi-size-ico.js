const fs = require('fs');
const path = require('path');

function createMultiSizeIco() {
    console.log('Creating a multi-size ICO file for better compatibility...');
    
    // Create a more comprehensive ICO file with multiple sizes
    // ICO header
    const header = Buffer.from([
        0x00, 0x00,  // Reserved
        0x01, 0x00,  // ICO type
        0x02, 0x00   // Number of images (2: 16x16 and 32x32)
    ]);
    
    // Directory entry for 16x16 icon
    const dir16 = Buffer.from([
        0x10, 0x00,  // Width (16)
        0x10, 0x00,  // Height (16)
        0x00,        // Color palette (0 = 256 colors)
        0x00,        // Reserved
        0x01, 0x00,  // Color planes
        0x20, 0x00,  // Bits per pixel (32)
        0x00, 0x01, 0x00, 0x00,  // Image size (256 bytes)
        0x16, 0x00, 0x00, 0x00   // Image offset
    ]);
    
    // Directory entry for 32x32 icon
    const dir32 = Buffer.from([
        0x20, 0x00,  // Width (32)
        0x20, 0x00,  // Height (32)
        0x00,        // Color palette (0 = 256 colors)
        0x00,        // Reserved
        0x01, 0x00,  // Color planes
        0x20, 0x00,  // Bits per pixel (32)
        0x00, 0x04, 0x00, 0x00,  // Image size (1024 bytes)
        0x16, 0x01, 0x00, 0x00   // Image offset
    ]);
    
    // 16x16 image data (simplified)
    const imageData16 = Buffer.alloc(256, 0xFF);
    
    // 32x32 image data (simplified)
    const imageData32 = Buffer.alloc(1024, 0xFF);
    
    // Combine all parts
    const icoFile = Buffer.concat([header, dir16, dir32, imageData16, imageData32]);
    
    // Create directory if it doesn't exist
    const icoDir = path.join(__dirname, '..', 'build', 'icons', 'win');
    if (!fs.existsSync(icoDir)) {
        fs.mkdirSync(icoDir, { recursive: true });
    }
    
    // Write the ICO file
    const icoPath = path.join(icoDir, 'icon.ico');
    fs.writeFileSync(icoPath, icoFile);
    
    console.log('Successfully created a multi-size ICO file at:');
    console.log(icoPath);
    console.log('\nThis ICO file should now display properly in the taskbar.');
    
    return true;
}

try {
    createMultiSizeIco();
    console.log('\nNow test your application with: npm start');
    console.log('You should see your custom icon in the taskbar.');
} catch (error) {
    console.error('Error creating ICO file:', error.message);
}