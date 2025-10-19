import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'rust'))

from js_log_parser import parse_js_log_file

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python test_parser.py <log_file>")
        sys.exit(1)
    
    log_file = sys.argv[1]
    print(f"Parsing log file: {log_file}")
    
    try:
        results = parse_js_log_file(log_file)
        print(f"Found {len(results)} test results:")
        for test_name, status in results.items():
            print(f"  {status}: {test_name}")
    except Exception as e:
        print(f"Error parsing log file: {e}")
        import traceback
        traceback.print_exc()