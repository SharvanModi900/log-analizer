# Rust Test Log Analyzer

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
│   ├── log_parser.py                     # Log parsing logic
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
python main.py
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
	- ✅ **PASS** → Green
	- ❌ **FAIL** → Red
	- ⚠️ **ABSENT** → Yellow

---

## Next Steps

- Add Python-based or other language based unit tests in the `python/` directory to validate parsing and table generation.
- Extend for multiple modules if you want to analyze more than one set of logs in one run.

