#!/usr/bin/env python3
"""
Script to create proper icon files for the Electron application
"""

import os
import sys
from pathlib import Path

def create_proper_icons():
    """Create proper icon files for the application"""
    project_root = Path(__file__).parent.parent
    build_dir = project_root / "build" / "icons"
    
    # Create necessary directories
    dirs = [
        build_dir / "win",
        build_dir / "mac",
        build_dir / "png"
    ]
    
    for directory in dirs:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {directory}")
    
    # Instructions for creating proper icons
    print("\nTo create proper icons for your application:")
    print("\n1. Convert icon.svg to icon.png:")
    print("   - Open icon.svg in a browser or image editor")
    print("   - Export/Screenshot as PNG with dimensions 1024x1024")
    print(f"   - Save as {project_root / 'icon.png'}")
    
    print("\n2. Create ICO file from PNG:")
    print("   - Visit https://convertICO.com or https://online-converter.com/ico")
    print("   - Upload your icon.png file")
    print(f"   - Download and save as {build_dir / 'win' / 'icon.ico'}")
    
    print("\n3. Create ICNS file for macOS:")
    print("   - Visit https://cloudconvert.com/png-to-icns")
    print("   - Upload your icon.png file")
    print(f"   - Download and save as {build_dir / 'mac' / 'icon.icns'}")
    
    print("\n4. Copy PNG for Linux:")
    print(f"   - Copy your icon.png file")
    print(f"   - Save as {build_dir / 'png' / '1024x1024.png'}")
    
    print("\nAlternative method using image editors:")
    print("- Open icon.svg in Inkscape, Adobe Illustrator, or similar")
    print("- Export as PNG (1024x1024) and save as icon.png")
    print("- Export as ICO and save as build/icons/win/icon.ico")
    print("- Export as ICNS and save as build/icons/mac/icon.icns")
    
    print("\nAfter creating these files, your application will use the new icon in the taskbar.")

if __name__ == "__main__":
    create_proper_icons()