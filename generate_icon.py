import os
from PIL import Image

def generate_icon():
    img_path = 'public/logo.png'
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    
    # We know the symbol is between Y 140 and Y 735 roughly (adding a bit of margin for anti-aliasing)
    # Let's find exact X bounds for the symbol (Y from 140 to 735)
    min_x = width
    max_x = 0
    min_y = 1000
    max_y = 0
    
    for y in range(140, 735):
        for x in range(width):
            r, g, b, a = img.getpixel((x, y))
            if a > 50 and (r < 240 or g < 240 or b < 240):
                if x < min_x: min_x = x
                if x > max_x: max_x = x
                if y < min_y: min_y = y
                if y > max_y: max_y = y
                
    print(f"Symbol bounds: X({min_x}, {max_x}), Y({min_y}, {max_y})")
    
    sym_w = max_x - min_x + 1
    sym_h = max_y - min_y + 1
    print(f"Symbol size: {sym_w}x{sym_h}")
    
    # User requested symbol to occupy 70-75% of icon space
    # Let's make it 72%
    target_size = int(max(sym_w, sym_h) / 0.72)
    print(f"Target icon size: {target_size}x{target_size}")
    
    # Create new blank transparent image
    new_img = Image.new('RGBA', (target_size, target_size), (0, 0, 0, 0))
    
    # Crop the symbol
    symbol_crop = img.crop((min_x, min_y, max_x + 1, max_y + 1))
    
    # Paste the symbol into the center of the new image
    paste_x = (target_size - sym_w) // 2
    paste_y = (target_size - sym_h) // 2
    new_img.paste(symbol_crop, (paste_x, paste_y))
    
    # Save the new icon
    new_img.save('public/nav-logo.png')
    print("Saved public/nav-logo.png")

if __name__ == '__main__':
    generate_icon()
