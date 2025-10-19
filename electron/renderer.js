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

// Store recent analyses
let recentAnalyses = [];

document.addEventListener('DOMContentLoaded', () => {
    Logger.log('DOM content loaded, initializing application');
    
    const uploadFilesBtn = document.getElementById('uploadFilesBtn');
    const uploadZipBtn = document.getElementById('uploadZipBtn'); // Add ZIP upload button
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
    const analysisDashboard = document.getElementById('analysisDashboard');
    const analyzeAnotherBtn = document.getElementById('analyzeAnotherBtn');
    const instructionsSection = document.getElementById('instructionsSection');
    
    // Language selection
    const languageSelect = document.getElementById('languageSelect');
    
    // Full screen elements
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullScreenDashboard = document.getElementById('fullScreenDashboard');
    const closeFullscreenBtn = document.getElementById('closeFullscreenBtn');
    const analyzeAnotherBtnFullscreen = document.getElementById('analyzeAnotherBtnFullscreen');
    
    // Sidebar tab elements
    const sidebarTabs = document.querySelectorAll('.sidebar .tab');
    const sidebarTabContents = document.querySelectorAll('.sidebar .tab-content');
    
    // Recent analyses elements
    const recentAnalysesSidebar = document.getElementById('recentAnalysesSidebar');
    const noRecentAnalysesMessage = document.getElementById('noRecentAnalysesMessage');
    const recentAnalysesTableContainer = document.getElementById('recentAnalysesTableContainer');
    const recentAnalysesSidebarTableBody = document.getElementById('recentAnalysesSidebarTableBody');

    // Track uploaded files
    let uploadedFiles = {
        json: null,
        base: null,
        before: null,
        after: null
    };

    Logger.log('UI elements initialized');
    
    // Add a small CSS fix to ensure analysis dashboard visibility
    const style = document.createElement('style');
    style.textContent = `
        #analysisDashboard:not(.hidden) {
            display: block !important;
        }
    `;
    document.head.appendChild(style);

    // Add professional animations to elements
    function addProfessionalAnimations() {
        // Add floating animation to all stat cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            // Remove any existing animation classes
            card.classList.remove('floating');
            // Add with a slight delay for staggered effect
            setTimeout(() => {
                card.classList.add('floating');
            }, index * 100);
        });

        // Add pulse animation to buttons on hover
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.classList.add('pulse');
            });
            button.addEventListener('mouseleave', () => {
                button.classList.remove('pulse');
            });
        });
    }

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
                    <div class="file-item smooth-transition">
                        <i class="fas fa-file-code file-icon text-blue-500"></i>
                        <span class="file-name">${uploadedFiles.json.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            if (uploadedFiles.base) {
                fileListHTML += `
                    <div class="file-item smooth-transition">
                        <i class="fas fa-file-alt file-icon text-blue-500"></i>
                        <span class="file-name">${uploadedFiles.base.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            if (uploadedFiles.before) {
                fileListHTML += `
                    <div class="file-item smooth-transition">
                        <i class="fas fa-file-alt file-icon text-blue-500"></i>
                        <span class="file-name">${uploadedFiles.before.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            if (uploadedFiles.after) {
                fileListHTML += `
                    <div class="file-item smooth-transition">
                        <i class="fas fa-file-alt file-icon text-red-500"></i>
                        <span class="file-name">${uploadedFiles.after.name}</span>
                        <i class="fas fa-check-circle text-green-500"></i>
                    </div>
                `;
            }
            
            fileListHTML += '</div>';
            fileList.innerHTML = fileListHTML;
            
            // Show analyze button when all files are selected
            if (uploadedFiles.json && uploadedFiles.base && uploadedFiles.before && uploadedFiles.after) {
                analyzeBtn.classList.remove('hidden');
                analyzeBtn.disabled = false;
                // Add animation to analyze button
                setTimeout(() => {
                    analyzeBtn.classList.add('pulse');
                }, 300);
                Logger.log('All files selected, showing analyze button');
            } else {
                analyzeBtn.classList.add('hidden');
                analyzeBtn.disabled = true;
            }
        } else {
            filesInfo.innerHTML = '<p><i class="fas fa-info-circle text-blue-500 mr-2"></i>No files selected</p>';
            fileList.classList.add('hidden');
            analyzeBtn.classList.add('hidden');
            analyzeBtn.disabled = true;
        }
    }

    // Reset UI to initial state
    function resetToInitialState() {
        // Hide analysis dashboard and show upload section
        analysisDashboard.classList.add('hidden');
        // Find the upload section and show it (but keep instructions visible)
        const uploadSection = document.querySelector('.section:not(#analysisDashboard):not(#instructionsSection)');
        if (uploadSection) {
            uploadSection.classList.remove('hidden');
        }
        
        // Reset file info
        uploadedFiles = {
            json: null,
            base: null,
            before: null,
            after: null
        };
        updateFileInfo();
        
        // Reset summary cards to default values with animation
        const cards = summaryCards.querySelectorAll('.stat-card');
        if (cards.length >= 6) {
            cards[0].querySelector('.stat-value').textContent = '0';
            cards[1].querySelector('.stat-value').textContent = '0';
            cards[2].querySelector('.stat-value').textContent = '0';
            cards[3].querySelector('.stat-value').textContent = '0';
            cards[4].querySelector('.stat-value').textContent = '0';
            cards[5].querySelector('.stat-value').textContent = '0';
        }
        
        // Reset validation results
        validationResults.innerHTML = `
            <div class="validation-item">
                <div class="validation-header">
                    <div class="validation-title">Base failures in P2P</div>
                    <div class="validation-status status-pass">PASS</div>
                </div>
                <div class="examples">No examples found</div>
            </div>
            <div class="validation-item">
                <div class="validation-header">
                    <div class="validation-title">After failures in F2P/P2P</div>
                    <div class="validation-status status-pass">PASS</div>
                </div>
                <div class="examples">No examples found</div>
            </div>
            <div class="validation-item">
                <div class="validation-header">
                    <div class="validation-title">F2P tests in before</div>
                    <div class="validation-status status-pass">PASS</div>
                </div>
                <div class="examples">No examples found</div>
            </div>
            <div class="validation-item fail">
                <div class="validation-header">
                    <div class="validation-title">P2P missing in base</div>
                    <div class="validation-status status-fail">FAIL</div>
                </div>
                <div class="examples">No examples found</div>
            </div>
        `;
        
        // Reset tables
        document.querySelector('#failingTestsTable tbody').innerHTML = '<tr><td colspan="6" class="text-center text-gray-500">No data available. Upload files and analyze to see results.</td></tr>';
        document.querySelector('#failToPassTable tbody').innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">No data available. Upload files and analyze to see results.</td></tr>';
        document.querySelector('#passToPassTable tbody').innerHTML = '<tr><td colspan="5" class="text-center text-gray-500">No data available. Upload files and analyze to see results.</td></tr>';
    }

    // Toggle full screen mode
    function toggleFullScreen() {
        fullScreenDashboard.classList.toggle('active');
        
        // Copy current analysis data to full screen view
        if (fullScreenDashboard.classList.contains('active')) {
            // Copy summary cards
            const currentCards = summaryCards.querySelectorAll('.stat-card');
            const fullscreenCards = document.querySelectorAll('#summaryCardsFullscreen .stat-card');
            fullscreenCards.forEach((card, index) => {
                if (currentCards[index]) {
                    const currentValue = currentCards[index].querySelector('.stat-value').textContent;
                    card.querySelector('.stat-value').textContent = currentValue;
                }
            });
            
            // Copy validation results
            const currentValidation = validationResults.innerHTML;
            document.getElementById('validationResultsFullscreen').innerHTML = currentValidation;
            
            // Copy table data
            document.getElementById('failingTestsTableFullscreen').querySelector('tbody').innerHTML = 
                document.getElementById('failingTestsTable').querySelector('tbody').innerHTML;
            document.getElementById('failToPassTableFullscreen').querySelector('tbody').innerHTML = 
                document.getElementById('failToPassTable').querySelector('tbody').innerHTML;
            document.getElementById('passToPassTableFullscreen').querySelector('tbody').innerHTML = 
                document.getElementById('passToPassTable').querySelector('tbody').innerHTML;
        }
    }

    // Save analysis to recent analyses
    function saveToRecentAnalyses(analysisData) {
        Logger.log('Saving analysis to recent analyses');
        const analysis = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            files: Object.values(uploadedFiles).filter(file => file !== null).map(file => file.name),
            data: analysisData
        };
        
        recentAnalyses.unshift(analysis);
        // Keep only the last 10 analyses
        if (recentAnalyses.length > 10) {
            recentAnalyses = recentAnalyses.slice(0, 10);
        }
        
        Logger.log(`Saved analysis. Recent analyses count: ${recentAnalyses.length}`);
        updateRecentAnalysesDisplay();
    }

    // Update recent analyses display
    function updateRecentAnalysesDisplay() {
        Logger.log(`Updating recent analyses display. Recent analyses count: ${recentAnalyses.length}`);
        // Update sidebar display
        if (recentAnalyses.length === 0) {
            Logger.log('No recent analyses, hiding recent analyses component');
            // Show the "no recent analyses" message
            const noRecentMessage = document.getElementById('noRecentAnalysesMessage');
            if (noRecentMessage) {
                noRecentMessage.classList.remove('hidden');
            }
            
            // Hide the table container
            const tableContainer = document.getElementById('recentAnalysesTableContainer');
            if (tableContainer) {
                tableContainer.classList.add('hidden');
            }
        } else {
            Logger.log('There are recent analyses, showing recent analyses component');
            // Hide the "no recent analyses" message
            const noRecentMessage = document.getElementById('noRecentAnalysesMessage');
            if (noRecentMessage) {
                noRecentMessage.classList.add('hidden');
            }
            
            // Show the table container
            const tableContainer = document.getElementById('recentAnalysesTableContainer');
            if (tableContainer) {
                tableContainer.classList.remove('hidden');
            }
            
            let tableHTML = '';
            recentAnalyses.forEach(analysis => {
                const files = analysis.files.join(', ');
                const date = analysis.timestamp;
                
                tableHTML += `
                    <tr>
                        <td>${date}</td>
                        <td>${files}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm load-analysis-sidebar" data-id="${analysis.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            const tableBody = document.getElementById('recentAnalysesSidebarTableBody');
            if (tableBody) {
                tableBody.innerHTML = tableHTML;
            }
            
            // Add event listeners to load buttons
            document.querySelectorAll('.load-analysis-sidebar').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('.load-analysis-sidebar').getAttribute('data-id'));
                    loadAnalysis(id);
                });
            });
        }
        
        // Update recent analyses table in fullscreen view
        updateRecentAnalysesTable();
    }

    // Update recent analyses table
    function updateRecentAnalysesTable() {
        const fullscreenTableBody = document.querySelector('#recentAnalysesTableFullscreen tbody');
        
        if (recentAnalyses.length === 0) {
            const noDataHTML = '<tr><td colspan="6" class="text-center text-gray-500">No recent analyses found.</td></tr>';
            fullscreenTableBody.innerHTML = noDataHTML;
        } else {
            let tableHTML = '';
            recentAnalyses.forEach(analysis => {
                const files = analysis.files.join(', ');
                const baseFailures = analysis.data.summary.baseFailCount || 0;
                const beforeFailures = analysis.data.summary.beforeFailCount || 0;
                const afterFailures = analysis.data.summary.afterFailCount || 0;
                
                tableHTML += `
                    <tr>
                        <td>${analysis.timestamp}</td>
                        <td>${files}</td>
                        <td>${baseFailures}</td>
                        <td>${beforeFailures}</td>
                        <td>${afterFailures}</td>
                        <td>
                            <button class="btn btn-secondary btn-sm load-analysis" data-id="${analysis.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            fullscreenTableBody.innerHTML = tableHTML;
            
            // Add event listeners to load buttons
            document.querySelectorAll('.load-analysis').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.target.closest('.load-analysis').getAttribute('data-id'));
                    loadAnalysis(id);
                });
            });
        }
    }

    // Load analysis from recent analyses
    function loadAnalysis(id) {
        const analysis = recentAnalyses.find(a => a.id === id);
        if (analysis) {
            // Hide upload section but keep instructions visible and show analysis dashboard
            const uploadSection = document.querySelector('.section:not(#analysisDashboard):not(#instructionsSection)');
            if (uploadSection) {
                uploadSection.classList.add('hidden');
            }
            analysisDashboard.classList.remove('hidden');
            analysisDashboard.style.display = 'block';
            
            // Display the analysis data
            displayResults(analysis.data);
            
            // Add professional animations
            addProfessionalAnimations();
        }
    }

    // File upload button click
    uploadFilesBtn.addEventListener('click', async () => {
        Logger.log('File upload button clicked');
        try {
            // Add animation to button
            uploadFilesBtn.classList.add('pulse');
            setTimeout(() => {
                uploadFilesBtn.classList.remove('pulse');
            }, 500);
            
            // Call the selectFiles API directly
            const result = await window.electronAPI.selectFiles();
            
            Logger.log(`File selection result: ${JSON.stringify(result)}`);
            
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
                
                Logger.log(`After processing API result, uploadedFiles: JSON=${!!uploadedFiles.json}, Base=${!!uploadedFiles.base}, Before=${!!uploadedFiles.before}, After=${!!uploadedFiles.after}`);
                
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

    // ZIP upload button click
    uploadZipBtn.addEventListener('click', async () => {
        Logger.log('ZIP upload button clicked');
        try {
            // Add animation to button
            uploadZipBtn.classList.add('pulse');
            setTimeout(() => {
                uploadZipBtn.classList.remove('pulse');
            }, 500);
            
            // Call the selectZip API
            const result = await window.electronAPI.selectZip();
            
            Logger.log(`ZIP selection result: ${JSON.stringify(result)}`);
            
            if (result.success) {
                Logger.log(`ZIP file processed: ${result.message}`);
                
                // Update uploaded files from the extracted files
                if (result.files.json) {
                    uploadedFiles.json = {
                        name: result.files.json.name,
                        path: result.files.json.path,
                        size: result.files.json.size
                    };
                }
                
                if (result.files.base) {
                    uploadedFiles.base = {
                        name: result.files.base.name,
                        path: result.files.base.path,
                        size: result.files.base.size
                    };
                }
                
                if (result.files.before) {
                    uploadedFiles.before = {
                        name: result.files.before.name,
                        path: result.files.before.path,
                        size: result.files.before.size
                    };
                }
                
                if (result.files.after) {
                    uploadedFiles.after = {
                        name: result.files.after.name,
                        path: result.files.after.path,
                        size: result.files.after.size
                    };
                }
                
                Logger.log(`After processing ZIP, uploadedFiles: JSON=${!!uploadedFiles.json}, Base=${!!uploadedFiles.base}, Before=${!!uploadedFiles.before}, After=${!!uploadedFiles.after}`);
                
                updateFileInfo();
            } else {
                Logger.error(`Failed to process ZIP: ${result.error || 'Unknown error'}`);
                showError(result.error || 'Failed to process ZIP file');
            }
        } catch (error) {
            Logger.error(`Exception during ZIP processing: ${error.message}`);
            showError(error.message);
        }
    });

    // Handle drag and drop events
    filesUploadArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        filesUploadArea.classList.add('border-primary', 'glow');
        filesUploadArea.classList.remove('border-gray-300');
    });

    filesUploadArea.addEventListener('dragleave', () => {
        filesUploadArea.classList.remove('border-primary', 'glow');
        filesUploadArea.classList.add('border-gray-300');
    });

    filesUploadArea.addEventListener('drop', async (event) => {
        event.preventDefault();
        filesUploadArea.classList.remove('border-primary', 'glow');
        filesUploadArea.classList.add('border-gray-300');
        
        Logger.log('Files dropped into upload area');
        const files = Array.from(event.dataTransfer.files);
        
        Logger.log(`Number of files dropped: ${files.length}`);
        
        // Check if any of the dropped files is a ZIP file
        const zipFiles = files.filter(file => file.name.toLowerCase().endsWith('.zip'));
        if (zipFiles.length > 0) {
            // Handle ZIP file
            await handleZipFile(zipFiles[0]);
            return;
        }
        
        // Process dropped files (preserve previously selected files)
        for (const file of files) {
            const fileName = file.name.toLowerCase();
            Logger.log(`Processing dropped file: ${fileName}`);
            
            if (fileName.endsWith('.json')) {
                uploadedFiles.json = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified JSON file: ${file.name}`);
            } else if (fileName.endsWith('_base.log')) {
                uploadedFiles.base = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified Base Log file: ${file.name}`);
            } else if (fileName.endsWith('_before.log')) {
                uploadedFiles.before = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified Before Log file: ${file.name}`);
            } else if (fileName.endsWith('_after.log')) {
                uploadedFiles.after = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified After Log file: ${file.name}`);
            }
        }
        
        Logger.log(`After processing dropped files, uploadedFiles: JSON=${!!uploadedFiles.json}, Base=${!!uploadedFiles.base}, Before=${!!uploadedFiles.before}, After=${!!uploadedFiles.after}`);
        
        updateFileInfo();
    });

    // Handle file selection through file input (for accessibility)
    fileInput.addEventListener('change', async (event) => {
        Logger.log('Files selected via file input');
        // Check if any files were actually selected
        if (event.target.files.length === 0) {
            Logger.warn('No files selected in change event');
            return;
        }
        
        Logger.log(`Number of files selected: ${event.target.files.length}`);
        
        // Check if any of the selected files is a ZIP file
        const files = Array.from(event.target.files);
        const zipFiles = files.filter(file => file.name.toLowerCase().endsWith('.zip'));
        if (zipFiles.length > 0) {
            // Handle ZIP file
            await handleZipFile(zipFiles[0]);
            // Reset the file input value to allow selecting the same files again
            fileInput.value = '';
            return;
        }
        
        // Process selected files directly from the file input (preserve previously selected files)
        for (const file of files) {
            const fileName = file.name.toLowerCase();
            Logger.log(`Processing file from input: ${fileName}`);
            
            if (fileName.endsWith('.json')) {
                uploadedFiles.json = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified JSON file: ${file.name}`);
            } else if (fileName.endsWith('_base.log')) {
                uploadedFiles.base = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified Base Log file: ${file.name}`);
            } else if (fileName.endsWith('_before.log')) {
                uploadedFiles.before = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified Before Log file: ${file.name}`);
            } else if (fileName.endsWith('_after.log')) {
                uploadedFiles.after = {
                    name: file.name,
                    path: file.path || file.name,
                    size: file.size
                };
                Logger.log(`Identified After Log file: ${file.name}`);
            }
        }
        
        Logger.log(`After processing, uploadedFiles: JSON=${!!uploadedFiles.json}, Base=${!!uploadedFiles.base}, Before=${!!uploadedFiles.before}, After=${!!uploadedFiles.after}`);
        
        updateFileInfo();
        
        // Reset the file input value to allow selecting the same files again
        fileInput.value = '';
    });

    // Handle ZIP file processing
    async function handleZipFile(zipFile) {
        Logger.log(`Processing ZIP file: ${zipFile.name}`);
        try {
            // Call the selectZip API with the file path
            const result = await window.electronAPI.selectZip(zipFile.path);
            
            Logger.log(`ZIP processing result: ${JSON.stringify(result)}`);
            
            if (result.success) {
                Logger.log(`ZIP file processed: ${result.message}`);
                
                // Update uploaded files from the extracted files
                if (result.files.json) {
                    uploadedFiles.json = {
                        name: result.files.json.name,
                        path: result.files.json.path,
                        size: result.files.json.size
                    };
                }
                
                if (result.files.base) {
                    uploadedFiles.base = {
                        name: result.files.base.name,
                        path: result.files.base.path,
                        size: result.files.base.size
                    };
                }
                
                if (result.files.before) {
                    uploadedFiles.before = {
                        name: result.files.before.name,
                        path: result.files.before.path,
                        size: result.files.before.size
                    };
                }
                
                if (result.files.after) {
                    uploadedFiles.after = {
                        name: result.files.after.name,
                        path: result.files.after.path,
                        size: result.files.after.size
                    };
                }
                
                Logger.log(`After processing ZIP, uploadedFiles: JSON=${!!uploadedFiles.json}, Base=${!!uploadedFiles.base}, Before=${!!uploadedFiles.before}, After=${!!uploadedFiles.after}`);
                
                updateFileInfo();
            } else {
                Logger.error(`Failed to process ZIP: ${result.error || 'Unknown error'}`);
                showError(result.error || 'Failed to process ZIP file');
            }
        } catch (error) {
            Logger.error(`Exception during ZIP processing: ${error.message}`);
            showError(error.message);
        }
    }

    // Handle click on upload area to trigger file input
    filesUploadArea.addEventListener('click', (event) => {
        // Only trigger file input if the click wasn't on the upload button or other interactive elements
        if (event.target === filesUploadArea || event.target.classList.contains('upload-area') || 
            event.target.classList.contains('upload-icon') || event.target.classList.contains('upload-title') ||
            event.target.classList.contains('upload-desc')) {
            fileInput.click();
        }
    });

    // Analyze files
    analyzeBtn.addEventListener('click', async () => {
        Logger.log('Analyze button clicked');
        Logger.log(`Uploaded files status: JSON=${!!uploadedFiles.json}, Base=${!!uploadedFiles.base}, Before=${!!uploadedFiles.before}, After=${!!uploadedFiles.after}`);
        
        if (!uploadedFiles.json || !uploadedFiles.base || !uploadedFiles.before || !uploadedFiles.after) {
            Logger.warn('Attempted to analyze without all files selected');
            showError('Please select all required files (JSON, _base.log, _before.log, _after.log)');
            return;
        }

        // Show loading, hide other sections except instructions
        Logger.log('Showing loading section');
        // Hide the upload section but keep instructions visible
        const uploadSection = document.querySelector('.section:not(#analysisDashboard):not(#instructionsSection)');
        if (uploadSection) {
            uploadSection.classList.add('hidden');
        }
        loadingSection.classList.remove('hidden');
        errorSection.classList.add('hidden');

        try {
            // Get selected language
            const selectedLanguage = languageSelect.value;
            Logger.log(`Calling analyzeFiles API with language: ${selectedLanguage}`);
            const result = await window.electronAPI.analyzeFiles(selectedLanguage);
            Logger.log(`Analysis result received, success: ${result.success}`);
            
            if (result.success && result.data.success) {
                Logger.log('Analysis successful, displaying results');
                // Ensure dashboard is visible before displaying results
                analysisDashboard.classList.remove('hidden');
                analysisDashboard.style.display = 'block';
                
                displayResults(result.data);
                loadingSection.classList.add('hidden');
                
                // Add professional animations to results
                addProfessionalAnimations();
                
                // Save to recent analyses
                saveToRecentAnalyses(result.data);
                
                // Reset uploaded files
                uploadedFiles = { json: null, base: null, before: null, after: null };
                updateFileInfo();
            } else {
                const error = result.error || (result.data && result.data.error) || 'Unknown error occurred';
                Logger.error(`Analysis failed: ${error}`);
                showError(error);
                loadingSection.classList.add('hidden');
                // Show upload section again but keep instructions visible
                const uploadSection = document.querySelector('.section:not(#analysisDashboard):not(#instructionsSection)');
                if (uploadSection) {
                    uploadSection.classList.remove('hidden');
                }
                analysisDashboard.classList.add('hidden');
            }
        } catch (error) {
            Logger.error(`Exception during analysis: ${error.message}`);
            showError(error.message);
            loadingSection.classList.add('hidden');
            // Show upload section again but keep instructions visible
            const uploadSection = document.querySelector('.section:not(#analysisDashboard):not(#instructionsSection)');
            if (uploadSection) {
                uploadSection.classList.remove('hidden');
            }
            errorSection.classList.remove('hidden');
            analysisDashboard.classList.add('hidden');
        }
    });

    // Analyze another file button click
    analyzeAnotherBtn.addEventListener('click', () => {
        Logger.log('Analyze another file button clicked');
        resetToInitialState();
        // Reset files in main process
        window.electronAPI.resetFiles();
    });
    
    // Full screen button click
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            Logger.log('Full screen button clicked');
            toggleFullScreen();
        });
    }
    
    // Close full screen button click
    if (closeFullscreenBtn) {
        closeFullscreenBtn.addEventListener('click', () => {
            Logger.log('Close full screen button clicked');
            fullScreenDashboard.classList.remove('active');
        });
    }
    
    // Analyze another file button click (fullscreen)
    if (analyzeAnotherBtnFullscreen) {
        analyzeAnotherBtnFullscreen.addEventListener('click', () => {
            Logger.log('Analyze another file button clicked (fullscreen)');
            fullScreenDashboard.classList.remove('active');
            resetToInitialState();
            // Reset files in main process
            window.electronAPI.resetFiles();
        });
    }

    // Sidebar tab switching
    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            // Simplified tab switching for sidebar only
            sidebarTabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            sidebarTabs.forEach(tab => {
                tab.classList.remove('active');
            });
            
            const tabContent = document.getElementById(`${tabName}Tab`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            
            const activeTab = Array.from(sidebarTabs).find(tab => tab.getAttribute('data-tab') === tabName);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        });
    });

    backBtn.addEventListener('click', () => {
        Logger.log('Back button clicked in error section');
        errorSection.classList.add('hidden');
        // Show the upload section but keep instructions visible
        const uploadSection = document.querySelector('.section:not(#analysisDashboard):not(#instructionsSection)');
        if (uploadSection) {
            uploadSection.classList.remove('hidden');
        }
    });

    function displayResults(data) {
        Logger.log('Displaying analysis results');
        
        // Make sure the analysis dashboard is visible and upload section is hidden
        analysisDashboard.classList.remove('hidden');
        analysisDashboard.style.display = 'block';
        // Hide the upload section but keep instructions visible
        const uploadSection = document.querySelector('.section:not(#analysisDashboard):not(#instructionsSection)');
        if (uploadSection) {
            uploadSection.classList.add('hidden');
        }
        
        // Display summary cards
        displaySummary(data.summary);
        
        // Display validation results
        displayValidationResults(data.validationResults);
        
        // Display tables with actual data
        displayFailingTests(data.failingTests);
        displayFailToPassTests(data.failToPassTests);
        displayPassToPassTests(data.passToPassTests);
        
        // Add professional animations to results
        addProfessionalAnimations();
        
        // Add visualization enhancements
        addDataVisualizations();
        
        // Ensure the dashboard is visible and properly displayed
        setTimeout(() => {
            analysisDashboard.classList.remove('hidden');
            analysisDashboard.style.display = 'block';
            // Scroll to the analysis dashboard for better UX
            analysisDashboard.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    // Add data visualization enhancements
    function addDataVisualizations() {
        Logger.log('Adding data visualizations');
        
        // Add visualization to each section for better visual appeal
        const sections = document.querySelectorAll('.section:not(:first-child)');
        sections.forEach((section, index) => {
            // Skip the first section (upload files) and add delay for staggered animation
            setTimeout(() => {
                section.classList.add('fade-in-up');
            }, index * 200);
        });
    }

    function displaySummary(summary) {
        Logger.log('Displaying summary cards');
        const cards = summaryCards.querySelectorAll('.stat-card');
        
        // Update card values with animation
        if (cards.length >= 6) {
            // Animate the value changes
            const animateValue = (element, start, end, duration) => {
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    element.textContent = Math.floor(progress * (end - start) + start);
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
            };
            
            animateValue(cards[0].querySelector('.stat-value'), 0, summary.baseFailCount, 1000);
            animateValue(cards[1].querySelector('.stat-value'), 0, summary.beforeFailCount, 1000);
            animateValue(cards[2].querySelector('.stat-value'), 0, summary.afterFailCount, 1000);
            animateValue(cards[3].querySelector('.stat-value'), 0, summary.totalF2P, 1000);
            animateValue(cards[4].querySelector('.stat-value'), 0, summary.totalP2P, 1000);
            animateValue(cards[5].querySelector('.stat-value'), 0, summary.allPassCount, 1000);
        }
    }

    function displayValidationResults(results) {
        Logger.log(`Displaying ${results.length} validation results`);
        validationResults.innerHTML = '';
        
        results.forEach((result, index) => {
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
                    'No test case found'}</div>
            `;
            
            // Add smooth transition for staggered appearance
            validationItem.classList.add('smooth-transition');
            validationItem.style.transitionDelay = `${index * 0.1}s`;
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
                <tr class="smooth-transition">
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
                <tr class="smooth-transition">
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
                <tr class="smooth-transition">
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
        // Add smooth transition to error section
        errorSection.classList.add('smooth-transition');
        setTimeout(() => {
            errorSection.classList.remove('smooth-transition');
        }, 1000);
    }
    
    // Initialize recent analyses display
    Logger.log(`Initializing recent analyses display. Recent analyses count: ${recentAnalyses.length}`);
    updateRecentAnalysesDisplay();
    
    // Initialize professional animations
    addProfessionalAnimations();
    
    // Check if sidebar should be full width
    if (sidebarTabs.length === 1) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.classList.add('full-width');
        }
    }
    
    Logger.log('Application initialized successfully');
});