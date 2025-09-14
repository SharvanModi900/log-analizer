// Simple logging utility
const Logger = {
    log: function(message) {
        console.log(`[LogAnalyzer] ${new Date().toISOString()}: ${message}`);
    },
    error: function(message) {
        console.error(`[LogAnalyzer] ${new Date().toISOString()}: ${message}`);
    },
    warn: function(message) {
        console.warn(`[LogAnalyzer] ${new Date().toISOString()}: ${message}`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Logger.log('DOM content loaded, initializing application');
    
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    const fileInput = document.getElementById('fileInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const filesUploadArea = document.getElementById('filesUploadArea');
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const backBtn = document.getElementById('backBtn');
    const filesInfo = document.getElementById('filesInfo');
    const fileList = document.getElementById('fileList');
    const validationResults = document.getElementById('validationResults');
    const summaryCards = document.getElementById('summaryCards');

    // Track uploaded files
    let uploadedFiles = {
        json: null,
        base: null,
        before: null,
        after: null
    };

    Logger.log('UI elements initialized');

    // Update file info display
    function updateFileInfo() {
        Logger.log('Updating file info display');
        
        const totalFiles = Object.values(uploadedFiles).filter(file => file !== null).length;
        
        if (totalFiles > 0) {
            filesInfo.innerHTML = `
                <p>
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Selected ${totalFiles} file(s)
                </p>
            `;
            
            // Show file list
            fileList.classList.remove('hidden');
            let fileListHTML = '<div class="file-list-content mt-4">';
            
            if (uploadedFiles.json) {
                fileListHTML += `
                    <div class="file-item">
                        <i class="fas fa-file-code file-icon text-blue-500"></i>
                        <span class="file-name">${uploadedFiles.json.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            if (uploadedFiles.base) {
                fileListHTML += `
                    <div class="file-item">
                        <i class="fas fa-file-alt file-icon text-blue-500"></i>
                        <span class="file-name">${uploadedFiles.base.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            if (uploadedFiles.before) {
                fileListHTML += `
                    <div class="file-item">
                        <i class="fas fa-file-alt file-icon text-blue-500"></i>
                        <span class="file-name">${uploadedFiles.before.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            if (uploadedFiles.after) {
                fileListHTML += `
                    <div class="file-item">
                        <i class="fas fa-file-alt file-icon text-red-500"></i>
                        <span class="file-name">${uploadedFiles.after.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            fileListHTML += '</div>';
            fileList.innerHTML = fileListHTML;
        } else {
            filesInfo.innerHTML = '<p><i class="fas fa-info-circle text-blue-500 mr-2"></i>No files selected</p>';
            fileList.classList.add('hidden');
        }

        // Enable analyze button only when all files are selected
        analyzeBtn.disabled = !(uploadedFiles.json && uploadedFiles.base && uploadedFiles.before && uploadedFiles.after);
        if (uploadedFiles.json && uploadedFiles.base && uploadedFiles.before && uploadedFiles.after) {
            Logger.log('All files selected, enabling analyze button');
        }
    }

    // File upload button click
    uploadFilesBtn.addEventListener('click', () => {
        Logger.log('File upload button clicked');
        // Call the selectFiles API directly instead of triggering file input
        selectFilesDirectly();
    });

    // Direct file selection function
    async function selectFilesDirectly() {
        try {
            Logger.log('Direct file selection initiated');
            const result = await window.electronAPI.selectFiles();
            
            if (result.success) {
                Logger.log(`Files selected: ${Object.keys(result.files).length} files identified`);
                
                // Update uploaded files
                if (result.files.json) {
                    uploadedFiles.json = {
                        name: result.files.json.split('\\').pop().split('/').pop(),
                        path: result.files.json,
                        size: 0
                    };
                }
                
                if (result.files.base) {
                    uploadedFiles.base = {
                        name: result.files.base.split('\\').pop().split('/').pop(),
                        path: result.files.base,
                        size: 0
                    };
                }
                
                if (result.files.before) {
                    uploadedFiles.before = {
                        name: result.files.before.split('\\').pop().split('/').pop(),
                        path: result.files.before,
                        size: 0
                    };
                }
                
                if (result.files.after) {
                    uploadedFiles.after = {
                        name: result.files.after.split('\\').pop().split('/').pop(),
                        path: result.files.after,
                        size: 0
                    };
                }
                
                updateFileInfo();
            } else {
                Logger.error(`Failed to select files: ${result.error || 'Unknown error'}`);
                showError(result.error || 'Failed to select files');
            }
        } catch (error) {
            Logger.error(`Exception during file selection: ${error.message}`);
            showError(error.message);
        }
    }

    // Handle file selection (this will be triggered by drag and drop)
    fileInput.addEventListener('change', async (event) => {
        Logger.log('Files selected via file input (drag and drop)');
        // Check if any files were actually selected
        if (event.target.files.length === 0) {
            Logger.warn('No files selected in change event');
            return;
        }
        
        try {
            // Process drag and drop files
            const files = Array.from(event.target.files);
            Logger.log(`Processing ${files.length} files from drag and drop`);
            
            // Create a temporary object to hold file information
            const fileData = {
                json: null,
                base: null,
                before: null,
                after: null
            };
            
            // Identify files
            for (const file of files) {
                const fileName = file.name.toLowerCase();
                Logger.log(`Processing file: ${fileName}`);
                
                if (fileName.endsWith('.json')) {
                    fileData.json = {
                        name: file.name,
                        path: file.path || file.name,
                        size: file.size
                    };
                    Logger.log(`Identified JSON file: ${file.name}`);
                } else if (fileName.endsWith('_base.log')) {
                    fileData.base = {
                        name: file.name,
                        path: file.path || file.name,
                        size: file.size
                    };
                    Logger.log(`Identified Base Log file: ${file.name}`);
                } else if (fileName.endsWith('_before.log')) {
                    fileData.before = {
                        name: file.name,
                        path: file.path || file.name,
                        size: file.size
                    };
                    Logger.log(`Identified Before Log file: ${file.name}`);
                } else if (fileName.endsWith('_after.log')) {
                    fileData.after = {
                        name: file.name,
                        path: file.path || file.name,
                        size: file.size
                    };
                    Logger.log(`Identified After Log file: ${file.name}`);
                }
            }
            
            // Check if we have all required files
            if (!fileData.json || !fileData.base || !fileData.before || !fileData.after) {
                Logger.warn('Not all required files were selected via drag and drop');
                showError('Please select all required files (JSON, _base.log, _before.log, _after.log)');
                return;
            }
            
            // Update uploaded files
            uploadedFiles = fileData;
            updateFileInfo();
        } catch (error) {
            Logger.error(`Exception during drag and drop file processing: ${error.message}`);
            showError(error.message);
        }
    });

    // Analyze files
    analyzeBtn.addEventListener('click', async () => {
        Logger.log('Analyze button clicked');
        if (!uploadedFiles.json || !uploadedFiles.base || !uploadedFiles.before || !uploadedFiles.after) {
            Logger.warn('Attempted to analyze without all files selected');
            showError('Please select all required files (JSON, _base.log, _before.log, _after.log)');
            return;
        }

        // Show loading, hide other sections
        Logger.log('Showing loading section');
        document.querySelector('.main-content').classList.add('hidden');
        loadingSection.classList.remove('hidden');
        errorSection.classList.add('hidden');

        try {
            Logger.log('Calling analyzeFiles API');
            const result = await window.electronAPI.analyzeFiles();
            Logger.log(`Analysis result received, success: ${result.success}`);
            
            if (result.success && result.data.success) {
                Logger.log('Analysis successful, displaying results');
                displayResults(result.data);
                loadingSection.classList.add('hidden');
                document.querySelector('.main-content').classList.remove('hidden');
                
                // Reset uploaded files
                uploadedFiles = { json: null, base: null, before: null, after: null };
                updateFileInfo();
            } else {
                const error = result.error || (result.data && result.data.error) || 'Unknown error occurred';
                Logger.error(`Analysis failed: ${error}`);
                showError(error);
                loadingSection.classList.add('hidden');
                errorSection.classList.remove('hidden');
            }
        } catch (error) {
            Logger.error(`Exception during analysis: ${error.message}`);
            showError(error.message);
            loadingSection.classList.add('hidden');
            errorSection.classList.remove('hidden');
        }
    });

    backBtn.addEventListener('click', () => {
        Logger.log('Back button clicked in error section');
        errorSection.classList.add('hidden');
        document.querySelector('.main-content').classList.remove('hidden');
    });

    function displayResults(data) {
        Logger.log('Displaying analysis results');
        // Display summary cards
        displaySummary(data.summary);
        
        // Display validation results
        displayValidationResults(data.validationResults);
        
        // Display tables with actual data
        displayFailingTests(data.failingTests);
        displayFailToPassTests(data.failToPassTests);
        displayPassToPassTests(data.passToPassTests);
    }

    function displaySummary(summary) {
        Logger.log('Displaying summary cards');
        const cards = summaryCards.querySelectorAll('.stat-card');
        
        // Update card values
        if (cards.length >= 6) {
            cards[0].querySelector('.stat-value').textContent = summary.baseFailCount;
            cards[1].querySelector('.stat-value').textContent = summary.beforeFailCount;
            cards[2].querySelector('.stat-value').textContent = summary.afterFailCount;
            cards[3].querySelector('.stat-value').textContent = summary.totalF2P;
            cards[4].querySelector('.stat-value').textContent = summary.totalP2P;
            cards[5].querySelector('.stat-value').textContent = summary.allPassCount;
        }
    }

    function displayValidationResults(results) {
        Logger.log(`Displaying ${results.length} validation results`);
        validationResults.innerHTML = '';
        
        results.forEach((result) => {
            const validationItem = document.createElement('div');
            validationItem.className = `validation-item ${result.status === 'PASS' ? '' : 'fail'}`;
            
            const statusClass = result.status === 'PASS' ? 'status-pass' : 'status-fail';
            const statusText = result.status === 'PASS' ? 'PASS' : 'FAIL';
            
            validationItem.innerHTML = `
                <div class="validation-header">
                    <div class="validation-title">${result.description}</div>
                    <div class="validation-status ${statusClass}">${statusText}</div>
                </div>
                <div class="examples">${result.examples && result.examples.length > 0 ? 
                    `Examples: ${result.examples.slice(0, 3).join(', ')}${result.examples.length > 3 ? '...' : ''}` : 
                    'No examples found'}</div>
            `;
            
            validationResults.appendChild(validationItem);
        });
    }

    function displayFailingTests(failingTests) {
        Logger.log(`Displaying ${failingTests.length} failing tests`);
        const tableBody = document.querySelector('#failingTestsTable tbody');
        
        if (failingTests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-500">No failing tests found</td></tr>';
            return;
        }
        
        let tableHTML = '';
        failingTests.forEach((testRow, index) => {
            // Each row contains: [test_name, in_f2p, in_p2p, base_status, before_status, after_status]
            const testName = testRow[0];
            const inF2P = testRow[1];
            const inP2P = testRow[2];
            const baseStatus = testRow[3];
            const beforeStatus = testRow[4];
            const afterStatus = testRow[5];
            
            // Determine status badges
            const f2pStatus = inF2P === 'Yes' ? 'badge-pass' : 'badge-default';
            const p2pStatus = inP2P === 'Yes' ? 'badge-pass' : 'badge-default';
            const baseBadgeStatus = baseStatus.startsWith('FAIL') ? 'badge-fail' : 
                                  (baseStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            const beforeBadgeStatus = beforeStatus.startsWith('FAIL') ? 'badge-fail' : 
                                    (beforeStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            const afterBadgeStatus = afterStatus.startsWith('FAIL') ? 'badge-fail' : 
                                   (afterStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            
            tableHTML += `
                <tr>
                    <td>${testName}</td>
                    <td><span class="status-badge ${f2pStatus}">${inF2P}</span></td>
                    <td><span class="status-badge ${p2pStatus}">${inP2P}</span></td>
                    <td><span class="status-badge ${baseBadgeStatus}">${baseStatus}</span></td>
                    <td><span class="status-badge ${beforeBadgeStatus}">${beforeStatus}</span></td>
                    <td><span class="status-badge ${afterBadgeStatus}">${afterStatus}</span></td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
    }

    function displayFailToPassTests(failToPassTests) {
        Logger.log(`Displaying ${failToPassTests.length} fail to pass tests`);
        const tableBody = document.querySelector('#failToPassTable tbody');
        
        if (failToPassTests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">No fail to pass tests found</td></tr>';
            return;
        }
        
        let tableHTML = '';
        failToPassTests.forEach((testRow, index) => {
            // Each row contains: [index, test_name, base_status, before_status, after_status]
            const serialNumber = testRow[0];
            const testName = testRow[1];
            const baseStatus = testRow[2];
            const beforeStatus = testRow[3];
            const afterStatus = testRow[4];
            
            // Determine status badges
            const baseBadgeStatus = baseStatus.startsWith('FAIL') ? 'badge-fail' : 
                                  (baseStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            const beforeBadgeStatus = beforeStatus.startsWith('FAIL') ? 'badge-fail' : 
                                    (beforeStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            const afterBadgeStatus = afterStatus.startsWith('FAIL') ? 'badge-fail' : 
                                   (afterStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            
            tableHTML += `
                <tr>
                    <td>${serialNumber}</td>
                    <td>${testName}</td>
                    <td><span class="status-badge ${baseBadgeStatus}">${baseStatus}</span></td>
                    <td><span class="status-badge ${beforeBadgeStatus}">${beforeStatus}</span></td>
                    <td><span class="status-badge ${afterBadgeStatus}">${afterStatus}</span></td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
    }

    function displayPassToPassTests(passToPassTests) {
        Logger.log(`Displaying ${passToPassTests.length} pass to pass tests`);
        const tableBody = document.querySelector('#passToPassTable tbody');
        
        if (passToPassTests.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">No pass to pass tests found</td></tr>';
            return;
        }
        
        let tableHTML = '';
        passToPassTests.forEach((testRow, index) => {
            // Each row contains: [index, test_name, base_status, before_status, after_status]
            const serialNumber = testRow[0];
            const testName = testRow[1];
            const baseStatus = testRow[2];
            const beforeStatus = testRow[3];
            const afterStatus = testRow[4];
            
            // Determine status badges
            const baseBadgeStatus = baseStatus.startsWith('FAIL') ? 'badge-fail' : 
                                  (baseStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            const beforeBadgeStatus = beforeStatus.startsWith('FAIL') ? 'badge-fail' : 
                                    (beforeStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            const afterBadgeStatus = afterStatus.startsWith('FAIL') ? 'badge-fail' : 
                                   (afterStatus.startsWith('PASS') ? 'badge-pass' : 'badge-absent');
            
            tableHTML += `
                <tr>
                    <td>${serialNumber}</td>
                    <td>${testName}</td>
                    <td><span class="status-badge ${baseBadgeStatus}">${baseStatus}</span></td>
                    <td><span class="status-badge ${beforeBadgeStatus}">${beforeStatus}</span></td>
                    <td><span class="status-badge ${afterBadgeStatus}">${afterStatus}</span></td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = tableHTML;
    }

    function showError(message) {
        Logger.error(`Showing error: ${message}`);
        errorMessage.textContent = message;
    }
    
    Logger.log('Application initialized successfully');
});