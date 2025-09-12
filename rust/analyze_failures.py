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

    f2p_tests = set(data.get("fail_to_pass", []))
    p2p_tests = set(data.get("pass_to_pass", []))
    
    print(f"Number of F2P tests: {len(f2p_tests)}")
    print(f"Number of P2P tests: {len(p2p_tests)}")
    
    # Load logs by suffix
    base_results = parse_log_file(find_file_by_suffix("_base.log"))
    before_results = parse_log_file(find_file_by_suffix("_before.log"))
    after_results = parse_log_file(find_file_by_suffix("_after.log"))
    
    # Find failing tests in each log
    base_failures = {test_name for test_name, result in base_results.items() if result.startswith("FAIL")}
    before_failures = {test_name for test_name, result in before_results.items() if result.startswith("FAIL")}
    after_failures = {test_name for test_name, result in after_results.items() if result.startswith("FAIL")}
    
    print(f"\nNumber of failing tests:")
    print(f"  Base: {len(base_failures)}")
    print(f"  Before: {len(before_failures)}")
    print(f"  After: {len(after_failures)}")
    
    # Check validation conditions:
    print("\n=== VALIDATION CHECKS ===")
    
    # 1. At least one failed test in base is present in P2P
    base_failures_in_p2p = base_failures.intersection(p2p_tests)
    print(f"\n1. Failed tests in base that are P2P: {len(base_failures_in_p2p)}")
    if base_failures_in_p2p:
        print(f"   Examples: {list(base_failures_in_p2p)[:5]}")
    
    # 2. At least one failed test in after is present in F2P / P2P
    after_failures_in_categories = after_failures.intersection(f2p_tests.union(p2p_tests))
    print(f"\n2. Failed tests in after that are F2P/P2P: {len(after_failures_in_categories)}")
    if after_failures_in_categories:
        print(f"   Examples: {list(after_failures_in_categories)[:5]}")
    
    # 3. At least one F2P test is present and successful in before
    successful_f2p_in_before = {test_name for test_name in f2p_tests if test_name in before_results and before_results[test_name].startswith("PASS")}
    print(f"\n3. F2P tests that are successful in before: {len(successful_f2p_in_before)}")
    if successful_f2p_in_before:
        print(f"   Examples: {list(successful_f2p_in_before)[:5]}")
    
    # 4. At least one P2P, that is missing in base, is not passing in before
    p2p_missing_in_base_not_passing = {
        test_name for test_name in p2p_tests 
        if test_name not in base_results and (test_name not in before_results or not before_results[test_name].startswith("PASS"))
    }
    print(f"\n4. P2P tests missing in base and not passing in before: {len(p2p_missing_in_base_not_passing)}")
    if p2p_missing_in_base_not_passing:
        print(f"   Examples: {list(p2p_missing_in_base_not_passing)[:5]}")
    
    # Additional analysis - check if any P2P tests are missing from base
    p2p_missing_from_base = {test_name for test_name in p2p_tests if test_name not in base_results}
    print(f"\nAdditional info:")
    print(f"  P2P tests missing from base: {len(p2p_missing_from_base)}")
    if p2p_missing_from_base:
        print(f"    Examples: {list(p2p_missing_from_base)[:5]}")
        
    # Check if any of these missing P2P tests are in before
    missing_p2p_in_before = {test_name for test_name in p2p_missing_from_base if test_name in before_results}
    print(f"  Missing P2P tests that are in before: {len(missing_p2p_in_before)}")
    if missing_p2p_in_before:
        print(f"    Examples: {list(missing_p2p_in_before)[:5]}")
        
    # Check their status in before
    if missing_p2p_in_before:
        print(f"  Status of missing P2P tests in before:")
        for test_name in list(missing_p2p_in_before)[:5]:
            status = before_results[test_name]
            print(f"    {test_name}: {status}")

if __name__ == "__main__":
    main()