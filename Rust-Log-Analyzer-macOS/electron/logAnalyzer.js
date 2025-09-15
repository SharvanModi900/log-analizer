const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const { spawn } = require('child_process');

// Function to analyze logs from a zip file
async function analyzeLogs(zipFilePath) {
    return new Promise((resolve, reject) => {
        try {
            // Create a temporary directory for extraction
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            // Extract the zip file
            const zip = new AdmZip(zipFilePath);
            zip.extractAllTo(tempDir, true);

            // Find the required files
            const files = fs.readdirSync(tempDir);
            let baseLog = null;
            let beforeLog = null;
            let afterLog = null;
            let jsonFile = null;

            files.forEach(file => {
                if (file.endsWith('_base.log')) baseLog = path.join(tempDir, file);
                if (file.endsWith('_before.log')) beforeLog = path.join(tempDir, file);
                if (file.endsWith('_after.log')) afterLog = path.join(tempDir, file);
                if (file.endsWith('.json')) jsonFile = path.join(tempDir, file);
               
            });

            if (!baseLog || !beforeLog || !afterLog || !jsonFile) {
                reject(new Error('Missing required files in the zip archive'));
                return;
            }

            // Copy files to the rust/logs directory for analysis
            const logsDir = path.join(__dirname, '..', 'rust', 'logs');
            if (!fs.existsSync(logsDir)) {
                fs.mkdirSync(logsDir, { recursive: true });
            }

            // Clear the logs directory
            const existingFiles = fs.readdirSync(logsDir);
            existingFiles.forEach(file => {
                fs.unlinkSync(path.join(logsDir, file));
            });

            // Copy the extracted files to the logs directory
            fs.copyFileSync(baseLog, path.join(logsDir, 'temp_base.log'));
            fs.copyFileSync(beforeLog, path.join(logsDir, 'temp_before.log'));
            fs.copyFileSync(afterLog, path.join(logsDir, 'temp_after.log'));
            fs.copyFileSync(jsonFile, path.join(logsDir, 'temp.json'));

            // Run the Python analysis script
            const pythonScript = path.join(__dirname, '..', 'rust', 'analyze_for_electron.py');
            const pythonProcess = spawn('python', [pythonScript]);

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                // Clean up temporary files
                try {
                    fs.rmSync(tempDir, { recursive: true });
                } catch (err) {
                    console.warn('Could not clean up temporary directory:', err);
                }

                if (code !== 0) {
                    reject(new Error(`Python script exited with code ${code}: ${stderr}`));
                    return;
                }

                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (err) {
                    reject(new Error(`Failed to parse Python output: ${err.message}\nOutput: ${stdout}`));
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { analyzeLogs };