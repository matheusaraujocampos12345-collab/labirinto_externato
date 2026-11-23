# Gera uma folha de contato a partir de PNGs (para revisão).
import sys, glob, os
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.25
files = sorted(glob.glob(os.path.join(src, 'f_*.png')))
w, h = int(1080*scale), int(1920*scale)
rows = (len(files)+cols-1)//cols
sheet = Image.new('RGB', (cols*w, rows*(h+28)), (40,40,40))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i%cols)*w, (i//cols)*(h+28)
    sheet.paste(im, (x, y+28))
    fr = int(os.path.basename(f)[2:6])
    d.text((x+6, y+6), f'f{fr}  {fr/30:.2f}s', fill=(255,255,0))
sheet.save(out)
print(out, sheet.size)
