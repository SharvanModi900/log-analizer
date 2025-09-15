from PIL import Image, ImageDraw
import os
import shutil

# Create a better PNG version of the icon with concentric circles
# Image size
size = (512, 512)
center = (256, 256)
radius = 256

# Create a new image with a purple background (indigo-500)
img = Image.new('RGB', size, color=(99, 102, 241))
draw = ImageDraw.Draw(img)

# Draw outer ring (violet-500)
draw.ellipse([center[0]-radius, center[1]-radius, center[0]+radius, center[1]+radius], outline=(139, 92, 246), width=20)

# Draw middle ring (pink-500)
draw.ellipse([center[0]-200, center[1]-200, center[0]+200, center[1]+200], outline=(236, 72, 153), width=20)

# Draw inner circle (slate-50)
draw.ellipse([center[0]-100, center[1]-100, center[0]+100, center[1]+100], fill=(248, 250, 252))

# Draw center dot (indigo-500)
draw.ellipse([center[0]-30, center[1]-30, center[0]+30, center[1]+30], fill=(99, 102, 241))

# Save the image
img.save('app-icon.png')
print("Created app-icon.png with concentric circles")

# Create a 16x16 version for the taskbar
img_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
img_16.save('app-icon-16.png')
print("Created app-icon-16.png for taskbar")

# Create ICO file with multiple sizes and save in current directory
img.save('icon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("Created icon.ico with multiple sizes in current directory")

# Copy to the build directory
shutil.copy('icon.ico', '../build/icons/win/icon.ico')
print("Copied icon.ico to build directory")