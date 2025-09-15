#!/usr/bin/env python3
"""
Script to convert SVG to PNG using Python
"""

import os
import sys
from pathlib import Path

try:
    import cairosvg
except ImportError:
    print("cairosvg not installed. Please install it with: pip install cairosvg")
    sys.exit(1)

def convert_svg_to_png(svg_path, png_path, size=1024):
    """Convert SVG to PNG"""
    try:
        # Convert SVG to PNG
        cairosvg.svg2png(
            url=svg_path,
            write_to=png_path,
            output_width=size,
            output_height=size
        )
        print(f"Successfully converted {svg_path} to {png_path}")
        return True
    except Exception as e:
        print(f"Error converting SVG to PNG: {e}")
        return False

if __name__ == "__main__":
    # Get the project root directory
    project_root = Path(__file__).parent.parent
    
    # Define paths
    svg_path = project_root / "icon.svg"
    png_path = project_root / "icon.png"
    
    # Check if SVG file exists
    if not svg_path.exists():
        print(f"SVG file not found: {svg_path}")
        sys.exit(1)
    
    # Convert SVG to PNG
    if convert_svg_to_png(str(svg_path), str(png_path)):
        print("SVG to PNG conversion completed successfully!")
    else:
        print("SVG to PNG conversion failed!")
        sys.exit(1)