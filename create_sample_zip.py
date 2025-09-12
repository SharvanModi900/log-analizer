#!/usr/bin/env python3
import json
import os
import zipfile
from pathlib import Path

def create_sample_zip():
    # Create a temporary directory for our files
    temp_dir = Path("temp_sample")
    temp_dir.mkdir(exist_ok=True)
    
    # Create a logs subdirectory
    logs_dir = temp_dir / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    # Create sample log files with the correct naming pattern
    log_files = [
        ("project123_base.log", "test rustdoc::rustdoc_args ... ok\n"),
        ("project123_before.log", "test rustdoc::rustdoc_args ... ok\n"),
        ("project123_after.log", "test rustdoc::rustdoc_args ... FAILED\n")
    ]
    
    for filename, content in log_files:
        filepath = logs_dir / filename
        with open(filepath, 'w') as f:
            f.write(content)
    
    # Create a sample JSON file with the correct structure
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
    
    json_path = logs_dir / "sample_tests.json"
    with open(json_path, 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    # Create the ZIP file
    zip_path = "sample_logs.zip"
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        # Add files maintaining the directory structure
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arc_path = os.path.relpath(file_path, temp_dir)
                zipf.write(file_path, arc_path)
    
    # Clean up temporary files
    for root, dirs, files in os.walk(temp_dir, topdown=False):
        for file in files:
            os.remove(os.path.join(root, file))
        for dir in dirs:
            os.rmdir(os.path.join(root, dir))
    os.rmdir(temp_dir)
    
    print(f"Sample ZIP file created: {zip_path}")
    print("It contains:")
    print("  - logs/project123_base.log")
    print("  - logs/project123_before.log")
    print("  - logs/project123_after.log")
    print("  - logs/sample_tests.json")

if __name__ == "__main__":
    create_sample_zip()