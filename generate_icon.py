import os
from PIL import Image

def generate_icon():
    img_path = 'public/logo.png'
    img = Image.open(img_path).convert('RGBA')
    width, height = img.size
    
    # Find exact X bounds for the symbol (Y from 140 to 735)
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
                
    sym_w = max_x - min_x + 1
    sym_h = max_y - min_y + 1
    
    # 72% coverage
    base_target_size = int(max(sym_w, sym_h) / 0.72)
    
    # Create base image
    base_img = Image.new('RGBA', (base_target_size, base_target_size), (0, 0, 0, 0))
    symbol_crop = img.crop((min_x, min_y, max_x + 1, max_y + 1))
    
    paste_x = (base_target_size - sym_w) // 2
    paste_y = (base_target_size - sym_h) // 2
    base_img.paste(symbol_crop, (paste_x, paste_y))
    
    sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    for s in sizes:
        resized = base_img.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(f'public/icon-{s}.png')
        print(f"Saved public/icon-{s}.png")
        
        # Maskable (Solid Background #F6F8FB)
        maskable = Image.new('RGBA', (s, s), (246, 248, 251, 255))
        # Maskable safe zone is inner 80%. Let's scale down slightly for safety.
        safe_zone_ratio = 0.8
        safe_size = int(s * safe_zone_ratio)
        safe_resized = base_img.resize((safe_size, safe_size), Image.Resampling.LANCZOS)
        m_paste_x = (s - safe_size) // 2
        maskable.alpha_composite(safe_resized, (m_paste_x, m_paste_x))
        maskable.save(f'public/icon-{s}-maskable.png')
        print(f"Saved public/icon-{s}-maskable.png")

    # Save original nav-logo
    nav_logo_size = max(sizes)
    nav_logo = base_img.resize((nav_logo_size, nav_logo_size), Image.Resampling.LANCZOS)
    nav_logo.save('public/nav-logo.png')
    
    # Generate favicon.ico
    favicon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64)]
    base_img.save('public/favicon.ico', format='ICO', sizes=favicon_sizes)
    print("Saved public/favicon.ico")

if __name__ == '__main__':
    generate_icon()
