import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'rust'))

# Create a simple test file with the example you provided
test_content = """✓ |@calcom/lib| packages/features/bookings/lib/handleSeats/test/handleSeats.test.ts > handleSeats > As an owner > Rescheduling a booking > When rescheduling to existing booking, merge attendees"""

# Write to a temporary file
with open("temp_test.log", "w", encoding="utf-8") as f:
    f.write(test_content)

from js_log_parser import parse_js_log_file

print("Parsing test log file:")
results = parse_js_log_file("temp_test.log")

print(f"Found {len(results)} test results:")
for test_name, status in results.items():
    print(f"  {status}: {test_name}")
    print(f"    Length: {len(test_name)}")
    print(f"    Repr: {repr(test_name)}")

# Clean up
os.remove("temp_test.log")