"""Full-resolution CatVTON showcase, side by side with our v4 on the SAME person + shirt."""
import sys, time; sys.path.insert(0, sys.argv[1])
from catvton_lib import *
import pandas as pd
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt

OUT = '/Users/majed/virtual-tryon/run_catvton'; os.makedirs(f'{OUT}/full', exist_ok=True)
V4 = '/Users/majed/virtual-tryon/run_v4'
STEPS = int(os.environ.get('STEPS', 25))

log = pd.read_csv(f'{V4}/cleaning_log.csv')
kept = log[(log.split == 'test') & log.issues.isna()].name.tolist()
pos = set(kept)
pairs = [l.split() for l in open(f'{DATA}/test_pairs.txt')]
pairs = [(a, c) for a, c in pairs if a in pos and c in pos]
assert len(pairs) == len(os.listdir(f'{V4}/unpaired')), (len(pairs), len(os.listdir(f'{V4}/unpaired')))


def cloth_desc(c):
    m = np.array(Image.open(f'{DATA}/test/cloth-mask/{c}').convert('L')) > 127
    ys, xs = np.where(m)
    img = np.array(Image.open(f'{DATA}/test/cloth/{c}').convert('L'), np.float32)
    edges = np.abs(np.diff(img, axis=1))[m[:, 1:]].mean()
    return (ys.max() - ys.min()) / max(1, xs.max() - xs.min()), edges


def person_desc(p):
    parse = np.array(Image.open(f'{DATA}/test/image-parse-v3/{p.replace(".jpg", ".png")}'))
    top = np.isin(parse, [5, 6, 7]); arms = np.isin(parse, [14, 15])
    ys, xs = np.where(top)
    if len(ys) == 0: return 0, 0
    return (ys.max() - ys.min()) / max(1, xs.max() - xs.min()), arms.sum() / max(1, top.sum())


rng = np.random.RandomState(7)
cand = rng.choice(len(pairs), 300, replace=False)
rows = []
for k in cand:
    a, c = pairs[k]
    ca, ce = cloth_desc(c); pa, parm = person_desc(a)
    rows.append((k, a, c, ca - pa, ce, parm))
d = pd.DataFrame(rows, columns=['k', 'person', 'cloth', 'longer', 'print', 'bare_arms'])
pick = []
pick += d.sort_values('longer', ascending=False).k.tolist()[:3]          # new garment much longer than old top
pick += d[~d.k.isin(pick)].sort_values('print', ascending=False).k.tolist()[:3]   # busy prints / logos
pick += d[~d.k.isin(pick)].sort_values('bare_arms', ascending=False).k.tolist()[:2]  # bare arms -> new sleeves
print('picked', pick, flush=True)

# v4 worst 4 (paired, lowest SSIM) to show the same people with the pretrained model
per = pd.read_csv(f'{V4}/test_per_image.csv').sort_values('ssim')
worst = per.name.tolist()[:4]

jobs = [('new', k, *pairs[k]) for k in pick] + [('worst', i, n, n) for i, n in enumerate(worst)]
done = {}
for kind, k, a, c in jobs:
    f = f'{OUT}/full/{kind}_{a[:-4]}__{c[:-4]}.png'
    if not os.path.exists(f):
        if 'pipe' not in globals(): pipe = load_pipe('mix')
        t = time.time()
        r, per_img, cl, m = run(pipe, a, c, steps=STEPS)
        r.save(f); m.save(f.replace('.png', '_mask.png'))
        print(kind, a, c, f'{time.time() - t:.0f}s', flush=True)
    done[(kind, k)] = f


def v4_worst_crop(i):
    g = Image.open(f'{V4}/worst4.png').convert('RGB')
    x0, x1 = 1218, 1431; ys = [(77, 361), (377, 661), (677, 960), (976, 1260)]
    y0, y1 = ys[i]
    return g.crop((x0, y0, x1, y1))


def grid(items, fname, title):
    n = len(items)
    fig, ax = plt.subplots(n, 4, figsize=(4 * 3.0, n * 4.0))
    ax = np.atleast_2d(ax)
    for i, (a, c, v4img, cat) in enumerate(items):
        ims = [Image.open(f'{DATA}/test/image/{a}'), Image.open(f'{DATA}/test/cloth/{c}'), v4img, Image.open(cat)]
        for j, im in enumerate(ims):
            ax[i, j].imshow(im); ax[i, j].axis('off')
            if i == 0: ax[i, j].set_title(['person', 'shirt', 'our v4 (256x192)', 'pretrained CatVTON (1024x768)'][j], fontsize=11)
    fig.suptitle(title, fontsize=13); plt.tight_layout(rect=[0, 0, 1, 0.985]); plt.savefig(f'{OUT}/{fname}', dpi=100); plt.close()


grid([(pairs[k][0], pairs[k][1], Image.open(f'{V4}/unpaired/{k:05d}.png'), done[('new', k)]) for k in pick],
     'catvton_new_shirts.png', 'New shirt on each person: our v4 vs pretrained CatVTON')
grid([(n, n, v4_worst_crop(i), done[('worst', i)]) for i, n in enumerate(worst)],
     'catvton_vs_v4_worst.png', 'v4 worst 4 (stripes, grey tee): same people with pretrained CatVTON')
print('grids saved', flush=True)
