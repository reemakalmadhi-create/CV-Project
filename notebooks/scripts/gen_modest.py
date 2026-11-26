"""Modest-only result grids (covered people, long-sleeve tops), checked by eye from modest_candidates.csv.
1) before/after: 8 people in a new top, original vs fine-tuned CatVTON (same seed)
2) new shirts: the same 8, fine-tuned only
3) same shirt vs real photo: 8 covered people in their own top, with SSIM / LPIPS
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catvton_lib import *
import pandas as pd, torch.nn.functional as F, lpips
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

OUT = os.path.expanduser('~/virtual-tryon/run_catvton')
G = f'{OUT}/modest'; os.makedirs(G, exist_ok=True)
ATTN = f'{OUT}/ft/attention_final.safetensors'
STEPS, SIZE = 25, (384, 512)
c = pd.read_csv(f'{OUT}/modest_candidates.csv').name.tolist()
PAIRS = [(c[p], c[g]) for p, g in [(7, 6), (20, 15), (22, 10), (13, 18), (23, 34), (37, 26), (5, 30), (44, 11)]]
SAME = [c[i] for i in [7, 10, 15, 18, 27, 34, 22, 24]]
img = lambda kind, n: Image.open(f'{DATA}/test/{kind}/{n}')
key = lambda a, b: f'{a[:-4]}_{b[:-4]}'

for tag, attn in [('orig', None), ('ft', ATTN)]:
    jobs = [(a, b, True) for a, b in PAIRS] + ([(n, n, False) for n in SAME] if tag == 'ft' else [])
    jobs = [j for j in jobs if not os.path.exists(f'{G}/{tag}_{key(j[0], j[1])}.png')]
    if not jobs: continue
    pipe = load_pipe('vitonhd', attn_file=attn)
    for a, b, long_fit in jobs:
        run(pipe, a, b, steps=STEPS, size=SIZE, long_fit=long_fit)[0].save(f'{G}/{tag}_{key(a, b)}.png'); print(tag, a, b, flush=True)
    del pipe; torch.mps.empty_cache()


def grid(rows, titles, path, suptitle, notes=None):
    fig, ax = plt.subplots(len(rows), len(titles), figsize=(3 * len(titles), 4 * len(rows)))
    for i, r in enumerate(rows):
        for j, im in enumerate(r):
            ax[i, j].imshow(im); ax[i, j].axis('off')
            if i == 0: ax[i, j].set_title(titles[j], fontsize=11)
        if notes: ax[i, -1].text(5, 30, notes[i], fontsize=9, backgroundcolor='white')
    fig.suptitle(suptitle, fontsize=13); plt.tight_layout(rect=[0, 0, 1, 0.985]); plt.savefig(path, dpi=90); plt.close()


grid([[img('image', a), img('cloth', b), Image.open(f'{G}/orig_{key(a, b)}.png'), Image.open(f'{G}/ft_{key(a, b)}.png')] for a, b in PAIRS],
     ['person', 'new top', 'CatVTON original', 'CatVTON fine-tuned by us'], f'{G}/catvton_finetune_before_after.png',
     'Same person, same top, same seed (512x384): before vs after our fine-tune')
grid([[img('image', a), img('cloth', b), Image.open(f'{G}/ft_{key(a, b)}.png')] for a, b in PAIRS],
     ['person', 'new top', 'result'], f'{G}/new_shirts.png', 'Our fine-tuned CatVTON: each person in a different top (test photos)')


def ssim(x, y):
    g = torch.exp(-(torch.arange(11) - 5.0) ** 2 / (2 * 1.5 ** 2)); g = g / g.sum()
    k = (g[:, None] * g[None, :]).expand(3, 1, 11, 11)
    f = lambda t: F.conv2d(t, k, padding=5, groups=3)
    mx, my = f(x), f(y); sxx, syy, sxy = f(x * x) - mx ** 2, f(y * y) - my ** 2, f(x * y) - mx * my
    return (((2 * mx * my + 1e-4) * (2 * sxy + 9e-4)) / ((mx ** 2 + my ** 2 + 1e-4) * (sxx + syy + 9e-4))).mean()


lp = lpips.LPIPS(net='alex', verbose=False).eval()
t2 = lambda im: torch.from_numpy(np.asarray(im.convert('RGB').resize((192, 256), Image.BICUBIC), np.float32) / 255.).permute(2, 0, 1)[None]
sc = []
for n in SAME:
    x, y = t2(Image.open(f'{G}/ft_{key(n, n)}.png')), t2(img('image', n))
    with torch.no_grad(): sc.append((n, float(ssim(x, y)), float(lp(x * 2 - 1, y * 2 - 1))))
sc.sort(key=lambda r: r[2])
grid([[img('image', n), img('cloth', n), Image.open(f'{G}/ft_{key(n, n)}.png')] for n, _, _ in sc],
     ['real photo', 'top', 'our fine-tuned CatVTON'], f'{G}/test_photos_vs_real.png',
     'Fine-tuned CatVTON on test photos it never saw (best to worst)', [f'SSIM {s:.3f}  LPIPS {l:.3f}' for _, s, l in sc])
print('grids saved', flush=True)
