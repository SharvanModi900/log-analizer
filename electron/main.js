const { app, BrowserWindow, ipcMain, dialog, nativeImage, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const AdmZip = require('adm-zip'); // Add ZIP handling

// Set the app icon as early as possible
if (process.platform === 'win32') {
  const iconPath = path.resolve(__dirname, 'app-icon.ico');
  if (fs.existsSync(iconPath)) {
    app.setAppUserModelId('com.loganalyzer.rust');
  }
}

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

// Global reference to the splash window
let splashWindow;
let mainWindow;

const createSplashWindow = () => {
  Logger.log('Creating splash window');
  
  // Get screen dimensions
  const mainScreen = screen.getPrimaryDisplay();
  const dimensions = mainScreen.size;
  
  splashWindow = new BrowserWindow({
    width: 500,
    height: 400,
    x: (dimensions.width - 500) / 2,
    y: (dimensions.height - 400) / 2,
    transparent: false,
    frame: false,
    resizable: false,
    movable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0f172a'
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  
  // Prevent splash window from being closed by user
  splashWindow.on('close', (event) => {
    if (mainWindow) {
      splashWindow = null;
    } else {
      event.preventDefault();
    }
  });
};

const createMainWindow = () => {
  Logger.log('Creating main window');
  
  // Define the icon path - using our custom icon
  const iconPath = path.resolve(__dirname, 'app-icon.ico');
  Logger.log(`Icon path: ${iconPath}`);
  Logger.log(`Icon exists: ${fs.existsSync(iconPath)}`);
  
  // Load the icon
  let appIcon = null;
  if (fs.existsSync(iconPath)) {
    try {
      appIcon = nativeImage.createFromPath(iconPath);
      Logger.log(`Icon loaded successfully. Size: ${appIcon.getSize().width}x${appIcon.getSize().height}`);
    } catch (error) {
      Logger.error(`Failed to load icon: ${error.message}`);
    }
  } else {
    Logger.warn('Custom icon file not found, falling back to default');
  }
  
  // Create the browser window with premium dimensions
  mainWindow = new BrowserWindow({
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
    backgroundColor: '#0f172a',
    // Set the icon for the application window
    icon: appIcon || iconPath,
    show: false // Don't show the main window immediately
  });

  // Remove the default menu bar
  mainWindow.setMenuBarVisibility(false);
  Menu.setApplicationMenu(null);

  // and load the index.html of the app.
  Logger.log('Loading index.html');
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show main window when it's ready
  mainWindow.once('ready-to-show', () => {
    Logger.log('Main window ready to show');
    // Close splash screen
    if (splashWindow) {
      Logger.log('Closing splash window');
      splashWindow.destroy(); // Use destroy instead of close for immediate removal
      splashWindow = null;
    }
    
    // Show main window
    Logger.log('Showing main window');
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle main window close
  mainWindow.on('closed', () => {
    Logger.log('Main window closed');
    mainWindow = null;
  });

  // Open the DevTools for debugging
  // mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  Logger.log('Application ready');
  
  // Set the app icon for Windows
  if (process.platform === 'win32') {
    const iconPath = path.resolve(__dirname, 'app-icon.ico');
    if (fs.existsSync(iconPath)) {
      app.setAppUserModelId('com.loganalyzer.rust');
      // Set the icon for the taskbar and Start Menu
    }
  }
  
  // Create splash screen first
  createSplashWindow();
  
  // Create main window after a short delay to show splash screen
  setTimeout(() => {
    createMainWindow();
  }, 2000); // Show splash for at least 2 seconds
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  Logger.log('All windows closed');
  // Only quit if the main window was closed, not just the splash screen
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
    createSplashWindow();
    setTimeout(() => {
      createMainWindow();
    }, 2000);
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
  
  // Process selected files and update uploadedFiles (allow partial selection)
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
  
  // Return the newly selected files (not requiring all files to be present)
  Logger.log(`File selection processed. JSON: ${!!uploadedFiles.jsonPath}, Base: ${!!uploadedFiles.baseLogPath}, Before: ${!!uploadedFiles.beforeLogPath}, After: ${!!uploadedFiles.afterLogPath}`);
  
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

// Handle ZIP file selection and extraction
ipcMain.handle('select-zip', async (event, zipPath = null) => {
  Logger.log('Handling ZIP file selection');
  
  let selectedZipPath = zipPath;
  
  // If no zipPath provided, show file dialog
  if (!selectedZipPath) {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'ZIP Files', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      Logger.warn('ZIP selection cancelled by user');
      return { success: false, error: 'User cancelled ZIP selection' };
    }
    
    selectedZipPath = result.filePaths[0];
  }
  
  Logger.log(`Processing ZIP file: ${selectedZipPath}`);
  
  try {
    // Verify the file exists and is a ZIP file
    if (!fs.existsSync(selectedZipPath)) {
      return { success: false, error: 'ZIP file not found' };
    }
    
    if (!selectedZipPath.toLowerCase().endsWith('.zip')) {
      return { success: false, error: 'Selected file is not a ZIP file' };
    }
    
    // Create a temporary directory for extraction
    const tempDir = path.join(app.getPath('temp'), 'log-analyzer-zip-' + Date.now());
    Logger.log(`Creating temporary directory for ZIP extraction: ${tempDir}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Extract the ZIP file
    Logger.log('Extracting ZIP file');
    const zip = new AdmZip(selectedZipPath);
    zip.extractAllTo(tempDir, true); // true to overwrite existing files
    
    // Find the required files in the extracted directory
    const extractedFiles = findRequiredFiles(tempDir);
    
    if (!extractedFiles.json || !extractedFiles.base || !extractedFiles.before || !extractedFiles.after) {
      Logger.warn('Not all required files found in ZIP');
      // Clean up temporary directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (err) {
        Logger.warn(`Could not clean up temporary directory: ${err}`);
      }
      return { success: false, error: 'ZIP file must contain all required files: JSON, _base.log, _before.log, _after.log' };
    }
    
    // Update uploadedFiles with the extracted file paths
    uploadedFiles.jsonPath = extractedFiles.json;
    uploadedFiles.baseLogPath = extractedFiles.base;
    uploadedFiles.beforeLogPath = extractedFiles.before;
    uploadedFiles.afterLogPath = extractedFiles.after;
    
    Logger.log(`ZIP extraction completed. JSON: ${!!uploadedFiles.jsonPath}, Base: ${!!uploadedFiles.baseLogPath}, Before: ${!!uploadedFiles.beforeLogPath}, After: ${!!uploadedFiles.afterLogPath}`);
    
    // Return information about the extracted files
    return { 
      success: true, 
      message: 'ZIP file processed successfully',
      files: {
        json: {
          name: path.basename(extractedFiles.json),
          path: extractedFiles.json,
          size: fs.statSync(extractedFiles.json).size
        },
        base: {
          name: path.basename(extractedFiles.base),
          path: extractedFiles.base,
          size: fs.statSync(extractedFiles.base).size
        },
        before: {
          name: path.basename(extractedFiles.before),
          path: extractedFiles.before,
          size: fs.statSync(extractedFiles.before).size
        },
        after: {
          name: path.basename(extractedFiles.after),
          path: extractedFiles.after,
          size: fs.statSync(extractedFiles.after).size
        }
      }
    };
  } catch (error) {
    Logger.error(`Error processing ZIP file: ${error.message}`);
    return { success: false, error: `Failed to process ZIP file: ${error.message}` };
  }
});

// Helper function to find required files in a directory
function findRequiredFiles(directory) {
  const result = {
    json: null,
    base: null,
    before: null,
    after: null
  };
  
  function searchDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        const subResult = searchDirectory(fullPath);
        if (subResult.json) result.json = subResult.json;
        if (subResult.base) result.base = subResult.base;
        if (subResult.before) result.before = subResult.before;
        if (subResult.after) result.after = subResult.after;
      } else if (stat.isFile()) {
        const fileName = path.basename(file).toLowerCase();
        
        // Check if this is one of the required files
        if (fileName.endsWith('.json') && !result.json) {
          result.json = fullPath;
        } else if (fileName.endsWith('_base.log') && !result.base) {
          result.base = fullPath;
        } else if (fileName.endsWith('_before.log') && !result.before) {
          result.before = fullPath;
        } else if (fileName.endsWith('_after.log') && !result.after) {
          result.after = fullPath;
        }
      }
    }
    
    return result;
  }
  
  return searchDirectory(directory);
}

// Handle resetting file selection
ipcMain.handle('reset-files', async () => {
  Logger.log('Resetting file selection');
  uploadedFiles = {
    jsonPath: null,
    baseLogPath: null,
    beforeLogPath: null,
    afterLogPath: null
  };
  return { success: true };
});

// Handle analysis
ipcMain.handle('analyze-files', async (event, language) => {
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
  
  // Verify that files actually exist
  try {
    if (!fs.existsSync(uploadedFiles.jsonPath)) {
      Logger.warn(`JSON file does not exist: ${uploadedFiles.jsonPath}`);
      return { success: false, error: 'JSON file not found' };
    }
    
    if (!fs.existsSync(uploadedFiles.baseLogPath)) {
      Logger.warn(`Base log file does not exist: ${uploadedFiles.baseLogPath}`);
      return { success: false, error: 'Base log file not found' };
    }
    
    if (!fs.existsSync(uploadedFiles.beforeLogPath)) {
      Logger.warn(`Before log file does not exist: ${uploadedFiles.beforeLogPath}`);
      return { success: false, error: 'Before log file not found' };
    }
    
    if (!fs.existsSync(uploadedFiles.afterLogPath)) {
      Logger.warn(`After log file does not exist: ${uploadedFiles.afterLogPath}`);
      return { success: false, error: 'After log file not found' };
    }
  } catch (error) {
    Logger.error(`Error checking file existence: ${error.message}`);
    return { success: false, error: 'Error verifying uploaded files' };
  }
  
  try {
    Logger.log('Starting log analysis');
    // Default to 'rust' if no language is specified
    const languageToUse = language || 'rust';
    const analysisResult = await analyzeLogs(uploadedFiles, languageToUse);
    // Reset file paths after analysis
    Logger.log('Analysis completed, resetting file paths');
    uploadedFiles = {
      jsonPath: null,
      baseLogPath: null,
      beforeLogPath: null,
      afterLogPath: null
    };
    return { success: true, data: analysisResult };
  } catch (error) {
    Logger.error(`Analysis failed: ${error.message}`);
    return { success: false, error: error.message };
  }
});

// Function to analyze logs from individual files
async function analyzeLogs(files, language = 'rust') {
  Logger.log(`Analyzing logs from individual files`);
  return new Promise((resolve, reject) => {
    try {
      // Check if files are already in a proper directory structure (from ZIP extraction)
      // If the JSON file is in a logs directory, we can use that directly
      const jsonDir = path.dirname(files.jsonPath);
      const logsDir = path.basename(jsonDir) === 'logs' ? jsonDir : null;
      
      let tempDir = null;
      
      if (logsDir && 
          fs.existsSync(path.join(logsDir, path.basename(files.baseLogPath))) &&
          fs.existsSync(path.join(logsDir, path.basename(files.beforeLogPath))) &&
          fs.existsSync(path.join(logsDir, path.basename(files.afterLogPath)))) {
        // Files are already in the correct structure, use the existing directory
        Logger.log(`Files are already in correct structure, using directory: ${path.dirname(logsDir)}`);
        tempDir = path.dirname(logsDir);
      } else {
        // Create a temporary directory for extraction
        tempDir = path.join(app.getPath('temp'), 'log-analyzer-' + Date.now());
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
      }

      // Run the Python analysis script
      const pythonScript = path.join(__dirname, 'log_analyzer.py');
      Logger.log(`Running Python script: ${pythonScript} with directory: ${tempDir} and language: ${language}`);
      const pythonProcess = spawn('python', [pythonScript, tempDir, language]);

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
        // Clean up temporary files (but not if they were from ZIP extraction)
        if (!logsDir) {
          try {
            Logger.log(`Cleaning up temporary directory: ${tempDir}`);
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (err) {
            Logger.warn(`Could not clean up temporary directory: ${err}`);
          }
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
