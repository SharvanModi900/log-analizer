import re
import sys

def debug_parse_js_log_file(filepath):
    """
    Debug version of the JS log parser to see what's being matched.
    """
    print(f"Debug parsing: {filepath}")
    
    # Patterns for different JS testing frameworks
    vitest_pattern = re.compile(r"^\s+([✓✔×✘])\s+\|(.+)\|\s+(.+)$")  # Vitest pattern with package
    vitest_no_package_pattern = re.compile(r"^\s+([✓✔×✘])\s+(.+)$")  # Vitest pattern without package
    
    line_count = 0
    match_count = 0
    
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line_count += 1
            line = line.rstrip()
            
            # Skip lines that look like error logs, timestamps, or noise
            if re.search(r'\d{2}:\d{2}:\d{2}:\d{3}\s*\[ERROR\]|\d+\[\d+;\d+m|\[33m|\[39m|The CJS build of Vite|Fake ensureQueryParamsInUrl called|addEventListener called|removeEventListener called|__mock__:', line):
                print(f"Line {line_count}: Skipped (noise) - {line[:50]}...")
                continue
                
            # Skip marker lines
            if ">>>>> Start Test Output" in line or ">>>>> End Test Output" in line:
                print(f"Line {line_count}: Skipped (marker) - {line}")
                continue
                
            # Handle Vitest format with package information
            vitest_match = vitest_pattern.match(line)
            if vitest_match:
                match_count += 1
                symbol, package_name, test_info = vitest_match.groups()
                status = "PASS" if symbol in ["✓", "✔"] else "FAIL"
                print(f"Line {line_count}: Vitest match - {status} - {package_name} - {test_info}")
                continue
                
            # Handle Vitest format without package information
            vitest_no_package_match = vitest_no_package_pattern.match(line)
            if vitest_no_package_match:
                match_count += 1
                symbol, test_info = vitest_no_package_match.groups()
                status = "PASS" if symbol in ["✓", "✔"] else "FAIL"
                print(f"Line {line_count}: Vitest no package match - {status} - {test_info}")
                continue
                
            # Show lines that don't match anything
            if line.strip() and not line.startswith("RUN") and "Duration" not in line and "Start at" not in line and "Test Files" not in line and "Tests" not in line:
                print(f"Line {line_count}: No match - {line[:100]}")
    
    print(f"\nTotal lines: {line_count}, Matched lines: {match_count}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_parser.py <log_file>")
        sys.exit(1)
    
    debug_parse_js_log_file(sys.argv[1])