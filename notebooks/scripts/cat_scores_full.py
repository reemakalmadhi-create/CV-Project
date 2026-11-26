"""Score our fine-tuned CatVTON on the FULL VITON-HD test set (2,032 photos). Resumable.

MODE=paired   each person with their own shirt -> SSIM / LPIPS / PSNR against the real photo, plus paired FID / KID
MODE=unpaired each person with a new shirt (official test_pairs.txt) -> unpaired FID / KID (no real photo exists)

Same settings as the 60-photo check: 512x384, 25 steps, seed 42, scored at 256x192.
Results also on v4's 1,984 clean test photos so they compare directly with v4.
"""
import sys, time, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from catvton_lib import *
import pandas as pd, torch.nn.functional as F

MODE = os.environ.get('MODE', 'paired')
OUT = os.path.expanduser('~/virtual-tryon/run_catvton')
ATTN = os.environ.get('ATTN', f'{OUT}/ft/attention_final.safetensors')
TAG = os.environ.get('TAG', 'ft')
STEPS, SIZE, H, W = 25, (384, 512), 256, 192
FULL = f'{OUT}/full'
gen_dir = f'{OUT}/paired_{TAG}' if MODE == 'paired' else f'{FULL}/unpaired_{TAG}'
small_dir, real_dir = f'{FULL}/{MODE}_{TAG}_256', f'{FULL}/real256'
csv = f'{FULL}/{MODE}_{TAG}_per_image.csv'
for d in (gen_dir, small_dir, real_dir): os.makedirs(d, exist_ok=True)

names = sorted(n for n in os.listdir(f'{DATA}/test/image') if n.endswith('.jpg') and not n.startswith('._'))
if MODE == 'paired':
    pairs = [(n, n) for n in names]
else:
    pairs = [tuple(l.split()) for l in open(f'{DATA}/test_pairs.txt')]
if os.environ.get('LIMIT'): pairs = pairs[:int(os.environ['LIMIT'])]
clean = set(pd.read_csv(os.path.expanduser('~/virtual-tryon/run_v4/test_per_image.csv')).name)
small = lambda im: im.convert('RGB').resize((W, H), Image.BICUBIC)

for n in names:   # real photos at the scoring size, once
    if not os.path.exists(f'{real_dir}/{n[:-4]}.png'):
        small(Image.open(f'{DATA}/test/image/{n}')).save(f'{real_dir}/{n[:-4]}.png')


def ssim(x, y):
    g = torch.exp(-(torch.arange(11) - 5.0) ** 2 / (2 * 1.5 ** 2)); g = g / g.sum()
    k = (g[:, None] * g[None, :]).expand(3, 1, 11, 11)
    f = lambda t: F.conv2d(t, k, padding=5, groups=3)
    mx, my = f(x), f(y); sxx, syy, sxy = f(x * x) - mx ** 2, f(y * y) - my ** 2, f(x * y) - mx * my
    c1, c2 = 0.01 ** 2, 0.03 ** 2
    return (((2 * mx * my + c1) * (2 * sxy + c2)) / ((mx ** 2 + my ** 2 + c1) * (sxx + syy + c2))).mean((1, 2, 3))


done = set(pd.read_csv(csv).name) if os.path.exists(csv) else set()
if MODE == 'paired':
    import lpips
    lp = lpips.LPIPS(net='alex', verbose=False).eval()
    t2 = lambda im: torch.from_numpy(np.asarray(small(im), np.float32) / 255.).permute(2, 0, 1)[None]
pipe = load_pipe('vitonhd', attn_file=ATTN)
todo = [(a, c) for a, c in pairs if a not in done]
print(f'{MODE}: {len(pairs)} photos, {len(done)} already scored, {len(todo)} to go', flush=True)
t0, k = time.time(), 0
for a, c in todo:
    f = f'{gen_dir}/{a[:-4]}.png' if MODE == 'paired' else f'{gen_dir}/{a[:-4]}_{c[:-4]}.png'
    row = dict(name=a, cloth=c)
    try:
        if not os.path.exists(f):
            r, *_ = run(pipe, a, c, steps=STEPS, size=SIZE, long_fit=(MODE != 'paired'))
            r.save(f); k += 1
        im = Image.open(f); small(im).save(f'{small_dir}/{a[:-4]}.png')
        if MODE == 'paired':
            x, y = t2(im), t2(Image.open(f'{DATA}/test/image/{a}'))
            with torch.no_grad():
                row.update(ssim=float(ssim(x, y)), lpips=float(lp(x * 2 - 1, y * 2 - 1)),
                           psnr=10 * np.log10(1 / float(((x - y) ** 2).mean())))
    except Exception as e:
        row['error'] = f'{type(e).__name__}: {e}'
        print('FAILED', a, row['error'], flush=True)
    pd.DataFrame([row]).to_csv(csv, mode='a', header=not os.path.exists(csv), index=False)
    if k and k % 25 == 0:
        per = (time.time() - t0) / k
        left = len(todo) - len(pd.read_csv(csv)) + len(done)
        print(f'{len(pd.read_csv(csv))}/{len(pairs)} | {per:.0f} s/photo | about {left * per / 3600:.1f} h left', flush=True)

del pipe; torch.mps.empty_cache()
df = pd.read_csv(csv).drop_duplicates('name', keep='last')
ok = df[df.error.isna()] if 'error' in df.columns else df
res = {'mode': MODE, 'weights': ATTN, 'photos scored': len(ok), 'failed': len(df) - len(ok)}
if MODE == 'paired':
    for label, part in [('all test photos', ok), ("v4's 1,984 clean photos", ok[ok.name.isin(clean)])]:
        res[f'SSIM / LPIPS / PSNR, {label} (n={len(part)})'] = [round(part.ssim.mean(), 3), round(part.lpips.mean(), 3), round(part.psnr.mean(), 2)]

import torch_fidelity, shutil
for label, keep in [('all test photos', None), ("v4's 1,984 clean photos", clean)]:
    fake, real = f'{FULL}/_fid_fake', f'{FULL}/_fid_real'
    for d in (fake, real): shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    for n in ok.name:
        if keep is None or n in keep: os.symlink(f'{small_dir}/{n[:-4]}.png', f'{fake}/{n[:-4]}.png')
    for n in names:
        if keep is None or n in keep: os.symlink(f'{real_dir}/{n[:-4]}.png', f'{real}/{n[:-4]}.png')
    m = torch_fidelity.calculate_metrics(input1=fake, input2=real, fid=True, kid=True, cuda=False, verbose=False,
                                         save_cpu_ram=True, kid_subset_size=min(1000, len(os.listdir(fake)) // 2))
    res[f'{MODE} FID / KIDx100, {label}'] = [round(m['frechet_inception_distance'], 2), round(100 * m['kernel_inception_distance_mean'], 3)]
json.dump(res, open(f'{FULL}/scores_{MODE}_{TAG}.json', 'w'), indent=1)
print(json.dumps(res, indent=1), flush=True)
