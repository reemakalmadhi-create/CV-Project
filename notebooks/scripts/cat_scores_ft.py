"""Score our fine-tuned CatVTON on the SAME 60 test photos as v4 and the original CatVTON,
then a before/after grid on the 8 showcase people (512x384, same seed for both)."""
import sys, time, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catvton_lib import *
import pandas as pd, torch.nn.functional as F, lpips
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

OUT = os.path.expanduser('~/virtual-tryon/run_catvton')
ATTN = os.environ.get('ATTN', f'{OUT}/ft/attention_final.safetensors')
TAG = os.environ.get('TAG', 'ft')
N, STEPS, SIZE, H, W = 60, 25, (384, 512), 256, 192
os.makedirs(f'{OUT}/paired_{TAG}', exist_ok=True); os.makedirs(f'{OUT}/grid512', exist_ok=True)

per4 = pd.read_csv(os.path.expanduser('~/virtual-tryon/run_v4/test_per_image.csv'))
sub = per4.sample(N, random_state=0).reset_index(drop=True)
base = pd.read_csv(f'{OUT}/catvton_per_image.csv').set_index('name')


def ssim(x, y):
    g = torch.exp(-(torch.arange(11) - 5.0) ** 2 / (2 * 1.5 ** 2)); g = g / g.sum()
    k = (g[:, None] * g[None, :]).expand(3, 1, 11, 11)
    f = lambda t: F.conv2d(t, k, padding=5, groups=3)
    mx, my = f(x), f(y); sxx, syy, sxy = f(x * x) - mx ** 2, f(y * y) - my ** 2, f(x * y) - mx * my
    c1, c2 = 0.01 ** 2, 0.03 ** 2
    return (((2 * mx * my + c1) * (2 * sxy + c2)) / ((mx ** 2 + my ** 2 + c1) * (sxx + syy + c2))).mean((1, 2, 3))


lp = lpips.LPIPS(net='alex', verbose=False).eval()
t2 = lambda im: torch.from_numpy(np.asarray(im.convert('RGB').resize((W, H), Image.BICUBIC), np.float32) / 255.).permute(2, 0, 1)[None]
pipe = load_pipe('vitonhd', attn_file=ATTN)
rows, t0 = [], time.time()
for i, n in enumerate(sub.name):
    f = f'{OUT}/paired_{TAG}/{n[:-4]}.png'
    if not os.path.exists(f):
        r, *_ = run(pipe, n, n, steps=STEPS, size=SIZE, long_fit=False)
        r.save(f)
    x, y = t2(Image.open(f)), t2(Image.open(f'{DATA}/test/image/{n}'))
    with torch.no_grad():
        s = float(ssim(x, y)); l = float(lp(x * 2 - 1, y * 2 - 1)); mse = float(((x - y) ** 2).mean())
    rows.append(dict(name=n, ssim=s, lpips=l, psnr=10 * np.log10(1 / mse)))
    if i % 10 == 9:
        print(f'{i + 1}/{N} | {(time.time() - t0) / 60:.1f} min | SSIM {np.mean([r["ssim"] for r in rows]):.3f} LPIPS {np.mean([r["lpips"] for r in rows]):.3f}', flush=True)

ft = pd.DataFrame(rows); ft.to_csv(f'{OUT}/catvton_{TAG}_per_image.csv', index=False)
both = ft.set_index('name').join(base, rsuffix='_base')
res = {
    'photos (same 60 for all)': N,
    'our v4 SSIM / LPIPS / PSNR': [round(sub.ssim.mean(), 3), round(sub.lpips.mean(), 3), round(sub.psnr.mean(), 2)],
    'CatVTON original SSIM / LPIPS / PSNR': [round(base.loc[ft.name].ssim.mean(), 3), round(base.loc[ft.name].lpips.mean(), 3), round(base.loc[ft.name].psnr.mean(), 2)],
    'CatVTON fine-tuned SSIM / LPIPS / PSNR': [round(ft.ssim.mean(), 3), round(ft.lpips.mean(), 3), round(ft.psnr.mean(), 2)],
    'fine-tuned better LPIPS on': f'{(both.lpips < both.lpips_base).mean():.0%}',
    'weights': ATTN,
}
json.dump(res, open(f'{OUT}/scores_{TAG}.json', 'w'), indent=1)
print(json.dumps(res, indent=1), flush=True)

# before / after on the 8 showcase people (unpaired, new shirts)
log = pd.read_csv(os.path.expanduser('~/virtual-tryon/run_v4/cleaning_log.csv'))
pos = set(log[(log.split == 'test') & log.issues.isna()].name)
pairs = [l.split() for l in open(f'{DATA}/test_pairs.txt')]
pairs = [(a, c) for a, c in pairs if a in pos and c in pos]
pick = [351, 1205, 287, 1510, 671, 58, 754, 648]
outs = {}
for tag, attn in [('orig', None), (TAG, ATTN)]:
    need = [k for k in pick if not os.path.exists(f'{OUT}/grid512/{tag}_{k}.png')]
    if need:
        del pipe; torch.mps.empty_cache(); pipe = load_pipe('vitonhd', attn_file=attn)
    for k in need:
        a, c = pairs[k]
        run(pipe, a, c, steps=STEPS, size=SIZE)[0].save(f'{OUT}/grid512/{tag}_{k}.png')
        print(tag, k, flush=True)
fig, ax = plt.subplots(len(pick), 4, figsize=(12, 4 * len(pick)))
for i, k in enumerate(pick):
    a, c = pairs[k]
    ims = [Image.open(f'{DATA}/test/image/{a}'), Image.open(f'{DATA}/test/cloth/{c}'),
           Image.open(f'{OUT}/grid512/orig_{k}.png'), Image.open(f'{OUT}/grid512/{TAG}_{k}.png')]
    for j, im in enumerate(ims):
        ax[i, j].imshow(im); ax[i, j].axis('off')
        if i == 0: ax[i, j].set_title(['person', 'shirt', 'CatVTON original', 'CatVTON fine-tuned by us'][j], fontsize=11)
fig.suptitle('Same person, same shirt, same seed (512x384): before vs after our fine-tune', fontsize=13)
plt.tight_layout(rect=[0, 0, 1, 0.985]); plt.savefig(f'{OUT}/catvton_finetune_before_after.png', dpi=90); plt.close()
print('grid saved', flush=True)
