import json
import os
from tabulate import tabulate
from log_parser import parse_log_file
from utils import colorize_status, get_status, colorize_text

LOG_DIR = "logs"

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
