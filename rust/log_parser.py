import re

def parse_log_file(filepath):
    """
    Parse a Rust test log file and extract test statuses.
    Returns a dict: { "test_name": "PASS"/"FAIL" }
    """
    results = {}
    test_pattern = re.compile(r"test (\S+) \.\.\. (ok|FAILED)")

    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            match = test_pattern.search(line)
            if match:
                test_name, status = match.groups()
                results[test_name] = "PASS" if status == "ok" else "FAIL"

    return results
