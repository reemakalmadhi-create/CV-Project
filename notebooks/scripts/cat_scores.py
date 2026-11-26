"""Paired scores for pretrained CatVTON on a random test subset, same SSIM/LPIPS/PSNR code and
same 256x192 scoring size as our v4, compared on the SAME photos."""
import sys, time, json; sys.path.insert(0, sys.argv[1])
from catvton_lib import *
import pandas as pd, torch.nn.functional as F, lpips

OUT = '/Users/majed/virtual-tryon/run_catvton'; os.makedirs(f'{OUT}/paired', exist_ok=True)
V4 = '/Users/majed/virtual-tryon/run_v4'
N, STEPS, SIZE = int(os.environ.get('N', 100)), int(os.environ.get('STEPS', 25)), (384, 512)
H, W = 256, 192

per4 = pd.read_csv(f'{V4}/test_per_image.csv')
sub = per4.sample(N, random_state=0).reset_index(drop=True)


def ssim(x, y):
    g = torch.exp(-(torch.arange(11) - 5.0) ** 2 / (2 * 1.5 ** 2)); g = g / g.sum()
    k = (g[:, None] * g[None, :]).expand(3, 1, 11, 11)
    f = lambda t: F.conv2d(t, k, padding=5, groups=3)
    mx, my = f(x), f(y); sxx, syy, sxy = f(x * x) - mx ** 2, f(y * y) - my ** 2, f(x * y) - mx * my
    c1, c2 = 0.01 ** 2, 0.03 ** 2
    return (((2 * mx * my + c1) * (2 * sxy + c2)) / ((mx ** 2 + my ** 2 + c1) * (sxx + syy + c2))).mean((1, 2, 3))


lp = lpips.LPIPS(net='alex', verbose=False).eval()
t2 = lambda im: torch.from_numpy(np.asarray(im.convert('RGB').resize((W, H), Image.BICUBIC), np.float32) / 255.).permute(2, 0, 1)[None]
pipe, rows, t0 = None, [], time.time()
for i, n in enumerate(sub.name):
    f = f'{OUT}/paired/{n[:-4]}.png'
    if not os.path.exists(f):
        pipe = pipe or load_pipe('vitonhd')
        r, *_ = run(pipe, n, n, steps=STEPS, size=SIZE, long_fit=False)
        r.save(f)
    x, y = t2(Image.open(f)), t2(Image.open(f'{DATA}/test/image/{n}'))
    with torch.no_grad():
        s = float(ssim(x, y)); l = float(lp(x * 2 - 1, y * 2 - 1)); mse = float(((x - y) ** 2).mean())
    rows.append(dict(name=n, ssim=s, lpips=l, psnr=10 * np.log10(1 / mse), l1=float((x - y).abs().mean())))
    if i % 10 == 9:
        print(f'{i + 1}/{N} | {(time.time() - t0) / 60:.1f} min | SSIM {np.mean([r["ssim"] for r in rows]):.3f} LPIPS {np.mean([r["lpips"] for r in rows]):.3f}', flush=True)

cat = pd.DataFrame(rows); cat.to_csv(f'{OUT}/catvton_per_image.csv', index=False)
res = {
    'photos scored (same random subset for both)': N,
    'our v4  SSIM': round(sub.ssim.mean(), 3), 'our v4  LPIPS': round(sub.lpips.mean(), 3), 'our v4  PSNR': round(sub.psnr.mean(), 2),
    'CatVTON SSIM': round(cat.ssim.mean(), 3), 'CatVTON LPIPS': round(cat.lpips.mean(), 3), 'CatVTON PSNR': round(cat.psnr.mean(), 2),
    'CatVTON steps / size': f'vitonhd-16k-512 checkpoint, {STEPS} DDIM steps, {SIZE[1]}x{SIZE[0]}, scored at {H}x{W}',
}
json.dump(res, open(f'{OUT}/scores.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
