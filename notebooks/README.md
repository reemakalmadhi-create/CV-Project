# Notebooks and scripts

All work on VITON-HD (11,647 train / 2,032 test photos), run on a MacBook Air M4.

## Our own model (no diffusion)

Segmentation, then a flow warp of the shirt, then a U-Net that draws the result. Scored at 256x192.

| Notebook | What changed | SSIM | LPIPS | FID |
|---|---|---|---|---|
| `train_tryon_mac_v1.ipynb` | First full pipeline | 0.870 | 0.131 | 17.97 |
| `train_tryon_mac_v2.ipynb` | Paste known pixels + GAN | 0.877 | 0.108 | 13.24 |
| `train_tryon_mac_v3.ipynb` | Fixes v2 copying the old shirt shape | 0.803 | 0.209 | 48.6 |
| `train_tryon_mac_v4.ipynb` | Keeps real hands, pose in layout | 0.834 | 0.164 | 25.89 |

v1 and v2 score well because they copy the old shirt's shape, so a hoodie gets cut like the old tee.
v3 and v4 draw the new shape, which is harder and scores lower.

## Pretrained CatVTON and our fine-tune

- `tryon_pretrained_catvton.ipynb`: CatVTON (ICLR 2025) with our own mask, 512x384.
- `scripts/catvton_finetune.py`: fine-tunes CatVTON's attention layers on the train split with our masks.
- `scripts/cat_scores_ft.py`: scores it on 60 test photos and makes the before/after grid.
- `scripts/cat_scores_full.py`: scores it on all 2,032 test photos (paired and unpaired FID).

Same 60 test photos:

| Model | SSIM | LPIPS | PSNR |
|---|---|---|---|
| Our v4 | 0.831 | 0.163 | 21.0 |
| CatVTON original | 0.856 | 0.104 | 21.37 |
| CatVTON fine-tuned by us | 0.876 | 0.081 | 22.89 |

Second check on 73 other test photos: v4 0.838 / 0.162 / 20.78, fine-tuned 0.889 / 0.074 / 22.89
(better than v4 on 97%). The full 2,032-photo run was stopped at 73; `cat_scores_full.py` resumes it.
Result images: `fitted-app/tryon-service/results/`.

Fine-tuned weights: see the repo's Releases page (`attention_final.safetensors`, 446 MB).

## Earlier Colab notebooks

`virtual_tryon_vitonhd.ipynb` and `A_` to `D_` (paired test, unpaired test, real photos, ablation)
were the first plan for running CatVTON on Colab.
