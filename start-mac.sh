#!/bin/zsh
# Run FITTED on this Mac: model service (8000) or website (3000) or public tunnel.
#   ./start-mac.sh model     CatVTON service (uses our fine-tuned weights when present)
#   ./start-mac.sh web       production build of the site on http://localhost:3000
#   ./start-mac.sh tunnel    public https link to the site (Cloudflare quick tunnel)
cd "$(dirname "$0")"
PY=/opt/homebrew/opt/python@3.11/bin/python3.11
FT=~/virtual-tryon/run_catvton/ft/attention_final.safetensors
case "$1" in
  model)
    [[ -f $FT && -z $CATVTON_ATTN ]] && export CATVTON_ATTN=$FT
    export USE_TF=0 HF_HUB_DISABLE_XET=1 PYTORCH_ENABLE_MPS_FALLBACK=1
    cd tryon-service && exec $PY -m uvicorn main:app --host 127.0.0.1 --port 8000 ;;
  web)
    npm run build && exec npm run start -- -p 3000 ;;
  tunnel)
    exec cloudflared tunnel --no-autoupdate --url http://localhost:3000 ;;
  *) echo "usage: $0 model|web|tunnel" ;;
esac
