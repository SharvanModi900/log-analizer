#!/usr/bin/env python3
import json
import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add the rust directory to the path so we can import the modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'rust'))

try:
    from log_parser import parse_log_file
except ImportError:
    # If we can't import, create a simple mock version
    def parse_log_file(filepath):
        results = {}
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('test ') and ' ...' in line:
                        parts = line.split(' ...')
                        test_name = parts[0][5:].strip()  # Remove 'test ' prefix
                        if len(parts) > 1:
                            status = parts[1].strip()
                            if status == 'ok':
                                results[test_name] = 'PASS'
                            elif status == 'FAILED':
                                results[test_name] = 'FAIL'
                            else:
                                results[test_name] = status
                        else:
                            results[test_name] = 'UNKNOWN'
        except Exception as e:
            print(f"Error parsing {filepath}: {e}")
        return results

def get_status(test_name, log_results):
    """Determine if test_name is PASS, FAIL, ERROR, ABSENT or custom."""
    return log_results.get(test_name, "ABSENT")

def find_log_files(directory):
    """Find the three log files in the logs directory."""
    base_log = None
    before_log = None
    after_log = None
    
    # Check for logs directory
    logs_dir = os.path.join(directory, 'logs')
    if not os.path.exists(logs_dir):
        # If logs directory doesn't exist, use the main directory
        logs_dir = directory
    
    # Get all files in the logs directory
    if os.path.exists(logs_dir):
        files = [f for f in os.listdir(logs_dir) if os.path.isfile(os.path.join(logs_dir, f))]
        
        # Look for files containing the specific substrings
        for file in files:
            file_path = os.path.join(logs_dir, file)
            if '_base.log' in file and base_log is None:
                base_log = file_path
            elif '_before.log' in file and before_log is None:
                before_log = file_path
            elif '_after.log' in file and after_log is None:
                after_log = file_path
    
    return base_log, before_log, after_log

def load_json_file(directory):
    """Find and load the first JSON file in the logs directory."""
    # Check for logs directory
    logs_dir = os.path.join(directory, 'logs')
    if not os.path.exists(logs_dir):
        # If logs directory doesn't exist, use the main directory
        logs_dir = directory
    
    # Look for JSON files in the logs directory
    if os.path.exists(logs_dir):
        for file in os.listdir(logs_dir):
            if file.endswith(".json"):
                filepath = os.path.join(logs_dir, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    raise Exception(f"Error loading JSON file {filepath}: {e}")
    
    # If no JSON file is found, return empty structure instead of raising an error
    return {"fail_to_pass": [], "pass_to_pass": []}

def validate_test_conditions(f2p_tests, p2p_tests, base_results, before_results, after_results):
    """Validate the required conditions for the test analysis."""
    validation_results = []
    
    # Convert to sets for easier operations
    f2p_set = set(f2p_tests)
    p2p_set = set(p2p_tests)
    
    # 1. At least one failed test in base is present in P2P
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

def analyze_logs(logs_directory):
    """Analyze logs and return results as JSON."""
    try:
        # Load test definitions from JSON
        data = load_json_file(logs_directory)

        f2p_tests = data.get("fail_to_pass", [])
        p2p_tests = data.get("pass_to_pass", [])

        # Load logs by suffix
        base_log_path, before_log_path, after_log_path = find_log_files(logs_directory)
        
        if not base_log_path or not before_log_path or not after_log_path:
            raise FileNotFoundError("Missing required log files (_base.log, _before.log, _after.log)")
        
        base_results = parse_log_file(base_log_path)
        before_results = parse_log_file(before_log_path)
        after_results = parse_log_file(after_log_path)
        
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
            "success": True,
            "validationResults": validation_results,
            "failingTests": failing_tests_rows,
            "failToPassTests": f2p_table,
            "passToPassTests": p2p_table,
            "summary": {
                "totalF2P": len(f2p_tests),
                "totalP2P": len(p2p_tests),
                "baseFailCount": sum(1 for status in base_results.values() if status.startswith("FAIL")),
                "beforeFailCount": sum(1 for status in before_results.values() if status.startswith("FAIL")),
                "afterFailCount": sum(1 for status in after_results.values() if status.startswith("FAIL")),
                "allPassCount": all_pass_count
            }
        }
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"success": False, "error": "Usage: python log_analyzer.py <logs_directory>"}))
        sys.exit(1)
    
    logs_directory = sys.argv[1]
    result = analyze_logs(logs_directory)
    print(json.dumps(result, indent=2))