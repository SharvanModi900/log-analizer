#!/usr/bin/env python3
"""
Script to convert SVG to ICO format for Electron application
"""

import os
import sys
from pathlib import Path

def convert_svg_to_ico():
    """Convert SVG to ICO using Pillow library"""
    try:
        from PIL import Image
        print("Pillow library found. Proceeding with conversion...")
    except ImportError:
        print("Pillow library not found. Please install it with: pip install Pillow")
        return False
    
    try:
        # Check if cairosvg is available for better SVG conversion
        try:
            import cairosvg
            use_cairo = True
            print("CairoSVG found. Will use for high-quality SVG conversion.")
        except ImportError:
            use_cairo = False
            print("CairoSVG not found. Will use Pillow's basic SVG support.")
        
        project_root = Path(__file__).parent.parent
        svg_path = project_root / "icon.svg"
        ico_path = project_root / "build" / "icons" / "win" / "icon.ico"
        
        # Create directories if they don't exist
        ico_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Check if SVG file exists
        if not svg_path.exists():
            print(f"Error: SVG file not found at {svg_path}")
            return False
        
        if use_cairo:
            # Use CairoSVG for better quality
            png_data = cairosvg.svg2png(url=str(svg_path), output_width=256, output_height=256)
            from io import BytesIO
            png_image = Image.open(BytesIO(png_data))
        else:
            # Fallback to Pillow's basic SVG support
            print("Warning: CairoSVG not available. Using Pillow's basic SVG support which may have limitations.")
            print("For better results, install CairoSVG with: pip install cairosvg")
            png_image = Image.open(svg_path)
        
        # Create ICO with multiple sizes
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        icons = []
        
        for size in sizes:
            resized = png_image.resize(size, Image.Resampling.LANCZOS)
            icons.append(resized)
        
        # Save as ICO
        icons[0].save(
            ico_path,
            format='ICO',
            sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        )
        
        print(f"Successfully created ICO file at: {ico_path}")
        print("The new icon will be used in the taskbar when you run the application.")
        return True
        
    except Exception as e:
        print(f"Error converting SVG to ICO: {e}")
        print("Falling back to manual conversion instructions...")
        return False

def provide_manual_instructions():
    """Provide manual conversion instructions if automatic conversion fails"""
    print("""
=====================================
MANUAL ICON CONVERSION INSTRUCTIONS
=====================================

Since automatic conversion failed, please follow these manual steps:

1. CONVERT SVG TO PNG:
   a. Open icon.svg in a browser or image editor
   b. Take a screenshot or export as PNG (1024x1024)
   c. Save as icon.png in your project root

2. CONVERT PNG TO ICO:
   a. Go to https://convertICO.com or https://online-converter.com/ico
   b. Upload your icon.png file
   c. Download the ICO file
   d. Save as build/icons/win/icon.ico

3. TEST YOUR NEW ICON:
   a. Run: npm start
   b. Check the taskbar for your new icon (should appear larger and cleaner)

The new icon design without text will appear significantly larger and cleaner in the taskbar.
""")

if __name__ == "__main__":
    print("Converting icon.svg to icon.ico for taskbar use...")
    
    if not convert_svg_to_ico():
        provide_manual_instructions()