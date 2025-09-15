const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'build/icons/win/icon.ico')
  });
  
  console.log('Icon path:', path.join(__dirname, 'build/icons/win/icon.ico'));
  console.log('Icon exists:', require('fs').existsSync(path.join(__dirname, 'build/icons/win/icon.ico')));
  
  // Try to load a simple HTML file or create one if it doesn't exist
  const fs = require('fs');
  const htmlPath = path.join(__dirname, 'electron/index.html');
  if (!fs.existsSync(htmlPath)) {
    fs.writeFileSync(htmlPath, '<h1>Test Window</h1>');
  }
  win.loadFile('electron/index.html');
});