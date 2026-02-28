"""
============================================================
RHILEY MEGA SCRAPER
Scrapes 100 GitHub repos + Behance + Dribbble CSS/JS
Saves directly to UI COMP folder
Run: python mega_scraper.py
============================================================
"""

import os, json, time, re, sys, subprocess
from pathlib import Path
from urllib.parse import urljoin, urlparse

# ============================================================
# ⚙️  CONFIG — CHANGE THESE 2 LINES ONLY
# ============================================================

GITHUB_TOKEN  = ""
# Your GitHub token for higher rate limits

OUTPUT_FOLDER = Path(r"C:\Users\saipr\Downloads\Rhiley\Backend\UI COMP")
# Your UI COMP folder — datasets save here automatically

# ============================================================
# 100 GITHUB REPOS
# ============================================================

REPOS = [
    # Animation
    {"repo": "framer/motion",                         "tag": "framer-motion",     "priority": "high"},
    {"repo": "greensock/GSAP",                        "tag": "gsap",              "priority": "high"},
    {"repo": "juliangarnier/anime",                   "tag": "anime-js",          "priority": "high"},
    {"repo": "theatre-js/theatre",                    "tag": "animation-timeline","priority": "high"},
    {"repo": "pmndrs/react-spring",                   "tag": "react-spring",      "priority": "high"},
    {"repo": "michalsnik/aos",                        "tag": "scroll-reveal",     "priority": "medium"},
    {"repo": "alexfoxy/lax.js",                       "tag": "scroll-anim",       "priority": "medium"},
    {"repo": "dixonandmoe/rellax",                    "tag": "parallax",          "priority": "medium"},
    {"repo": "visionmedia/move.js",                   "tag": "animation",         "priority": "low"},
    {"repo": "nicktindall/cycads",                    "tag": "canvas-anim",       "priority": "medium"},

    # 3D
    {"repo": "mrdoob/three.js",                       "tag": "threejs",           "priority": "high"},
    {"repo": "pmndrs/react-three-fiber",              "tag": "r3f",               "priority": "high"},
    {"repo": "pmndrs/drei",                           "tag": "drei",              "priority": "high"},
    {"repo": "pmndrs/postprocessing",                 "tag": "post-processing",   "priority": "high"},
    {"repo": "pmndrs/uikit",                          "tag": "3d-ui",             "priority": "high"},
    {"repo": "pmndrs/cannon-es",                      "tag": "physics",           "priority": "medium"},
    {"repo": "BabylonJS/Babylon.js",                  "tag": "babylonjs",         "priority": "medium"},
    {"repo": "spite/THREE.MeshLine",                  "tag": "three-meshline",    "priority": "medium"},
    {"repo": "ashima/webgl-noise",                    "tag": "glsl-noise",        "priority": "high"},
    {"repo": "spite/vertex-shader-art",               "tag": "shaders",           "priority": "high"},

    # UI Libraries
    {"repo": "shadcn-ui/ui",                          "tag": "shadcn",            "priority": "high"},
    {"repo": "radix-ui/primitives",                   "tag": "radix",             "priority": "high"},
    {"repo": "nextui-org/nextui",                     "tag": "nextui",            "priority": "high"},
    {"repo": "chakra-ui/chakra-ui",                   "tag": "chakra",            "priority": "high"},
    {"repo": "mantinedev/mantine",                    "tag": "mantine",           "priority": "high"},
    {"repo": "tremor-raw/tremor",                     "tag": "tremor",            "priority": "medium"},
    {"repo": "ant-design/ant-design",                 "tag": "antd",              "priority": "medium"},
    {"repo": "ariakit/ariakit",                       "tag": "ariakit",           "priority": "medium"},
    {"repo": "emilkowalski/vaul",                     "tag": "drawer",            "priority": "high"},
    {"repo": "emilkowalski/sonner",                   "tag": "toast",             "priority": "high"},
    {"repo": "pacocoursey/cmdk",                      "tag": "command-menu",      "priority": "high"},
    {"repo": "floating-ui/floating-ui",               "tag": "floating-ui",       "priority": "high"},
    {"repo": "unovue/radix-vue",                      "tag": "radix-vue",         "priority": "medium"},

    # Magic / Creative UI
    {"repo": "magicuidesign/magicui",                 "tag": "magic-ui",          "priority": "high"},
    {"repo": "ibelick/background-snippet",            "tag": "bg-effects",        "priority": "high"},
    {"repo": "ibelick/motion-primitives",             "tag": "motion-primitives", "priority": "high"},
    {"repo": "lukacho/ui",                            "tag": "lukacho-ui",        "priority": "high"},
    {"repo": "davidhellmann/tailwindcss-baukasten",   "tag": "tailwind-kit",      "priority": "medium"},

    # Landing Pages & Templates
    {"repo": "cruip/tailwind-landing-page-template",  "tag": "landing",           "priority": "high"},
    {"repo": "cruip/open-react-template",             "tag": "landing",           "priority": "high"},
    {"repo": "cruip/tailwind-startup-template",       "tag": "startup-landing",   "priority": "high"},
    {"repo": "steven-tey/precedent",                  "tag": "saas-template",     "priority": "high"},
    {"repo": "steven-tey/dub",                        "tag": "saas-app",          "priority": "high"},
    {"repo": "ixartz/Next-js-Boilerplate",            "tag": "nextjs-template",   "priority": "medium"},
    {"repo": "leerob/leerob.io",                      "tag": "portfolio",         "priority": "high"},
    {"repo": "vercel/examples",                       "tag": "vercel-examples",   "priority": "high"},
    {"repo": "vercel/commerce",                       "tag": "ecommerce",         "priority": "medium"},
    {"repo": "planetscale/beam",                      "tag": "saas-ui",           "priority": "medium"},

    # CSS Effects & Art
    {"repo": "chokcoco/iCSS",                         "tag": "css-art",           "priority": "high"},
    {"repo": "chokcoco/CSS-Inspiration",              "tag": "css-inspiration",   "priority": "high"},
    {"repo": "codrops/CSS_Filters_Playground",        "tag": "css-filters",       "priority": "high"},
    {"repo": "codrops/PageTransitions",               "tag": "page-transitions",  "priority": "high"},
    {"repo": "codrops/CardExpansionEffect",           "tag": "card-effect",       "priority": "high"},
    {"repo": "codrops/InfiniteGridMenu",              "tag": "grid-menu",         "priority": "high"},
    {"repo": "codrops/MorphingPageTransition",        "tag": "morph-transition",  "priority": "high"},
    {"repo": "codrops/GridLayoutAnimations",          "tag": "grid-animation",    "priority": "high"},
    {"repo": "codrops/TextStylesInspiration",         "tag": "text-effects",      "priority": "high"},
    {"repo": "codrops/BarbaJS",                       "tag": "page-transitions",  "priority": "high"},

    # Tailwind
    {"repo": "tailwindlabs/tailwindcss",              "tag": "tailwind",          "priority": "high"},
    {"repo": "tailwindlabs/headlessui",               "tag": "headlessui",        "priority": "high"},
    {"repo": "saadeghi/daisyui",                      "tag": "daisyui",           "priority": "medium"},
    {"repo": "preline/preline",                       "tag": "preline",           "priority": "medium"},
    {"repo": "themesberg/flowbite",                   "tag": "flowbite",          "priority": "medium"},

    # Charts & Data Viz
    {"repo": "recharts/recharts",                     "tag": "recharts",          "priority": "high"},
    {"repo": "d3/d3",                                 "tag": "d3",                "priority": "high"},
    {"repo": "chartjs/Chart.js",                      "tag": "chartjs",           "priority": "medium"},
    {"repo": "apache/echarts",                        "tag": "echarts",           "priority": "medium"},
    {"repo": "airbnb/visx",                           "tag": "visx",              "priority": "medium"},

    # Scroll & Smooth
    {"repo": "locomotivemtl/locomotive-scroll",       "tag": "locomotive-scroll", "priority": "high"},
    {"repo": "studio-freight/lenis",                  "tag": "lenis",             "priority": "high"},

    # Icons
    {"repo": "lucide-icons/lucide",                   "tag": "lucide-icons",      "priority": "medium"},
    {"repo": "tabler/tabler-icons",                   "tag": "tabler-icons",      "priority": "medium"},
    {"repo": "simple-icons/simple-icons",             "tag": "brand-icons",       "priority": "low"},
    {"repo": "phosphor-icons/phosphor-home",          "tag": "phosphor",          "priority": "low"},

    # State Management
    {"repo": "pmndrs/zustand",                        "tag": "zustand",           "priority": "medium"},
    {"repo": "pmndrs/jotai",                          "tag": "jotai",             "priority": "medium"},
    {"repo": "TanStack/query",                        "tag": "react-query",       "priority": "medium"},

    # Hooks & Utils
    {"repo": "uidotdev/usehooks",                     "tag": "react-hooks",       "priority": "high"},
    {"repo": "streamich/react-use",                   "tag": "react-use",         "priority": "medium"},

    # Generative Art
    {"repo": "georgedoescode/generative-utils",       "tag": "generative-art",    "priority": "high"},
    {"repo": "mattdesl/canvas-sketch",                "tag": "canvas-art",        "priority": "high"},

    # Forms & Validation
    {"repo": "react-hook-form/react-hook-form",       "tag": "react-hook-form",   "priority": "high"},
    {"repo": "colinhacks/zod",                        "tag": "zod",               "priority": "medium"},

    # Tables & Data
    {"repo": "TanStack/table",                        "tag": "tanstack-table",    "priority": "medium"},
    {"repo": "TanStack/virtual",                      "tag": "virtualization",    "priority": "medium"},

    # Drag & Drop
    {"repo": "atlassian/pragmatic-drag-and-drop",     "tag": "drag-drop",         "priority": "medium"},
    {"repo": "clauderic/dnd-kit",                     "tag": "dnd-kit",           "priority": "high"},

    # Auth & Backend
    {"repo": "nextauthjs/next-auth",                  "tag": "next-auth",         "priority": "medium"},
    {"repo": "supabase/supabase",                     "tag": "supabase",          "priority": "medium"},

    # Design Systems
    {"repo": "vercel/geist-font",                     "tag": "geist-font",        "priority": "medium"},
    {"repo": "system-ui/theme-specification",         "tag": "design-tokens",     "priority": "medium"},

    # Full Apps for UI patterns
    {"repo": "calcom/cal.com",                        "tag": "dashboard-ui",      "priority": "medium"},
    {"repo": "twentyhq/twenty",                       "tag": "crm-ui",            "priority": "medium"},
    {"repo": "timlrx/tailwind-nextjs-starter-blog",  "tag": "blog-template",     "priority": "medium"},

    # Extra Creative
    {"repo": "nicktindall/cycads",                    "tag": "generative",        "priority": "medium"},
    {"repo": "trpc/trpc",                             "tag": "trpc",              "priority": "medium"},
]

# ============================================================
# DESIGN SITES — Behance + Dribbble quality
# ============================================================

SITES = [
    # Top portfolios
    {"url": "https://bruno-simon.com",              "tag": "3d-portfolio",     "priority": "high"},
    {"url": "https://lusion.co",                    "tag": "webgl-agency",     "priority": "high"},
    {"url": "https://www.activetheory.net",         "tag": "creative-agency",  "priority": "high"},
    {"url": "https://rauno.me",                     "tag": "react-portfolio",  "priority": "high"},
    {"url": "https://paco.me",                      "tag": "minimal-portfolio","priority": "high"},
    {"url": "https://www.joshwcomeau.com",          "tag": "dev-portfolio",    "priority": "high"},
    {"url": "https://www.adhamdannaway.com",        "tag": "portfolio",        "priority": "high"},
    {"url": "https://www.antinomy.co",              "tag": "portfolio",        "priority": "high"},
    {"url": "https://www.resn.co.nz",              "tag": "creative-agency",  "priority": "high"},
    {"url": "https://www.madebyfolk.com",           "tag": "agency",           "priority": "high"},

    # SaaS & Product sites
    {"url": "https://linear.app",                   "tag": "saas-dark",        "priority": "high"},
    {"url": "https://www.framer.com",               "tag": "framer-site",      "priority": "high"},
    {"url": "https://vercel.com",                   "tag": "saas-landing",     "priority": "high"},
    {"url": "https://supabase.com",                 "tag": "saas-dark",        "priority": "high"},
    {"url": "https://planetscale.com",              "tag": "saas-dark",        "priority": "high"},
    {"url": "https://railway.app",                  "tag": "saas-dark",        "priority": "high"},
    {"url": "https://stripe.com",                   "tag": "saas-landing",     "priority": "medium"},
    {"url": "https://fly.io",                       "tag": "saas-minimal",     "priority": "medium"},

    # UI Component showcases
    {"url": "https://ui.aceternity.com",            "tag": "glassmorphism",    "priority": "high"},
    {"url": "https://magicui.design",               "tag": "magic-ui",         "priority": "high"},
    {"url": "https://ui.shadcn.com",                "tag": "shadcn-dark",      "priority": "high"},
    {"url": "https://uiverse.io",                   "tag": "ui-elements",      "priority": "high"},
    {"url": "https://animista.net",                 "tag": "css-animations",   "priority": "high"},

    # Codrops effects
    {"url": "https://tympanus.net/codrops/2024/01/08/spotlight-cursor-effect",    "tag": "cursor-effect",  "priority": "high"},
    {"url": "https://tympanus.net/codrops/2023/12/19/scroll-driven-animations",   "tag": "scroll-anim",    "priority": "high"},
    {"url": "https://tympanus.net/codrops/2023/10/25/3d-card-shading-effect",     "tag": "3d-card",        "priority": "high"},
    {"url": "https://tympanus.net/codrops/2024/03/12/text-hover-effects",         "tag": "text-effect",    "priority": "high"},
    {"url": "https://tympanus.net/codrops/2024/02/01/infinite-marquee-effect",    "tag": "marquee",        "priority": "high"},
    {"url": "https://tympanus.net/codrops/2023/08/08/magnetic-button-effect",     "tag": "magnetic-btn",   "priority": "high"},
    {"url": "https://tympanus.net/codrops/2023/09/05/webgl-distortion-hover",     "tag": "webgl-hover",    "priority": "high"},
]

# ============================================================
# CONSTANTS
# ============================================================

INCLUDE_EXT   = {".tsx", ".ts", ".jsx", ".js", ".css", ".scss", ".html"}
SKIP_DIRS     = {"node_modules", ".git", "dist", "build", ".next", "coverage", "__tests__", ".turbo", "out"}
MAX_FILE_SIZE = 80_000
MAX_PER_REPO  = 150
MIN_CSS       = 200
MIN_JS        = 100
SKIP_JS       = ["gtag", "analytics", "facebook", "twitter", "ads", "tracking", "hotjar", "clarity", "heap"]

GH_HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
WEB_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}

# ============================================================
# GITHUB FUNCTIONS
# ============================================================

def get_tree(repo):
    import requests
    try:
        r = requests.get(f"https://api.github.com/repos/{repo}/git/trees/HEAD?recursive=1", headers=GH_HEADERS, timeout=30)
        if r.status_code == 401: print("  ✗ Bad token"); return []
        if r.status_code == 404: print(f"  ✗ Not found: {repo}"); return []
        if r.status_code == 403: print(f"  ✗ Rate limited — wait 60s"); time.sleep(60); return []
        return r.json().get("tree", []) if r.status_code == 200 else []
    except: return []

def get_file(repo, path, size):
    import requests
    if size > MAX_FILE_SIZE: return None
    try:
        r = requests.get(f"https://raw.githubusercontent.com/{repo}/HEAD/{path}", timeout=20)
        return r.text if r.status_code == 200 else None
    except: return None

def is_good_code(content, ext):
    if len(content.strip()) < 80: return False
    if ext in {".tsx", ".jsx"}: return "return" in content or "export" in content
    if ext in {".ts", ".js"}: return any(k in content for k in ["export", "function", "const ", "class "])
    return True

def make_instruction(path, tag):
    ext = Path(path).suffix
    name = Path(path).name
    if ext in {".tsx", ".jsx"}: return f"Write a production React component like {name} using {tag} patterns"
    if ext in {".ts", ".js"}: return f"Write TypeScript like {name} following {tag} conventions"
    if ext in {".css", ".scss"}: return f"Write CSS like {name} using {tag} design system"
    return f"Show code from {name} ({tag})"

def scrape_github(seen_github=None):
    print("\n🐙 GITHUB SCRAPER — 100 repos")
    print("─" * 50)

    if not GITHUB_TOKEN or "YOUR_GITHUB_TOKEN" in GITHUB_TOKEN:
        print("⚠️  Set GITHUB_TOKEN at top of file!")
        print("   github.com/settings/tokens → public_repo")
        return []

    results = []
    repo_seen = set()
    if seen_github is None: seen_github = set()

    for cfg in REPOS:
        repo, tag, priority = cfg["repo"], cfg["tag"], cfg["priority"]
        if repo in repo_seen: continue
        repo_seen.add(repo)

        print(f"\n  📦 {repo} [{tag}]")
        tree = get_tree(repo)
        if not tree: continue

        files = [f for f in tree
            if f["type"] == "blob"
            and Path(f["path"]).suffix in INCLUDE_EXT
            and not any(s in f["path"].split("/") for s in SKIP_DIRS)
        ]
        files.sort(key=lambda f: 0 if Path(f["path"]).suffix in {".tsx",".jsx"} else 1 if Path(f["path"]).suffix in {".ts",".js"} else 2)
        files = files[:MAX_PER_REPO]

        count = 0
        for f in files:
            file_key = f"{repo}:{f['path']}"
            if file_key in seen_github:
                # print(f"     · skip {f['path']}") # Too noisy
                continue

            c = get_file(repo, f["path"], f.get("size", 0))
            if not c or not is_good_code(c, Path(f["path"]).suffix): continue
            results.append({
                "type": "github", "tag": tag, "priority": priority,
                "repo": repo, "path": f["path"],
                "instruction": make_instruction(f["path"], tag),
                "code": c,
            })
            count += 1
            seen_github.add(file_key)
            time.sleep(0.04)

        print(f"     ✓ {count} files")
        time.sleep(0.5)

    return results

# ============================================================
# DESIGN SITE FUNCTIONS
# ============================================================

def good_css(css):
    signals = ["@keyframes","animation","transition","transform","cubic-bezier",
               "backdrop-filter","clip-path","perspective","will-change","gradient","blur"]
    return sum(1 for s in signals if s in css.lower()) >= 2

def good_js(js):
    signals = ["requestAnimationFrame","gsap","three","ScrollTrigger",
               "IntersectionObserver","canvas","WebGL","shader","animate","lerp","easing","tween"]
    return any(s in js for s in signals)

def clean_css(css):
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    return re.sub(r"\s+", " ", css).strip()

def clean_js(js):
    js = re.sub(r"//# sourceMappingURL=.*$", "", js, flags=re.MULTILINE)
    return re.sub(r"/\*.*?\*/", "", js, flags=re.DOTALL).strip()

def scrape_site(url, tag, priority):
    import requests
    from bs4 import BeautifulSoup
    domain = urlparse(url).netloc
    examples = []
    try:
        res = requests.get(url, headers=WEB_HEADERS, timeout=20)
        if res.status_code != 200: print(f"     ✗ {res.status_code}"); return []
    except Exception as e: print(f"     ✗ {e}"); return []

    soup = BeautifulSoup(res.text, "html.parser")

    for style in soup.find_all("style"):
        css = style.get_text(strip=True)
        if len(css) >= MIN_CSS and good_css(css):
            examples.append({"type":"css","tag":tag,"priority":priority,"source":url,
                "instruction":f"Write CSS animations like {domain} ({tag} design)","code":clean_css(css[:8000])})

    for link in soup.find_all("link", rel="stylesheet"):
        href = link.get("href","")
        if not href: continue
        css_url = urljoin(url, href)
        try:
            r = requests.get(css_url, headers=WEB_HEADERS, timeout=15)
            if r.status_code == 200 and len(r.text) >= MIN_CSS and good_css(r.text):
                examples.append({"type":"css","tag":tag,"priority":priority,"source":css_url,
                    "instruction":f"Write CSS like {Path(urlparse(css_url).path).name} from {domain} ({tag})",
                    "code":clean_css(r.text[:10000])})
            time.sleep(0.2)
        except: continue

    for script in soup.find_all("script"):
        if script.get("src"): continue
        js = script.get_text(strip=True)
        if len(js) >= MIN_JS and good_js(js):
            examples.append({"type":"js","tag":tag,"priority":priority,"source":url,
                "instruction":f"Write JS animation code like {domain} ({tag})","code":clean_js(js[:8000])})

    for script in soup.find_all("script", src=True):
        src = script.get("src","")
        if not src or any(s in src for s in SKIP_JS): continue
        js_url = urljoin(url, src)
        try:
            r = requests.get(js_url, headers=WEB_HEADERS, timeout=15)
            if r.status_code == 200 and len(r.text) >= MIN_JS and good_js(r.text):
                examples.append({"type":"js","tag":tag,"priority":priority,"source":js_url,
                    "instruction":f"Write JS like {Path(urlparse(js_url).path).name} from {domain} ({tag})",
                    "code":clean_js(r.text[:10000])})
            time.sleep(0.2)
        except: continue

    return examples

def scrape_sites(seen_sites=None):
    print("\n🎨 DESIGN SITES — Behance + Dribbble quality")
    print("─" * 50)
    results = []
    if seen_sites is None: seen_sites = set()
    for site in SITES:
        url, tag, priority = site["url"], site["tag"], site["priority"]
        domain = urlparse(url).netloc
        
        if url in seen_sites:
            print(f"\n  🌐 {domain} [{tag}] — Already scraped, skipping...")
            continue
            
        print(f"\n  🌐 {domain} [{tag}]")
        ex = scrape_site(url, tag, priority)
        
        # Site deduplication for sub-assets
        filtered_ex = []
        for e in ex:
            if e["source"] in seen_sites: continue
            filtered_ex.append(e)
            seen_sites.add(e["source"])
            
        results.extend(filtered_ex)
        seen_sites.add(url)
        
        css = sum(1 for e in filtered_ex if e["type"]=="css")
        js  = sum(1 for e in filtered_ex if e["type"]=="js")
        print(f"     ✓ {css} CSS + {js} JS")
        time.sleep(1.2)
    return results

# ============================================================
# MAIN
# ============================================================

def install_deps():
    pkgs = []
    try: import requests
    except: pkgs.append("requests")
    try: import bs4
    except: pkgs.append("beautifulsoup4")
    if pkgs:
        print(f"Installing: {pkgs}")
        subprocess.run([sys.executable, "-m", "pip", "install"] + pkgs, check=True)
        print("Done. Restarting...")
        os.execv(sys.executable, [sys.executable] + sys.argv)

def main():
    import datetime
    install_deps()
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    start = time.time()

    print("\n" + "="*60)
    print("🧠 RHILEY MEGA SCRAPER (Deduplication Enabled)")
    print(f"📁 Saving to: {OUTPUT_FOLDER}")
    print("="*60)

    # Load existing data
    github_dataset_path = OUTPUT_FOLDER / "rhiley-github-dataset.json"
    behance_dataset_path = OUTPUT_FOLDER / "rhiley-behance-dataset.json"
    
    existing_github = []
    if github_dataset_path.exists():
        try:
            with open(github_dataset_path, "r", encoding="utf-8") as f:
                existing_github = json.load(f)
        except: existing_github = []
        
    existing_behance = []
    if behance_dataset_path.exists():
        try:
            with open(behance_dataset_path, "r", encoding="utf-8") as f:
                existing_behance = json.load(f)
        except: existing_behance = []

    # Map existing to seen sets
    seen_github = {f"{item['repo']}:{item['path']}" for item in existing_github if 'repo' in item and 'path' in item}
    seen_sites = {item['source'] for item in existing_behance if 'source' in item}
    
    print(f"📍 Found {len(seen_github)} existing GitHub files.")
    print(f"📍 Found {len(seen_sites)} existing design assets.")

    # Scrape NEW data
    new_github_data = scrape_github(seen_github)
    new_site_data   = scrape_sites(seen_sites)
    
    # Merge
    total_github = existing_github + new_github_data
    total_behance = existing_behance + new_site_data
    master         = total_github + total_behance

    # Save all 3 files
    files = {
        "rhiley-github-dataset.json":  total_github,
        "rhiley-behance-dataset.json": total_behance,
        "rhiley-master-dataset.json":  master,
    }
    for name, data in files.items():
        path = OUTPUT_FOLDER / name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        size = round(path.stat().st_size / 1_000_000, 2)
        print(f"  ✓ {name} ({size} MB) - {len(data)} items total")

    # Stats
    elapsed = round(time.time() - start, 1)
    stats = {
        "scraped_at": datetime.datetime.now().isoformat(),
        "time_seconds": elapsed,
        "new_github_count": len(new_github_data),
        "new_sites_count": len(new_site_data),
        "cumulative_total": len(master),
        "master_mb": round((OUTPUT_FOLDER/"rhiley-master-dataset.json").stat().st_size/1_000_000, 2),
    }
    with open(OUTPUT_FOLDER / "rhiley-scrape-stats.json", "w") as f:
        json.dump(stats, f, indent=2)

    print(f"\n{'='*60}")
    print("✅ DONE!")
    print(f"   New GitHub:  {len(new_github_data)} files")
    print(f"   New Sites:   {len(new_site_data)} assets")
    print(f"   Grand Total: {len(master)} examples")
    print(f"   Time:        {elapsed}s")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
