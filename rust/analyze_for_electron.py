import json
import os
import sys
from log_parser import parse_log_file

# Add the current directory to the path so we can import utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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
    Find and load the first JSON file in the logs directory.
    Assumes there is only one JSON per run.
    """
    LOG_DIR = "rust/logs"
    for file in os.listdir(LOG_DIR):
        if file.endswith(".json"):
            filepath = os.path.join(LOG_DIR, file)
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError("No JSON file found in logs/ directory.")

def get_status(test_name, log_results):
    """
    Determine if test_name is PASS, FAIL, ERROR, ABSENT or custom.
    """
    return log_results.get(test_name, "ABSENT")

def validate_test_conditions(f2p_tests, p2p_tests, base_results, before_results, after_results):
    """
    Validate the required conditions for the test analysis.
    Returns a list of validation results with detailed information.
    """
    validation_results = []
    
    # Convert to sets for easier operations
    f2p_set = set(f2p_tests)
    p2p_set = set(p2p_tests)
    
    # 1. At least one failed test in base is present in P2P
    # Looking for tests that failed in base but are classified as P2P (should remain passing)
    base_failures_in_p2p = []
    for test_name, result in base_results.items():
        if result.startswith("FAIL") and test_name in p2p_set:
            base_failures_in_p2p.append(test_name)
    
    if base_failures_in_p2p:
        validation_results.append({
            "status": "PASS",
            "description": "At least one failed test in base is present in P2P",
            "examples": base_failures_in_p2p
        })
    else:
        validation_results.append({
            "status": "FAIL",
            "description": "At least one failed test in base is present in P2P",
            "examples": []
        })
    
    # 2. At least one failed test in after is present in F2P / P2P
    # Looking for tests that failed in after but are classified as F2P or P2P
    after_failures_in_categories = []
    for test_name, result in after_results.items():
        if result.startswith("FAIL") and (test_name in f2p_set or test_name in p2p_set):
            after_failures_in_categories.append(test_name)
    
    if after_failures_in_categories:
        validation_results.append({
            "status": "PASS",
            "description": "At least one failed test in after is present in F2P / P2P",
            "examples": after_failures_in_categories
        })
    else:
        validation_results.append({
            "status": "FAIL",
            "description": "At least one failed test in after is present in F2P / P2P",
            "examples": []
        })
    
    # 3. At least one F2P test is present and successful in before
    # Looking for F2P tests that are passing in the before state (main patch applied)
    successful_f2p_in_before = []
    for test_name in f2p_set:
        if test_name in before_results and before_results[test_name].startswith("PASS"):
            successful_f2p_in_before.append(test_name)
    
    if successful_f2p_in_before:
        validation_results.append({
            "status": "PASS",
            "description": "At least one F2P test is present and successful in before",
            "examples": successful_f2p_in_before
        })
    else:
        validation_results.append({
            "status": "FAIL",
            "description": "At least one F2P test is present and successful in before",
            "examples": []
        })
    
    # 4. At least one P2P, that is missing in base, is not passing in before
    # This validation checks for P2P tests that:
    # - Are NOT present in base log (missing in base)
    # - Are NOT passing in before log (either absent or not PASS)
    p2p_missing_in_base_not_passing = []
    for test_name in p2p_set:
        # Check if test is missing in base (not present in base_results)
        is_missing_in_base = test_name not in base_results
        
        # Check if test is not passing in before
        is_not_passing_in_before = (test_name not in before_results or 
                                   not before_results[test_name].startswith("PASS"))
        
        # If both conditions are true, add to our list
        if is_missing_in_base and is_not_passing_in_before:
            p2p_missing_in_base_not_passing.append(test_name)
    
    # This validation should PASS if we find at least one such test
    if p2p_missing_in_base_not_passing:
        validation_results.append({
            "status": "PASS",
            "description": "At least one P2P, that is missing in base, is not passing in before",
            "examples": p2p_missing_in_base_not_passing
        })
    else:
        validation_results.append({
            "status": "FAIL",
            "description": "At least one P2P, that is missing in base, is not passing in before",
            "examples": []
        })
    
    return validation_results

def make_table(test_names, base_results, before_results, after_results, filter_all_pass=False):
    rows = []
    all_pass_count = 0
    skipped_tests = []

    for test in test_names:
        base_status = get_status(test, base_results)
        before_status = get_status(test, before_results)
        after_status = get_status(test, after_results)

        # Check if all three are PASS
        if filter_all_pass and (base_status == before_status == after_status == "PASS"):
            all_pass_count += 1
            skipped_tests.append(test)
            continue  # skip printing these

        rows.append([
            test,
            base_status,
            before_status,
            after_status,
        ])

    # Add serial numbers
    rows_with_index = [[i + 1] + row for i, row in enumerate(rows)]
    return rows_with_index, all_pass_count, skipped_tests

def main():
    try:
        # Load test definitions from JSON
        data = load_json_file()

        f2p_tests = data.get("fail_to_pass", [])
        p2p_tests = data.get("pass_to_pass", [])

        # Load logs by suffix
        base_results = parse_log_file(find_file_by_suffix("_base.log"))
        before_results = parse_log_file(find_file_by_suffix("_before.log"))
        after_results = parse_log_file(find_file_by_suffix("_after.log"))
        
        # Validate test conditions
        validation_results = validate_test_conditions(f2p_tests, p2p_tests, base_results, before_results, after_results)
        
        # Show all failing tests in a single table
        all_test_names = set(base_results.keys()) | set(before_results.keys()) | set(after_results.keys())
        failing_tests_rows = []
        
        # Create sets for quick lookup
        f2p_set = set(f2p_tests)
        p2p_set = set(p2p_tests)
        
        for test_name in all_test_names:
            base_status = get_status(test_name, base_results)
            before_status = get_status(test_name, before_results)
            after_status = get_status(test_name, after_results)
            
            # Check if any state has a FAIL status
            if (base_status.startswith("FAIL") or 
                before_status.startswith("FAIL") or 
                after_status.startswith("FAIL")):
                # Determine category membership
                in_f2p = "Yes" if test_name in f2p_set else "No"
                in_p2p = "Yes" if test_name in p2p_set else "No"
                    
                failing_tests_rows.append([
                    test_name,
                    in_f2p,
                    in_p2p,
                    base_status,
                    before_status,
                    after_status
                ])
        
        # Fail to Pass
        f2p_table, _, _ = make_table(f2p_tests, base_results, before_results, after_results)
        
        # Pass to Pass
        p2p_table, all_pass_count, skipped_tests = make_table(
            p2p_tests, base_results, before_results, after_results, filter_all_pass=True
        )
        
        # Prepare the result
        result = {
            "validationResults": validation_results,
            "failingTests": failing_tests_rows,
            "failToPassTests": f2p_table,
            "passToPassTests": p2p_table
        }
        
        # Output as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()