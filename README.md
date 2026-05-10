# yieldcartography.com — site source

Static-HTML site deployed via Cloudflare Pages from this GitHub repo.

## Structure

```
.
├── README.md           # this file
├── build.py            # regenerate dashboard JSON from YIELDS CSVs
├── assets/             # source assets (logo, etc.)
├── data/               # generated JSON (build.py output)
├── src/                # (reserved for future template files)
└── dist/               # public-facing files served by Cloudflare Pages
    ├── index.html
    ├── about/index.html
    ├── curves/index.html
    ├── term-premia/index.html
    ├── _headers
    ├── _redirects
    └── assets/
        ├── logo.svg
        └── style.css
```

## Update workflow (after new YIELDS data)

```bash
cd ~/Documents/YC_site
python build.py
git add -A
git commit -m "Daily refresh $(date +%Y-%m-%d)"
git push
```

Cloudflare Pages auto-deploys within 30 to 60 seconds.

## Local preview

```bash
cd ~/Documents/YC_site/dist
python -m http.server 8000
# open http://localhost:8000 in browser
```

## Deployment

Cloudflare Pages project name: **yieldcartography**
- Production branch: `main`
- Build command: (none — static site)
- Build output directory: `dist`
- Custom domains: `yieldcartography.com`, `www.yieldcartography.com`

## Domain

Registered at Cloudflare Registrar, expires 2027-05-09, auto-renew on.
