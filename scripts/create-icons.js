const fs = require('fs');
const path = require('path');

// Simple script to organize the existing icons
function organizeIcons() {
  try {
    // Ensure directories exist
    const dirs = [
      'build/icons/win',
      'build/icons/mac',
      'build/icons/png'
    ];
    
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    
    // Since we're having issues with automatic conversion,
    // let's use the existing icon.png file which should be updated
    // when we save the SVG in an image editor
    
    console.log('Icon organization complete!');
    console.log('To update icons:');
    console.log('1. Open icon.svg in an image editor and export as icon.png');
    console.log('2. Run: npm run build-icons');
    
  } catch (error) {
    console.error('Error organizing icons:', error.message);
  }
}

organizeIcons();