import re

def parse_js_log_file(filepath):
    """
    Parse JavaScript test log files into results.
    Handles various JavaScript testing frameworks output formats.
    Returns { "test_name": result }
    """
    results = {}

    # Patterns for Vitest format
    vitest_fail_pattern = re.compile(r"^×\s+\|(.+)\|\s+(.+)$")  # Vitest fail pattern
    vitest_pass_pattern = re.compile(r"^✓\s+\|(.+)\|\s+(.+)$")  # Vitest pass pattern
    vitest_fail_no_package_pattern = re.compile(r"^×\s+(.+)$")  # Vitest fail without package
    vitest_pass_no_package_pattern = re.compile(r"^✓\s+(.+)$")  # Vitest pass without package
    
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.rstrip()
                
                # Skip lines that look like error logs, timestamps, or noise
                if re.search(r'\d{2}:\d{2}:\d{2}:\d{3}\s*\[ERROR\]|\d+\[\d+;\d+m|\[33m|\[39m|The CJS build of Vite|Fake ensureQueryParamsInUrl called|addEventListener called|removeEventListener called|__mock__:', line):
                    continue
                    
                # Skip marker lines
                if ">>>>> Start Test Output" in line or ">>>>> End Test Output" in line:
                    continue
                    
                # Handle Vitest fail format with package information
                vitest_fail_match = vitest_fail_pattern.match(line)
                if vitest_fail_match:
                    package_name, test_info = vitest_fail_match.groups()
                    # Clean up the test description and remove extra whitespace
                    test_info = re.sub(r'\s+', ' ', test_info.strip())
                    full_test_name = f"{package_name} {test_info}"
                    results[full_test_name] = "FAIL"
                    continue
                    
                # Handle Vitest pass format with package information
                vitest_pass_match = vitest_pass_pattern.match(line)
                if vitest_pass_match:
                    package_name, test_info = vitest_pass_match.groups()
                    # Clean up the test description and remove extra whitespace
                    test_info = re.sub(r'\s+', ' ', test_info.strip())
                    full_test_name = f"{package_name} {test_info}"
                    results[full_test_name] = "PASS"
                    continue
                    
                # Handle Vitest fail format without package information
                vitest_fail_no_package_match = vitest_fail_no_package_pattern.match(line)
                if vitest_fail_no_package_match:
                    test_info = vitest_fail_no_package_match.group(1)
                    # Clean up the test description and remove extra whitespace
                    test_info = re.sub(r'\s+', ' ', test_info.strip())
                    results[test_info] = "FAIL"
                    continue
                    
                # Handle Vitest pass format without package information
                vitest_pass_no_package_match = vitest_pass_no_package_pattern.match(line)
                if vitest_pass_no_package_match:
                    test_info = vitest_pass_no_package_match.group(1)
                    # Clean up the test description and remove extra whitespace
                    test_info = re.sub(r'\s+', ' ', test_info.strip())
                    results[test_info] = "PASS"
                    continue

    except Exception as e:
        print(f"Error parsing JS log file {filepath}: {e}")
        
    return results