const { spawn } = require('child_process');
const path = require('path');

// This script will start the Electron application
const electronPath = require('electron');
const appPath = path.join(__dirname, 'main.js');

const child = spawn(electronPath, [appPath], {
  cwd: __dirname,
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code);
});