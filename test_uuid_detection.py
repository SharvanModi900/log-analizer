import re

def test_uuid_detection():
    # Test cases
    test_names = [
        "|@calcom/lib| packages/app-store/routing-forms/lib/handleResponse.test.ts > handleResponse > Preview mode > should send queuedFormResponse with id=00000000-0000-0000-0000-000000000000 when queueFormResponse is true",
        "isUTCDateString() - should return false given an invalid UTC date string: 1754506597526",
        "built in 1.73s",
        "should work correctly",
        "test with date 2023-12-25 format",
        "normal test name"
    ]
    
    print("Testing UUID and unstable value detection:")
    for test_name in test_names:
        print(f"\nTest name: {test_name}")
        
        # Check for timestamps (10 or more consecutive digits)
        if re.search(r'\d{10,}', test_name):
            print("  -> Contains timestamp (10+ digits)")
            
        # Check for date strings (YYYY-MM-DD format)
        elif re.search(r'\d{4}-\d{2}-\d{2}', test_name):
            print("  -> Contains date string (YYYY-MM-DD)")
            
        # Check for UUIDs (8-4-4-4-12 hex format)
        elif re.search(r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', test_name):
            print("  -> Contains UUID")
            
        # Check for build times (e.g., "built in 1.73s")
        elif re.search(r'built in \d+\.\d+s', test_name):
            print("  -> Contains build time")
            
        else:
            print("  -> No unstable values detected")

if __name__ == "__main__":
    test_uuid_detection()