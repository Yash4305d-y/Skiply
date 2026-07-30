import os
from PIL import Image

def analyze():
    img_path = 'public/logo.png'
    if not os.path.exists(img_path):
        print("logo.png not found")
        return
        
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    print(f"Original size: {width}x{height}")
    
    # Analyze row by row to find content
    # We look for non-white and non-transparent pixels
    rows_with_content = []
    
    for y in range(height):
        content_in_row = False
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            # If not transparent and not white (or very light)
            if a > 50 and (r < 240 or g < 240 or b < 240):
                content_in_row = True
                break
        rows_with_content.append(1 if content_in_row else 0)
        
    # Find continuous blocks of content
    blocks = []
    in_block = False
    start_y = 0
    for y, has_content in enumerate(rows_with_content):
        if has_content and not in_block:
            in_block = True
            start_y = y
        elif not has_content and in_block:
            in_block = False
            blocks.append((start_y, y - 1))
    if in_block:
        blocks.append((start_y, height - 1))
        
    print("Content blocks (start_y, end_y):", blocks)
    
if __name__ == '__main__':
    analyze()
