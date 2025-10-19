#!/usr/bin/env python3
import json
import os
import re
import sys
import tempfile
import shutil
from pathlib import Path

# Add the rust directory to the path so we can import the modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'rust'))

try:
    from log_parser import parse_log_file as parse_rust_log_file
    from js_log_parser import parse_js_log_file
except ImportError:
    # If we can't import, create a simple mock version
    def parse_rust_log_file(filepath):
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

    def parse_js_log_file(filepath):
        results = {}
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    if 'PASS' in line or 'FAIL' in line:
                        # Simplified parsing for JS logs
                        if 'PASS' in line:
                            test_name = line.replace('PASS', '').strip()
                            results[test_name] = 'PASS'
                        elif 'FAIL' in line:
                            test_name = line.replace('FAIL', '').strip()
                            results[test_name] = 'FAIL'
        except Exception as e:
            print(f"Error parsing JS log {filepath}: {e}")
        return results

def get_status(test_name, log_results, language="rust"):
    """Determine if test_name is PASS, FAIL, ERROR, ABSENT or custom."""
    # For JavaScript tests, check for containment matches
    if language.lower() in ["javascript", "js"]:
        # Look for any log test that contains this test name
        for log_test, status in log_results.items():
            # For JS tests, we might need to match just the hierarchical part
            # Check if test_name is contained in log_test
            if test_name in log_test:
                return status
            # Also check for exact match
            elif test_name == log_test:
                return status
        return "ABSENT"
    else:
        # For other languages, use exact matching
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

def validate_test_conditions(f2p_tests, p2p_tests, base_results, before_results, after_results, language="rust"):
    """Validate the required conditions for the test analysis."""
    validation_results = []
    
    # Convert to sets for easier operations
    f2p_set = set(f2p_tests)
    p2p_set = set(p2p_tests)
    
    # For JavaScript, we need to handle hierarchical test names with partial matching
    def is_test_matching(config_test, log_test, language):
        """Check if a config test matches a log test, with special handling for JavaScript."""
        if language.lower() in ["javascript", "js"]:
            # For JS, check for containment or exact match
            return config_test == log_test or config_test in log_test
        else:
            # For other languages, use exact matching
            return config_test == log_test
    
    def find_matching_log_tests(config_test, log_results, language):
        """Find all log tests that match a config test."""
        matches = []
        for log_test in log_results.keys():
            if is_test_matching(config_test, log_test, language):
                matches.append(log_test)
        return matches
    
    # 1. At least one failed test in base is present in P2P
    base_failures_in_p2p = []
    for test_name, result in base_results.items():
        if result.startswith("FAIL"):
            # Check if this test matches any P2P test
            for p2p_test in p2p_set:
                if is_test_matching(p2p_test, test_name, language):
                    base_failures_in_p2p.append(test_name)
                    break
    
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
        if result.startswith("FAIL"):
            # Check if this test matches any F2P or P2P test
            found_match = False
            for f2p_test in f2p_set:
                if is_test_matching(f2p_test, test_name, language):
                    after_failures_in_categories.append(test_name)
                    found_match = True
                    break
            if not found_match:
                for p2p_test in p2p_set:
                    if is_test_matching(p2p_test, test_name, language):
                        after_failures_in_categories.append(test_name)
                        break
    
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
    for f2p_test in f2p_set:
        # Find matching tests in before results
        matching_tests = find_matching_log_tests(f2p_test, before_results, language)
        # Check if any of the matching tests passed
        for matching_test in matching_tests:
            if before_results[matching_test].startswith("PASS"):
                successful_f2p_in_before.append(matching_test)
                break
    
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
    for p2p_test in p2p_set:
        # Find matching tests in before results
        matching_tests = find_matching_log_tests(p2p_test, before_results, language)
        
        # Check conditions for each matching test
        for matching_test in matching_tests:
            # Check if test is missing in base (not present in base_results)
            is_missing_in_base = matching_test not in base_results
            
            # Check if test is not passing in before
            is_not_passing_in_before = (matching_test not in before_results or 
                                       not before_results[matching_test].startswith("PASS"))
            
            # If both conditions are true, add to our list
            if is_missing_in_base and is_not_passing_in_before:
                p2p_missing_in_base_not_passing.append(matching_test)
    
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

def make_table(test_names, base_results, before_results, after_results, filter_all_pass=False, language="rust"):
    rows = []
    all_pass_count = 0
    skipped_tests = []

    for test in test_names:
        base_status = get_status(test, base_results, language)
        before_status = get_status(test, before_results, language)
        after_status = get_status(test, after_results, language)

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

def check_early_rejection_rules(f2p_tests, p2p_tests, base_results, before_results, after_results):
    """Check for early rejection rules and return any violations found."""
    violations = []
    
    # Combine F2P and P2P tests for checking
    all_configured_tests = f2p_tests + p2p_tests
    
    # Check for variable/unstable values in test names (e.g., timestamps, UUIDs)
    for test_name in all_configured_tests:
        # Look for patterns that indicate unstable values
        # Check in order of specificity to avoid false positives
        
        # UUIDs (8-4-4-4-12 hex format) - check first as they contain digits that could match other patterns
        if re.search(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', test_name):
            violations.append(f"Test name contains unstable values (UUID): {test_name}")
        # Build times (e.g., "built in 1.73s")
        elif re.search(r'built in \d+\.\d+s', test_name):
            violations.append(f"Test name contains unstable values (build time): {test_name}")
        # Date strings (YYYY-MM-DD format)
        elif re.search(r'\d{4}-\d{2}-\d{2}', test_name):
            violations.append(f"Test name contains unstable values (date): {test_name}")
        # Timestamps (10 or more consecutive digits) - check last to avoid matching UUIDs
        elif re.search(r'\d{10,}', test_name):
            violations.append(f"Test name contains unstable values (timestamp): {test_name}")
    
    # Check for duplicated test names
    test_name_counts = {}
    for test_name in all_configured_tests:
        test_name_counts[test_name] = test_name_counts.get(test_name, 0) + 1
    
    for test_name, count in test_name_counts.items():
        if count > 1:
            violations.append(f"Test name is duplicated ({count} times): {test_name}")
    
    # Check if logs are empty
    if not base_results:
        violations.append("Base log is empty")
    if not before_results:
        violations.append("Before log is empty")
    if not after_results:
        violations.append("After log is empty")
    
    # Check if F2P or P2P lists are empty
    if not f2p_tests:
        violations.append("FAIL_TO_PASS list is empty")
    if not p2p_tests:
        violations.append("PASS_TO_PASS list is empty")
    
    return violations

def analyze_logs(logs_directory, language="rust"):
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
        
        # Select parser based on language
        if language.lower() in ["javascript", "js"]:
            parse_func = parse_js_log_file
        else:
            parse_func = parse_rust_log_file
        
        base_results = parse_func(base_log_path)
        before_results = parse_func(before_log_path)
        after_results = parse_func(after_log_path)
        
        # Check for early rejection rules
        early_rejection_violations = check_early_rejection_rules(f2p_tests, p2p_tests, base_results, before_results, after_results)
        
        # Validate test conditions
        validation_results = validate_test_conditions(f2p_tests, p2p_tests, base_results, before_results, after_results, language)
        
        # Add early rejection violations to validation results
        if early_rejection_violations:
            for violation in early_rejection_violations:
                validation_results.append({
                    "status": "FAIL",
                    "description": f"Early rejection rule violated: {violation}",
                    "examples": []
                })
        
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
        f2p_table, _, _ = make_table(f2p_tests, base_results, before_results, after_results, language=language)
        
        # Pass to Pass
        p2p_table, all_pass_count, skipped_tests = make_table(
            p2p_tests, base_results, before_results, after_results, filter_all_pass=True, language=language
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
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Usage: python log_analyzer.py <logs_directory> [language]"}))
        sys.exit(1)
    
    logs_directory = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "rust"
    result = analyze_logs(logs_directory, language)
    print(json.dumps(result, indent=2))