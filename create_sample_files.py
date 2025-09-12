#!/usr/bin/env python3
"""
Script to create sample files for testing the log analyzer.
Creates a JSON file and three log files with sample data.
"""

import json

def create_sample_files():
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
    
    # Create sample log files
    base_log_content = """test rustdoc::rustdoc_args ... ok
test rustc::lib ... ok
test util::toml::embedded::test_expand::split_dependencies ... ok
test check::build_check ... ok
test build::cargo_compile_with_invalid_lib_target_name ... ok"""
    
    before_log_content = """test rustdoc::rustdoc_args ... ok
test rustc::lib ... ok
test util::toml::embedded::test_expand::split_dependencies ... ok
test check::build_check ... ok
test build::cargo_compile_with_invalid_lib_target_name ... ok"""
    
    after_log_content = """test rustdoc::rustdoc_args ... FAILED
test rustc::lib ... ok
test util::toml::embedded::test_expand::split_dependencies ... ok
test check::build_check ... ok
test build::cargo_compile_with_invalid_lib_target_name ... ok"""
    
    with open("sample_project_base.log", "w") as f:
        f.write(base_log_content)
    
    with open("sample_project_before.log", "w") as f:
        f.write(before_log_content)
    
    with open("sample_project_after.log", "w") as f:
        f.write(after_log_content)
    
    print("Sample files created successfully:")
    print("  - sample_tests.json")
    print("  - sample_project_base.log")
    print("  - sample_project_before.log")
    print("  - sample_project_after.log")

if __name__ == "__main__":
    create_sample_files()