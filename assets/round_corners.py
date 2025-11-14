
import sys
from PIL import Image, ImageDraw
import numpy as np

# Icon'u yükle
img = Image.open('/Users/yusufalperilhan/Desktop/BeeLocal/assets/icon.png').convert('RGBA')
width, height = img.size
radius = int(min(width, height) * 0.2)

# Yuvarlatılmış köşeli mask oluştur
mask = Image.new('L', (width, height), 0)
draw = ImageDraw.Draw(mask)
draw.rounded_rectangle([(0, 0), (width, height)], radius=radius, fill=255)

# Mask'ı uygula
output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
output.paste(img, (0, 0))
output.putalpha(mask)

# Kaydet
output.save('/Users/yusufalperilhan/Desktop/BeeLocal/assets/icon_rounded.png', 'PNG')
