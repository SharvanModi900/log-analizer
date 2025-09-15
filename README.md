# Rust Test Log Analyzer

A desktop application built with Electron and Python to analyze Rust test logs across different commit states.

## Features

- Upload ZIP files containing Rust test logs
- Automatic analysis of test results across three states:
  - Base (no patches)
  - Before (test patch applied)
  - After (test patch + gold patch applied)
- Validation checks for specific test conditions
- Visual display of failing tests and their categories
- User-friendly interface with clear results presentation

## Requirements

- Node.js (v14 or higher)
- Python (v3.6 or higher)
- npm (comes with Node.js)

## Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```
   cd log-analyzer
   ```
3. Install Node.js dependencies:
   ```
   npm install
   ```
4. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Start the application:
   ```
   npm start
   ```
2. Click "Select ZIP File" to upload your log files
3. The application will automatically analyze the logs and display results

## ZIP File Structure

The ZIP file should contain the following files:
- `_base.log` - Base test results
- `_before.log` - Before patch test results
- `_after.log` - After patch test results
- `.json` - Test definitions (containing fail_to_pass and pass_to_pass arrays)

## Validation Checks

The application performs the following validation checks:
1. At least one failed test in base is present in P2P
2. At least one failed test in after is present in F2P / P2P
3. At least one F2P test is present and successful in before
4. At least one P2P, that is missing in base, is not passing in before

## Development

To modify the application:

1. Update the Electron frontend in the `electron/` directory
2. Modify the Python analysis logic in `electron/log_analyzer.py`
3. The core log parsing logic is in `rust/log_parser.py`

## Building

To build the application for distribution:
```
npm run build
```

## Customizing the Application Icon

To change the application icon:

1. Modify the [icon.svg](file:///d:/turing/log-analyzer/icon.svg) file in the root directory
2. The current icon design has no text, which makes it appear cleaner and larger in the taskbar
3. Convert the SVG to PNG using one of these methods:
   - Open [icon-preview.html](file:///d:/turing/log-analyzer/icon-preview.html) in a browser, take a screenshot and save as [icon.png](file:///d:/turing/log-analyzer/icon.png) (1024x1024)
   - Use an online converter like https://svgtopng.com/
   - Use an image editor like Inkscape or Adobe Illustrator
4. Run the following command to generate platform-specific icons:
   ```
   npm run build-icons
   ```
5. The icons will be automatically generated and copied to the appropriate directories:
   - Windows: `build/icons/win/icon.ico`
   - macOS: `build/icons/mac/icon.icns`
   - Linux: `build/icons/png/1024x1024.png`

6. Rebuild the application:
   ```
   npm run dist
   ```

The application will now use your custom icon without text in the taskbar, Start Menu, and installer, making it appear larger and cleaner.

## License

MIT

## Table of Contents
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Notes](#notes)
- [Next Steps](#next-steps)

---

This tool helps analyze Rust test results across three commits:
- **Base**: no patches applied  
- **Before**: test patch applied  
- **After**: test patch + gold (solution) patch applied  

It reads:
- A JSON file containing `fail_to_pass` and `pass_to_pass` test definitions.
- Corresponding Rust execution log files (`*_base.log`, `*_before.log`, `*_after.log`).

The tool then produces clear, tabulated reports showing whether each test is **PASS**, **FAIL**, or **ABSENT** across the three commits.

---

## Project Structure

```
repo-root/
├── rust/
│   ├── logs/
│   │   ├── module_name_status.log/json   # Contains .log and .json files
│   ├── main.py                           # Entry point for analysis
│   ├── utils.py                          # Utility functions (coloring, helpers)
│   ├── log_parser.py                    # Log parsing logic
├── python/                               # (reserved for Python test harnesses)
├── README.md                             # You are here
├── requirements.txt                      # Python dependencies

````

---

## Setup Instructions

1. **Clone the repository**

```bash
git clone https://github.com/rinsane/log-analyzer.git
cd log-analyzer/rust
```

2. **Create and activate a virtual environment**

```bash
python3 -m venv venv
source venv/bin/activate   # On macOS/Linux
venv\Scripts\activate      # On Windows
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```
   
Dependencies:
	- `colorama` -> colored terminal output
	- `tabulate` -> nice ASCII tables

---

## Usage

1. **Prepare your logs**
	- Place your Rust test execution logs in `rust/logs/log_files/`:
		- `module_name_base.log`
		- `module_name_before.log`
		- `module_name_after.log`
		- `module_name_tests.json` (contains `fail_to_pass` and `pass_to_pass` test names)

Example JSON:

```json
{
	// ... other key-value pairs
	
	"fail_to_pass": [
		"test_1::test_f2p_1",
		"test_2::test_f2p_2"
	],
	"pass_to_pass": [
		"test_1::test_p2p_1"
		"test_2::test_p2p_2"
	]
	
	// ... other key-value pairs
}
```

2. **Run the analyzer**

```bash
python3 main.py
```

3. **View results**
	- You'll see two tables:
		- **fail_to_pass**: tests that should fail/absent in base & before, and pass in after.
		- **pass_to_pass**: tests that must pass in base & after (fail/absent in before is acceptable).

Example output:
```
fail_to_pass:
+---+-------------------------+--------+--------+--------+
| # | test name               | base   | before | after  |
+---+-------------------------+--------+--------+--------+
| 1 | test_1::test_f2p_1      | ABSENT | FAIL   | PASS   |
| 1 | test_2::test_f2p_2      | ABSENT | FAIL   | PASS   |
+---+-------------------------+--------+--------+--------+

pass_to_pass:
+---+-------------------------+--------+--------+--------+
| # | test name               | base   | before | after  |
+---+-------------------------+--------+--------+--------+
| 1 | test_2::test_p2p_2      | PASS   | FAIL   | PASS   |
+---+-------------------------+--------+--------+--------+

Note: 1 out of 2 pass_to_pass tests passed in all 3 commits and were not displayed.
```

---

## Notes

- Only one `.json` file and one set of `*_base.log`, `*_before.log`, `*_after.log` are expected in `logs/log_files/` at a time.
- Tests that **always PASS** in all commits are summarized at the end, not shown in the main table.
- Output coloring:
	- ✅ **PASS**   -> Green
	- ❌ **FAIL**   -> Red
	- ⚠️  **ABSENT** -> Yellow

---

## Next Steps

- Add Python-based or other language based unit tests in the `python/` directory to validate parsing and table generation.
- Extend for multiple modules if you want to analyze more than one set of logs in one run.

