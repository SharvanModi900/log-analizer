Rust Log Analyzer - Installer Package
===================================

This package contains all the necessary files to install the Rust Log Analyzer application on a Windows system.

Prerequisites:
-------------

Before installing, please ensure you have the following installed on your system:
1. Node.js (version 14 or higher) - https://nodejs.org/
2. Python (version 3.6 or higher) - https://www.python.org/

Installation:
-------------

1. Double-click on "install.bat" to start the installation process
2. Follow the on-screen instructions
3. The installer will:
   - Check for prerequisites
   - Copy application files to "%ProgramFiles%\Rust Log Analyzer"
   - Install Node.js dependencies
   - Install Python dependencies
   - Create a desktop shortcut

Running the Application:
-----------------------

After installation, you can run the application by:
1. Double-clicking the "Rust Log Analyzer" shortcut on your desktop
2. Or running "Rust Log Analyzer.exe" from the installation directory

Uninstallation:
--------------

To uninstall the application:
1. Double-click on "uninstall.bat" in the installation directory
2. Or manually delete the "%ProgramFiles%\Rust Log Analyzer" directory
3. Remove the desktop shortcut manually if it still exists

Features:
--------

- Analyze Rust test logs across different commit states
- Upload ZIP files containing test logs
- Automatic analysis of test results across Base, Before, and After states
- Validation checks for specific test conditions
- Visual display of failing tests and their categories
- Custom splash screen and application icons

Troubleshooting:
---------------

If you encounter any issues:

1. Make sure all prerequisites are installed correctly
2. Check that you have the necessary permissions to install packages
3. Ensure your Python environment is properly configured
4. If the application fails to start, check the console for error messages

For support, please contact the development team.