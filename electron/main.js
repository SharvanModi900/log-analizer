const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Simple logging utility
const Logger = {
    log: function(message) {
        console.log(`[LogAnalyzer-Main] ${new Date().toISOString()}: ${message}`);
    },
    error: function(message) {
        console.error(`[LogAnalyzer-Main] ${new Date().toISOString()}: ${message}`);
    },
    warn: function(message) {
        console.warn(`[LogAnalyzer-Main] ${new Date().toISOString()}: ${message}`);
    }
};

// Store the paths to the uploaded files
let uploadedFiles = {
  jsonPath: null,
  baseLogPath: null,
  beforeLogPath: null,
  afterLogPath: null
};

Logger.log('Application starting');

const createWindow = () => {
  Logger.log('Creating main window');
  // Create the browser window with premium dimensions
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    // Add frameless window with custom title bar for premium look
    frame: true,
    // Add vibrancy effect for macOS (if needed)
    // vibrancy: 'sidebar',
    // Add rounded corners and shadow
    hasShadow: true,
    transparent: false,
    backgroundColor: '#ffffff'
  });

  // and load the index.html of the app.
  Logger.log('Loading index.html');
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools for debugging
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Logger.log('Application ready');
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  Logger.log('All windows closed');
  if (process.platform !== 'darwin') {
    Logger.log('Quitting application');
    app.quit();
  }
});

app.on('activate', () => {
  Logger.log('Application activated');
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle multiple files selection
ipcMain.handle('select-files', async () => {
  Logger.log('Handling multiple files selection');
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'All Required Files', extensions: ['json', 'log'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'Log Files', extensions: ['log'] }
    ]
  });
  
  if (result.canceled) {
    Logger.warn('Files selection cancelled by user');
    return { success: false, error: 'User cancelled file selection' };
  }
  
  Logger.log(`Files selected: ${result.filePaths.length} files`);
  
  // Identify and store file paths without resetting previously selected files
  for (const filePath of result.filePaths) {
    const fileName = path.basename(filePath).toLowerCase();
    Logger.log(`Processing file: ${fileName}`);
    
    if (fileName.endsWith('.json')) {
      uploadedFiles.jsonPath = filePath;
      Logger.log(`Identified JSON file: ${filePath}`);
    } else if (fileName.endsWith('_base.log')) {
      uploadedFiles.baseLogPath = filePath;
      Logger.log(`Identified Base Log file: ${filePath}`);
    } else if (fileName.endsWith('_before.log')) {
      uploadedFiles.beforeLogPath = filePath;
      Logger.log(`Identified Before Log file: ${filePath}`);
    } else if (fileName.endsWith('_after.log')) {
      uploadedFiles.afterLogPath = filePath;
      Logger.log(`Identified After Log file: ${filePath}`);
    }
  }
  
  return { 
    success: true, 
    files: {
      json: uploadedFiles.jsonPath,
      base: uploadedFiles.baseLogPath,
      before: uploadedFiles.beforeLogPath,
      after: uploadedFiles.afterLogPath
    }
  };
});

// Handle analysis
ipcMain.handle('analyze-files', async () => {
  Logger.log('Handling file analysis request');
  if (!uploadedFiles.jsonPath) {
    Logger.warn('Analysis requested without JSON file');
    return { success: false, error: 'Please upload a JSON file' };
  }
  
  if (!uploadedFiles.baseLogPath) {
    Logger.warn('Analysis requested without Base Log file');
    return { success: false, error: 'Please upload the _base.log file' };
  }
  
  if (!uploadedFiles.beforeLogPath) {
    Logger.warn('Analysis requested without Before Log file');
    return { success: false, error: 'Please upload the _before.log file' };
  }
  
  if (!uploadedFiles.afterLogPath) {
    Logger.warn('Analysis requested without After Log file');
    return { success: false, error: 'Please upload the _after.log file' };
  }
  
  try {
    Logger.log('Starting log analysis');
    const analysisResult = await analyzeLogs(uploadedFiles);
    // Reset file paths after analysis
    Logger.log('Analysis completed, resetting file paths');
    uploadedFiles.jsonPath = null;
    uploadedFiles.baseLogPath = null;
    uploadedFiles.beforeLogPath = null;
    uploadedFiles.afterLogPath = null;
    return { success: true, data: analysisResult };
  } catch (error) {
    Logger.error(`Analysis failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Function to analyze logs from individual files
async function analyzeLogs(files) {
  Logger.log(`Analyzing logs from individual files`);
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary directory for extraction
      const tempDir = path.join(app.getPath('temp'), 'log-analyzer-' + Date.now());
      Logger.log(`Creating temporary directory: ${tempDir}`);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create a logs subdirectory
      const logsDir = path.join(tempDir, 'logs');
      Logger.log(`Creating logs directory: ${logsDir}`);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Copy the JSON file to the logs directory
      const jsonFileName = path.basename(files.jsonPath);
      const destJsonPath = path.join(logsDir, jsonFileName);
      Logger.log(`Copying JSON file from ${files.jsonPath} to ${destJsonPath}`);
      fs.copyFileSync(files.jsonPath, destJsonPath);

      // Copy the log files to the logs directory with appropriate names
      const baseLogFileName = path.basename(files.baseLogPath);
      const beforeLogFileName = path.basename(files.beforeLogPath);
      const afterLogFileName = path.basename(files.afterLogPath);
      
      const destBaseLogPath = path.join(logsDir, baseLogFileName);
      const destBeforeLogPath = path.join(logsDir, beforeLogFileName);
      const destAfterLogPath = path.join(logsDir, afterLogFileName);
      
      Logger.log(`Copying log files to logs directory`);
      fs.copyFileSync(files.baseLogPath, destBaseLogPath);
      fs.copyFileSync(files.beforeLogPath, destBeforeLogPath);
      fs.copyFileSync(files.afterLogPath, destAfterLogPath);

      // Run the Python analysis script
      const pythonScript = path.join(__dirname, 'log_analyzer.py');
      Logger.log(`Running Python script: ${pythonScript} with directory: ${tempDir}`);
      const pythonProcess = spawn('python', [pythonScript, tempDir]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        Logger.log(`Python stdout: ${data.toString()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        Logger.warn(`Python stderr: ${data.toString()}`);
      });

      pythonProcess.on('close', (code) => {
        Logger.log(`Python process exited with code: ${code}`);
        // Clean up temporary files
        try {
          Logger.log(`Cleaning up temporary directory: ${tempDir}`);
          fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (err) {
          Logger.warn(`Could not clean up temporary directory: ${err}`);
        }

        if (code !== 0) {
          const errorMsg = `Python script exited with code ${code}: ${stderr}`;
          Logger.error(errorMsg);
          reject(new Error(errorMsg));
          return;
        }

        try {
          Logger.log('Parsing Python output');
          const result = JSON.parse(stdout);
          Logger.log('Python output parsed successfully');
          resolve(result);
        } catch (err) {
          const errorMsg = `Failed to parse Python output: ${err.message}\nOutput: ${stdout}`;
          Logger.error(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    } catch (error) {
      Logger.error(`Exception in analyzeLogs: ${error.message}`);
      reject(error);
    }
  });
}