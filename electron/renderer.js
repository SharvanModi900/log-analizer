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
    const uploadSection = document.getElementById('uploadSection');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const backBtn = document.getElementById('backBtn');
    const resultsBackBtn = document.getElementById('resultsBackBtn');
    const filesInfo = document.getElementById('filesInfo');
    const fileList = document.getElementById('fileList');
    const validationResults = document.getElementById('validationResults');
    const failingTestsTable = document.getElementById('failingTestsTable');
    const failToPassTable = document.getElementById('failToPassTable');
    const passToPassTable = document.getElementById('passToPassTable');
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
                <p class="text-green-700">
                    <i class="fas fa-check-circle text-green-500 mr-2"></i>
                    Selected ${totalFiles} file(s)
                </p>
            `;
            
            // Show file list
            fileList.classList.remove('hidden');
            let fileListHTML = '<div class="text-left"><h4 class="font-medium text-gray-700 mb-2">Selected Files:</h4><ul class="space-y-1">';
            
            if (uploadedFiles.json) {
                fileListHTML += `<li class="flex items-center text-sm"><i class="fas fa-file-code text-blue-500 mr-2"></i> ${uploadedFiles.json.name}</li>`;
            }
            
            if (uploadedFiles.base) {
                fileListHTML += `<li class="flex items-center text-sm"><i class="fas fa-file-alt text-blue-500 mr-2"></i> ${uploadedFiles.base.name}</li>`;
            }
            
            if (uploadedFiles.before) {
                fileListHTML += `<li class="flex items-center text-sm"><i class="fas fa-file-alt text-green-500 mr-2"></i> ${uploadedFiles.before.name}</li>`;
            }
            
            if (uploadedFiles.after) {
                fileListHTML += `<li class="flex items-center text-sm"><i class="fas fa-file-alt text-red-500 mr-2"></i> ${uploadedFiles.after.name}</li>`;
            }
            
            fileListHTML += '</ul></div>';
            fileList.innerHTML = fileListHTML;
        } else {
            filesInfo.innerHTML = '<p class="text-gray-700"><i class="fas fa-info-circle text-primary-500 mr-2"></i>No files selected</p>';
            fileList.classList.add('hidden');
        }

        // Enable analyze button only when all files are selected
        analyzeBtn.disabled = !(uploadedFiles.json && uploadedFiles.base && uploadedFiles.before && uploadedFiles.after);
        if (uploadedFiles.json && uploadedFiles.base && uploadedFiles.before && uploadedFiles.after) {
            analyzeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            Logger.log('All files selected, enabling analyze button');
        } else {
            analyzeBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Add animation to cards when they appear
    function animateCards() {
        Logger.log('Animating summary cards');
        const cards = document.querySelectorAll('.summary-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }

    // Add animation to table rows
    function animateTableRows(table) {
        if (!table) return;
        Logger.log('Animating table rows');
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, index) => {
            row.style.opacity = '0';
            row.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                row.style.opacity = '1';
                row.style.transform = 'translateX(0)';
            }, 50 * index);
        });
    }

    // File upload button click
    uploadFilesBtn.addEventListener('click', () => {
        Logger.log('File upload button clicked');
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', async (event) => {
        Logger.log('Files selected via file input');
        try {
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
    });

    // Analyze files
    analyzeBtn.addEventListener('click', async () => {
        Logger.log('Analyze button clicked');
        if (!uploadedFiles.json || !uploadedFiles.base || !uploadedFiles.before || !uploadedFiles.after) {
            Logger.warn('Attempted to analyze without all files selected');
            showError('Please select all required files (JSON, _base.log, _before.log, _after.log)');
            return;
        }

        // Add ripple effect to button
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        const rect = analyzeBtn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
        analyzeBtn.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);

        // Show loading, hide other sections
        Logger.log('Showing loading section');
        uploadSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');

        try {
            Logger.log('Calling analyzeFiles API');
            const result = await window.electronAPI.analyzeFiles();
            Logger.log(`Analysis result received, success: ${result.success}`);
            
            if (result.success && result.data.success) {
                Logger.log('Analysis successful, displaying results');
                displayResults(result.data);
                loadingSection.classList.add('hidden');
                resultsSection.classList.remove('hidden');
                
                // Reset uploaded files
                uploadedFiles = { json: null, base: null, before: null, after: null };
                updateFileInfo();
                
                // Trigger animations after a short delay
                setTimeout(() => {
                    animateCards();
                    // Animate tables
                    document.querySelectorAll('table').forEach(table => {
                        animateTableRows(table);
                    });
                }, 100);
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
        uploadSection.classList.remove('hidden');
    });

    resultsBackBtn.addEventListener('click', () => {
        Logger.log('Back button clicked in results section');
        resultsSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
    });

    function displayResults(data) {
        Logger.log('Displaying analysis results');
        // Display summary cards
        displaySummary(data.summary);
        
        // Display validation results
        displayValidationResults(data.validationResults);
        
        // Display failing tests
        displayFailingTests(data.failingTests);
        
        // Display fail to pass tests
        displayTestTable(failToPassTable, data.failToPassTests, ['Test Name', 'Base', 'Before', 'After']);
        
        // Display pass to pass tests
        displayTestTable(passToPassTable, data.passToPassTests, ['Test Name', 'Base', 'Before', 'After']);
    }

    function displaySummary(summary) {
        Logger.log('Displaying summary cards');
        summaryCards.innerHTML = `
            <div class="summary-card card-gradient rounded-2xl p-6 shadow-md hover-lift border-t-4 border-green-500">
                <div class="text-gray-600 text-sm font-medium mb-2">Base Failures</div>
                <div class="text-3xl font-bold text-green-600">${summary.baseFailCount}</div>
            </div>
            <div class="summary-card card-gradient rounded-2xl p-6 shadow-md hover-lift border-t-4 border-yellow-500">
                <div class="text-gray-600 text-sm font-medium mb-2">Before Failures</div>
                <div class="text-3xl font-bold text-yellow-600">${summary.beforeFailCount}</div>
            </div>
            <div class="summary-card card-gradient rounded-2xl p-6 shadow-md hover-lift border-t-4 border-red-500">
                <div class="text-gray-600 text-sm font-medium mb-2">After Failures</div>
                <div class="text-3xl font-bold text-red-600">${summary.afterFailCount}</div>
            </div>
            <div class="summary-card card-gradient rounded-2xl p-6 shadow-md hover-lift border-t-4 border-blue-500">
                <div class="text-gray-600 text-sm font-medium mb-2">F2P Tests</div>
                <div class="text-3xl font-bold text-blue-600">${summary.totalF2P}</div>
            </div>
            <div class="summary-card card-gradient rounded-2xl p-6 shadow-md hover-lift border-t-4 border-indigo-500">
                <div class="text-gray-600 text-sm font-medium mb-2">P2P Tests</div>
                <div class="text-3xl font-bold text-indigo-600">${summary.totalP2P}</div>
            </div>
            <div class="summary-card card-gradient rounded-2xl p-6 shadow-md hover-lift border-t-4 border-purple-500">
                <div class="text-gray-600 text-sm font-medium mb-2">All Pass P2P</div>
                <div class="text-3xl font-bold text-purple-600">${summary.allPassCount}</div>
            </div>
        `;
    }

    function displayValidationResults(results) {
        Logger.log(`Displaying ${results.length} validation results`);
        validationResults.innerHTML = '';
        
        results.forEach((result, index) => {
            const validationItem = document.createElement('div');
            validationItem.className = `validation-item card-gradient rounded-2xl p-6 shadow-md mb-4 border-l-4 ${result.status === 'PASS' ? 'border-green-500' : 'border-red-500'}`;
            
            const statusClass = result.status === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const statusText = result.status === 'PASS' ? 'PASS ✅' : 'FAIL ❌';
            const icon = result.status === 'PASS' ? 'fa-check-circle' : 'fa-times-circle';
            
            validationItem.innerHTML = `
                <h4 class="text-lg font-semibold text-gray-800 mb-3"><i class="fas ${icon} mr-2"></i>${index + 1}. ${result.description}</h4>
                <p class="mb-3">Status: <strong class="px-3 py-1 rounded-full text-sm font-medium ${statusClass}">${statusText}</strong></p>
                ${result.examples && result.examples.length > 0 ? `
                    <div class="examples-list bg-gray-50 rounded-xl p-4 mt-4">
                        <p class="font-medium text-gray-700 mb-2"><i class="fas fa-list mr-2"></i>Examples (${result.examples.length}):</p>
                        <ul class="pl-5 max-h-40 overflow-y-auto">
                            ${result.examples.slice(0, 10).map(example => `<li class="mb-1 text-gray-600">${example}</li>`).join('')}
                            ${result.examples.length > 10 ? `<li class="text-gray-500">... and ${result.examples.length - 10} more</li>` : ''}
                        </ul>
                    </div>
                ` : '<p class="text-gray-500">No examples found.</p>'}
            `;
            
            validationResults.appendChild(validationItem);
        });
    }

    function displayFailingTests(data) {
        Logger.log(`Displaying ${data ? data.length : 0} failing tests`);
        if (!data || data.length === 0) {
            failingTestsTable.innerHTML = '<p class="text-gray-500 py-4">No failing tests found across any state.</p>';
            return;
        }

        let tableHTML = `
            <div class="overflow-x-auto rounded-2xl shadow-md">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr class="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
                            <th class="py-3 px-4 text-left">Test Name</th>
                            <th class="py-3 px-4 text-left">f2p(present)</th>
                            <th class="py-3 px-4 text-left">p2p(present)</th>
                            <th class="py-3 px-4 text-left">Base</th>
                            <th class="py-3 px-4 text-left">Before</th>
                            <th class="py-3 px-4 text-left">After</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(row => {
            tableHTML += `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-4">${row[0]}</td>
                    <td class="py-3 px-4">${row[1] === 'Yes' ? '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Yes</span>' : '<span class="text-gray-400">No</span>'}</td>
                    <td class="py-3 px-4">${row[2] === 'Yes' ? '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Yes</span>' : '<span class="text-gray-400">No</span>'}</td>
                    <td class="py-3 px-4"><span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(row[3])}">${row[3]}</span></td>
                    <td class="py-3 px-4"><span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(row[4])}">${row[4]}</span></td>
                    <td class="py-3 px-4"><span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(row[5])}">${row[5]}</span></td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        failingTestsTable.innerHTML = tableHTML;
    }

    function displayTestTable(container, data, headers) {
        Logger.log(`Displaying test table with ${data ? data.length : 0} rows`);
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-gray-500 py-4">No tests to display.</p>';
            return;
        }

        let tableHTML = `
            <div class="overflow-x-auto rounded-2xl shadow-md">
                <table class="min-w-full bg-white">
                    <thead>
                        <tr class="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
                            <th class="py-3 px-4 text-left">#</th>
                            ${headers.map(header => `<th class="py-3 px-4 text-left">${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(row => {
            tableHTML += `
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="py-3 px-4">${row[0]}</td>
                    ${row.slice(1).map((cell, index) => {
                        if (index > 0) { // Status columns
                            return `<td class="py-3 px-4"><span class="px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(cell)}">${cell}</span></td>`;
                        } else { // Test name column
                            return `<td class="py-3 px-4">${cell}</td>`;
                        }
                    }).join('')}
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = tableHTML;
    }

    function getStatusBadgeClass(status) {
        if (status.includes('PASS')) return 'bg-green-100 text-green-800';
        if (status.includes('FAIL')) return 'bg-red-100 text-red-800';
        if (status.includes('ABSENT')) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    }

    function showError(message) {
        Logger.error(`Showing error: ${message}`);
        errorMessage.textContent = message;
    }
    
    Logger.log('Application initialized successfully');
});