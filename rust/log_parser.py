import re

def parse_log_file(filepath):
    """
    Parse Rust test log files into results.
    Handles inline, deferred, and multi-line outputs with clarity.
    Returns { "test_name": result }
    """
    results = {}

    test_line_pattern = re.compile(r"^test (\S+) \.\.\.(?:\s*(\S+))?")
    current_test = None
    buffer_lines = []
    first_token_after_dots = None

    def finalize_test(name, buffer, first_token):
        """
        Decide final result for a test based on buffer and token.
        """
        # Look for explicit ok/FAILED in buffer
        for line in buffer:
            tokens = line.strip().split()
            if not tokens:
                continue
            word = tokens[0]
            if word == "ok":
                return "PASS ({})".format(first_token[:10]) if first_token else "PASS ()"
            elif word == "FAILED":
                return "FAIL ({})".format(first_token[:10]) if first_token else "FAIL ()"

        # Fallback: last line’s first word
        if buffer:
            last_word = buffer[-1].split()[0][:10]
            return "{} ({})".format(last_word, first_token[:10]) if first_token else last_word
        return None

    with open(filepath, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.rstrip()

            # New test starts
            match = test_line_pattern.match(line)
            if match:
                test_name, inline_status = match.groups()

                # Finalize previous if active
                if current_test:
                    result = finalize_test(current_test, buffer_lines, first_token_after_dots)
                    if result:
                        results[current_test] = result
                # Reset state
                current_test, buffer_lines, first_token_after_dots = None, [], None

                if inline_status:  # inline PASS/FAIL/custom
                    if inline_status == "ok":
                        results[test_name] = "PASS"
                    elif inline_status == "FAILED":
                        results[test_name] = "FAIL"
                    else:
                        results[test_name] = inline_status[:10]
                else:  # deferred
                    current_test = test_name
                continue

            # Buffering for current test
            if current_test:
                buffer_lines.append(line)
                tokens = line.split()
                if tokens and first_token_after_dots is None:
                    first_token_after_dots = tokens[0]

        # End of file, finalize last active test
        if current_test:
            result = finalize_test(current_test, buffer_lines, first_token_after_dots)
            if result:
                results[current_test] = result

    return results
