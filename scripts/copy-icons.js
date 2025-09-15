const fs = require('fs');
const path = require('path');

// Create necessary directories
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

// Copy icons to correct locations
try {
  // Windows ICO file
  fs.copyFileSync(
    path.join(__dirname, '..', 'build', 'icons', 'icons', 'win', 'icon.ico'),
    path.join(__dirname, '..', 'build', 'icons', 'win', 'icon.ico')
  );
  
  // macOS ICNS file
  fs.copyFileSync(
    path.join(__dirname, '..', 'build', 'icons', 'icons', 'mac', 'icon.icns'),
    path.join(__dirname, '..', 'build', 'icons', 'mac', 'icon.icns')
  );
  
  // Linux PNG file (largest size)
  fs.copyFileSync(
    path.join(__dirname, '..', 'build', 'icons', 'icons', 'png', '1024x1024.png'),
    path.join(__dirname, '..', 'build', 'icons', 'png', '1024x1024.png')
  );
  
  console.log('Icons copied successfully!');
} catch (error) {
  console.error('Error copying icons:', error.message);
}