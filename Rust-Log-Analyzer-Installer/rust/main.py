import json
import os
from tabulate import tabulate
from log_parser import parse_log_file
from utils import colorize_status, get_status, colorize_text, colorize_boolean

LOG_DIR = "rust/logs"

def find_file_by_suffix(suffix):
    """
    Return the first file path in LOG_DIR that ends with the given suffix.
    Raises FileNotFoundError if not found.
    """
    for file in os.listdir(LOG_DIR):
        if file.endswith(suffix):
            return os.path.join(LOG_DIR, file)
    raise FileNotFoundError(f"No file found with suffix {suffix} in {LOG_DIR}")

def load_json_file():
    """
    Find and load the first JSON filecolor  in the logs directory.
    Assumes there is only one JSON per run.
    """
    for file in os.listdir(LOG_DIR):
        if file.endswith(".json"):
            filepath = os.path.join(LOG_DIR, file)
            with open(filepath, "r", encoding="utf-8") as f:
                return json.load(f)
    raise FileNotFoundError("No JSON file found in logs/ directory.")

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
        validation_results.append(("PASS", "At least one failed test in base is present in P2P", base_failures_in_p2p))
    else:
        validation_results.append(("FAIL", "At least one failed test in base is present in P2P", []))
    
    # 2. At least one failed test in after is present in F2P / P2P
    # Looking for tests that failed in after but are classified as F2P or P2P
    after_failures_in_categories = []
    for test_name, result in after_results.items():
        if result.startswith("FAIL") and (test_name in f2p_set or test_name in p2p_set):
            after_failures_in_categories.append(test_name)
    
    if after_failures_in_categories:
        validation_results.append(("PASS", "At least one failed test in after is present in F2P / P2P", after_failures_in_categories))
    else:
        validation_results.append(("FAIL", "At least one failed test in after is present in F2P / P2P", []))
    
    # 3. At least one F2P test is present and successful in before
    # Looking for F2P tests that are passing in the before state (main patch applied)
    successful_f2p_in_before = []
    for test_name in f2p_set:
        if test_name in before_results and before_results[test_name].startswith("PASS"):
            successful_f2p_in_before.append(test_name)
    
    if successful_f2p_in_before:
        validation_results.append(("PASS", "At least one F2P test is present and successful in before", successful_f2p_in_before))
    else:
        validation_results.append(("FAIL", "At least one F2P test is present and successful in before", []))
    
    # 4. At least one P2P, that is missing in base, is not passing in before
    # This validation checks for P2P tests that:
    # - Are NOT present in base log (missing in base)
    # - Are NOT passing in before log (either absent or not PASS)
    # 
    # The requirement is: "At least one P2P, that is missing in base, is not passing in before"
    # This means we want to find at least one such test, so if we find any, the validation PASSES
    p2p_missing_in_base_not_passing = []
    debug_info = []  # For debugging
    
    # Add debug information about specific test case mentioned
    specific_test = "cargo_add::yanked::case"
    debug_info.append(f"Checking specific test: {specific_test}")
    debug_info.append(f"Is in P2P set: {specific_test in p2p_set}")
    
    if specific_test in p2p_set:
        specific_base_status = base_results.get(specific_test, "ABSENT")
        specific_before_status = before_results.get(specific_test, "ABSENT")
        debug_info.append(f"SPECIFIC CHECK - {specific_test}: base={specific_base_status}, before={specific_before_status}")
        
        # Check if this specific test meets our criteria
        specific_is_missing_in_base = specific_test not in base_results
        specific_is_not_passing_in_before = (specific_test not in before_results or 
                                            not before_results[specific_test].startswith("PASS"))
        
        debug_info.append(f"SPECIFIC CHECK - {specific_test}: missing_in_base={specific_is_missing_in_base}, not_passing_in_before={specific_is_not_passing_in_before}")
        
        # Show some base results to understand the data
        debug_info.append(f"Sample base results (first 10): {dict(list(base_results.items())[:10])}")
        
        # Check if there are similar test names in base results
        similar_tests = [name for name in base_results.keys() if "yanked" in name.lower()]
        if similar_tests:
            debug_info.append(f"Similar 'yanked' tests in base: {similar_tests[:5]}")
            for test in similar_tests[:3]:  # Show first 3
                debug_info.append(f"  {test}: {base_results[test]}")
        
        # Check if there are similar test names in p2p list
        similar_p2p = [name for name in p2p_set if "yanked" in name.lower()]
        if similar_p2p:
            debug_info.append(f"Similar 'yanked' tests in P2P list: {similar_p2p}")
    
    # Check for potential naming mismatches
    base_test_names = list(base_results.keys())
    before_test_names = list(before_results.keys())
    
    # Look for partial matches for the specific test case
    partial_matches_in_base = [name for name in base_test_names if specific_test in name or name in specific_test]
    partial_matches_in_before = [name for name in before_test_names if specific_test in name or name in specific_test]
    
    if partial_matches_in_base:
        debug_info.append(f"PARTIAL MATCHES in base for '{specific_test}': {partial_matches_in_base[:5]}")  # Show first 5
        for match in partial_matches_in_base[:5]:  # Show details for first 5
            debug_info.append(f"  {match}: {base_results[match]}")
    
    if partial_matches_in_before:
        debug_info.append(f"PARTIAL MATCHES in before for '{specific_test}': {partial_matches_in_before[:5]}")  # Show first 5
        for match in partial_matches_in_before[:5]:  # Show details for first 5
            debug_info.append(f"  {match}: {before_results[match]}")
    
    # Also check for cargo_add tests specifically
    cargo_add_base = [name for name in base_test_names if "cargo_add" in name]
    cargo_add_p2p = [name for name in p2p_set if "cargo_add" in name]
    
    if cargo_add_base:
        debug_info.append(f"Cargo add tests in base (first 10): {cargo_add_base[:10]}")
    if cargo_add_p2p:
        debug_info.append(f"Cargo add tests in P2P list (first 10): {cargo_add_p2p[:10]}")
    
    for test_name in p2p_set:
        # Check if test is missing in base (not present in base_results)
        is_missing_in_base = test_name not in base_results
        
        # Check if test is not passing in before
        is_not_passing_in_before = (test_name not in before_results or 
                                   not before_results[test_name].startswith("PASS"))
        
        # If both conditions are true, add to our list
        if is_missing_in_base and is_not_passing_in_before:
            p2p_missing_in_base_not_passing.append(test_name)
            # Add detailed debug information for first 10 matches
            if len(p2p_missing_in_base_not_passing) <= 10:
                base_status = base_results.get(test_name, "ABSENT")
                before_status = before_results.get(test_name, "ABSENT")
                debug_info.append(f"{test_name}: base={base_status}, before={before_status}")
    
    # This validation should PASS if we find at least one such test
    if p2p_missing_in_base_not_passing:
        validation_results.append(("PASS", "At least one P2P, that is missing in base, is not passing in before", p2p_missing_in_base_not_passing))
    else:
        validation_results.append(("FAIL", "At least one P2P, that is missing in base, is not passing in before", []))
    
    # Add debug information to the results
    if debug_info:
        validation_results.append(("DEBUG", "P2P tests missing in base and not passing in before (for debugging)", debug_info))
    
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
            colorize_status(base_status),
            colorize_status(before_status),
            colorize_status(after_status),
        ])

    # Add serial numbers
    rows_with_index = [[i + 1] + row for i, row in enumerate(rows)]
    return rows_with_index, all_pass_count, skipped_tests

def main():
    # Load test definitions from JSON
    data = load_json_file()

    f2p_tests = data.get("fail_to_pass", [])
    p2p_tests = data.get("pass_to_pass", [])

    # Load logs by suffix
    base_results = parse_log_file(find_file_by_suffix("_base.log"))
    before_results = parse_log_file(find_file_by_suffix("_before.log"))
    after_results = parse_log_file(find_file_by_suffix("_after.log"))
    
    # Validate test conditions
    print("Validation Results:")
    print("=" * 80)
    
    # Explanation of what we're checking
    print("Checking the following conditions across all three log files:")
    print("1. At least one failed test in base is present in P2P")
    print("   (Tests that were failing in base but should remain passing)")
    print("2. At least one failed test in after is present in F2P / P2P")
    print("   (Tests that are still failing after applying both patches)")
    print("3. At least one F2P test is present and successful in before")
    print("   (Tests that were failing but now pass with the main patch)")
    print("4. At least one P2P, that is missing in base, is not passing in before")
    print("   (New P2P tests that don't exist in base and fail with main patch)")
    print("-" * 80)
    
    validation_results = validate_test_conditions(f2p_tests, p2p_tests, base_results, before_results, after_results)
    all_validations_passed = True
    
    # Prepare table data for validation results
    validation_table = []
    for status, description, examples in validation_results:
        # Skip debug entries for the summary table
        if status in ["DEBUG", "DEBUG_INFO"]:
            continue
        status_text = colorize_text(status, "green" if status == "PASS" else "red")
        example_count = len(examples)
        example_text = f"{example_count} examples" if example_count > 0 else "No examples"
        validation_table.append([status_text, description, example_text])
        if status == "FAIL":
            all_validations_passed = False
    
    print(tabulate(validation_table, headers=["Status", "Validation Check", "Count"], tablefmt="grid"))
    
    # Show detailed information about each validation in table format
    print("\nDetailed Validation Results:")
    print("=" * 80)
    validation_index = 1
    for status, description, examples in validation_results:
        # Skip debug entries for the detailed view
        if status in ["DEBUG", "DEBUG_INFO"]:
            continue
            
        status_text = colorize_text(status, "green" if status == "PASS" else "red")
        print(f"\n{validation_index}. {description}: {status_text}")
        
        if examples:
            # Create a table for the examples
            example_rows = [[i+1, example] for i, example in enumerate(examples)]
            print(f"   Found {len(examples)} test(s):")
            print(tabulate(example_rows, headers=["#", "Test Name"], tablefmt="grid"))
        else:
            print("   No matching tests found.")
        validation_index += 1
    
    # Show debug information if available
    for status, description, examples in validation_results:
        if status == "DEBUG_INFO":
            print(f"\n{description}:")
            for example in examples:
                print(f"   {example}")
        elif status == "DEBUG":
            print(f"\n{description}:")
            # Show all debug info without truncation for now
            for example in examples:
                print(f"   {example}")
    
    if all_validations_passed:
        print(f"\n{colorize_text('All validation checks passed!', 'green')}")
    else:
        print(f"\n{colorize_text('Some validation checks failed!', 'red')}")
    print("=" * 80)
    
    # Show all failing tests in a single table
    print("\nFailing tests across all states:")
    all_test_names = set(base_results.keys()) | set(before_results.keys()) | set(after_results.keys())
    failing_tests_rows = []
    
    # Create sets for quick lookup
    f2p_set = set(f2p_tests)
    p2p_set = set(p2p_tests)
    
    # Counters for debugging
    base_fail_count = sum(1 for status in base_results.values() if status.startswith("FAIL"))
    before_fail_count = sum(1 for status in before_results.values() if status.startswith("FAIL"))
    after_fail_count = sum(1 for status in after_results.values() if status.startswith("FAIL"))
    
    print("=" * 50)
    print("FAILING TEST COUNTS:")
    print(f"Base log:   {base_fail_count} failing tests")
    print(f"Before log: {before_fail_count} failing tests")
    print(f"After log:  {after_fail_count} failing tests")
    print("=" * 50)
    
    for test_name in all_test_names:
        base_status = get_status(test_name, base_results)
        before_status = get_status(test_name, before_results)
        after_status = get_status(test_name, after_results)
        
        # Check if any state has a FAIL status
        if (base_status.startswith("FAIL") or 
            before_status.startswith("FAIL") or 
            after_status.startswith("FAIL")):
            # Determine category membership
            in_f2p = colorize_boolean("Yes" if test_name in f2p_set else "No")
            in_p2p = colorize_boolean("Yes" if test_name in p2p_set else "No")
                
            failing_tests_rows.append([
                test_name,
                in_f2p,
                in_p2p,
                colorize_status(base_status),
                colorize_status(before_status),
                colorize_status(after_status)
            ])
    
    if failing_tests_rows:
        print(f"\nTOTAL UNIQUE FAILING TESTS ACROSS ALL STATES: {len(failing_tests_rows)}")
        print(tabulate(failing_tests_rows, headers=["Test Name", "f2p(present)", "p2p(present)", "Base", "Before", "After"], tablefmt="grid"))
    else:
        print("No failing tests found across any state.")

    # Fail to Pass
    print("\nfail_to_pass:")
    f2p_table, _, _ = make_table(f2p_tests, base_results, before_results, after_results)
    print(tabulate(f2p_table, headers=["#", "test name", "base", "before", "after"], tablefmt="grid"))

    # Pass to Pass
    print("\npass_to_pass:")
    p2p_table, all_pass_count, skipped_tests = make_table(
        p2p_tests, base_results, before_results, after_results, filter_all_pass=True
    )
    print(tabulate(p2p_table, headers=["#", "test name", "base", "before", "after"], tablefmt="grid"))
    # print(skipped_tests) # do this if you wish to see which tests were skipped in the table

    # Summary for skipped tests
    total_p2p = len(p2p_tests)
    if all_pass_count > 0:
        colorized_all_pass = colorize_text(str(all_pass_count), "green")
        colorized_total = colorize_text(str(total_p2p), "blue")
        print(f"\nNote: {colorized_all_pass} out of {colorized_total} pass_to_pass tests passed in all 3 commits and were not displayed.")

if __name__ == "__main__":
    main()