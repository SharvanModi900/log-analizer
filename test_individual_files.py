#!/usr/bin/env python3
"""
Test script to verify the individual file upload functionality works correctly.
This script creates sample log files and a JSON file for testing.
"""

import json
import os

def create_test_files():
    # Create sample log files
    base_content = """test rustdoc::rustdoc_args ... ok
test rustc::lib ... ok
test util::toml::embedded::test_expand::split_dependencies ... ok
test check::build_check ... ok
test build::cargo_compile_with_invalid_lib_target_name ... ok"""

    before_content = """test rustdoc::rustdoc_args ... ok
test rustc::lib ... ok
test util::toml::embedded::test_expand::split_dependencies ... ok
test check::build_check ... ok
test build::cargo_compile_with_invalid_lib_target_name ... ok"""

    after_content = """test rustdoc::rustdoc_args ... FAILED
test rustc::lib ... ok
test util::toml::embedded::test_expand::split_dependencies ... ok
test check::build_check ... ok
test build::cargo_compile_with_invalid_lib_target_name ... ok"""

    # Create the files
    with open("sample_base.log", "w") as f:
        f.write(base_content)
    
    with open("sample_before.log", "w") as f:
        f.write(before_content)
    
    with open("sample_after.log", "w") as f:
        f.write(after_content)
    
    # Create sample JSON file
    sample_data = {
        "fail_to_pass": [
            "rustdoc::rustdoc_args",
            "rustc::lib",
            "rustdoc::rustdoc_same_name_documents_lib"
        ],
        "pass_to_pass": [
            "util::toml::embedded::test_expand::split_dependencies",
            "check::build_check",
            "build::cargo_compile_with_invalid_lib_target_name"
        ]
    }
    
    with open("sample_tests.json", "w") as f:
        json.dump(sample_data, f, indent=2)
    
    print("Sample files created:")
    print("  - sample_base.log")
    print("  - sample_before.log")
    print("  - sample_after.log")
    print("  - sample_tests.json")

if __name__ == "__main__":
    create_test_files()