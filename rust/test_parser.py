import json
import os
from log_parser import parse_log_file

def find_file_by_suffix(suffix):
    """
    Return the first file path in LOG_DIR that ends with the given suffix.
    Raises FileNotFoundError if not found.
    """
    LOG_DIR = "rust/logs"
    for file in os.listdir(LOG_DIR):
        if file.endswith(suffix):
            return os.path.join(LOG_DIR, file)
    raise FileNotFoundError(f"No file found with suffix {suffix} in {LOG_DIR}")

def load_json_file():
    """
    Find and load the first JSON filecolor  in the logs directory.
    Assumes there is only one JSON per run.
    """
    LOG_DIR = "rust/logs"
    for file in os.listdir(LOG_DIR):
        if file.endswith(".json"):
            filepath = os.path.join(LOG_DIR, file)
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError("No JSON file found in logs/ directory.")

def main():
    # Load test definitions from JSON
    data = load_json_file()

    p2p_tests = data.get("pass_to_pass", [])
    
    # Check if cargo_add::yanked::case is in the P2P list
    specific_test = "cargo_add::yanked::case"
    print(f"Is '{specific_test}' in P2P list: {specific_test in p2p_tests}")
    
    # Load logs by suffix
    base_results = parse_log_file(find_file_by_suffix("_base.log"))
    before_results = parse_log_file(find_file_by_suffix("_before.log"))
    after_results = parse_log_file(find_file_by_suffix("_after.log"))
    
    # Method 1: Using .get() with default "ABSENT" (as in debug code)
    specific_base_status = base_results.get(specific_test, "ABSENT")
    specific_before_status = before_results.get(specific_test, "ABSENT")
    print(f"Method 1 - Using .get(): base={specific_base_status}, before={specific_before_status}")
    
    # Method 2: Using "not in" check (as in validation logic)
    is_missing_in_base = specific_test not in base_results
    is_not_passing_in_before = (specific_test not in before_results or 
                               not before_results[specific_test].startswith("PASS") if specific_test in before_results else True)
    print(f"Method 2 - Using 'not in': missing_in_base={is_missing_in_base}, not_passing_in_before={is_not_passing_in_before}")
    
    # Check the actual values
    if specific_test in base_results:
        print(f"Actual base result: {base_results[specific_test]}")
        print(f"Does it start with PASS: {base_results[specific_test].startswith('PASS')}")
    else:
        print("Test not found in base_results")

if __name__ == "__main__":
    main()