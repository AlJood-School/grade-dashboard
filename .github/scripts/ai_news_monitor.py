#!/usr/bin/env python3
"""
AI News Monitor for Al-Jood School Portal
Runs daily via GitHub Actions — no dependency on any external service.
Fetches education news from UAE sources, updates auto_news.json on GitHub.
"""

import os, json, re, sys, time, hashlib
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError
import urllib.parse

# ── Config ───────────────────────────────────────────────────────────────────
GITHUB_TOKEN  = os.environ['GH_TOKEN']
GEMINI_KEY    = os.environ.get('GEMINI_API_KEY', '')
REPO_OWNER    = 'AlJood-School'
REPO_NAME     = 'grade-dashboard'
BRANCH        = 'main'
NEWS_FILE     = 'auto_news.json'
MAX_NEWS      = 20  # keep latest N items

DUBAI_TZ = timezone(timedelta(hours=4))

def now_dubai():
    return datetime.now(DUBAI_TZ)

def fmt_date(dt):
    return dt.strftime('%Y-%m-%dT%H:%M:%S+04:00')

def days_from_now(n):
    return fmt_date(now_dubai() + timedelta(days=n))

# ── HTTP helper ──────────────────────────────────────────────────────────────
def fetch(url, headers=None, timeout=15):
    try:
        req = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (AlJood-NewsBot/1.0)',
            **(headers or {})
        })
        with urlopen(req, timeout=timeout) as r:
            return r.read().decode('utf-8', errors='ignore')
    except Exception as e:
        print(f'  ⚠ fetch failed: {url} → {e}')
        return ''

# ── GitHub helpers ───────────────────────────────────────────────────────────
API_BASE = 'https://api.github.com'

def gh_get(path):
    import json as j
    url = f'{API_BASE}{path}'
    req = Request(url, headers={
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    })
    try:
        with urlopen(req, timeout=20) as r:
            return j.loads(r.read())
    except Exception as e:
        print(f'GH GET error {path}: {e}')
        return None

def gh_put(path, data):
    import json as j
    url = f'{API_BASE}{path}'
    body = j.dumps(data).encode()
    req = Request(url, data=body, method='PUT', headers={
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
    })
    try:
        with urlopen(req, timeout=30) as r:
            return j.loads(r.read())
    except Exception as e:
        print(f'GH PUT error {path}: {e}')
        return None

def get_file(path):
    """Get file content + sha from GitHub"""
    data = gh_get(f'/repos/{REPO_OWNER}/{REPO_NAME}/contents/{path}?ref={BRANCH}')
    if not data:
        return None, None
    import base64
    content = base64.b64decode(data['content']).decode('utf-8')
    return content, data['sha']

def put_file(path, content, sha, message):
    """Commit file to GitHub"""
    import base64
    data = {
        'message': message,
        'content': base64.b64encode(content.encode()).decode(),
        'branch': BRANCH
    }
    if sha:
        data['sha'] = sha
    return gh_put(f'/repos/{REPO_OWNER}/{REPO_NAME}/contents/{path}', data)

# ── News sources ─────────────────────────────────────────────────────────────
def scrape_khaleej_times():
    """Scrape Khaleej Times Education section"""
    items = []
    html = fetch('https://www.khaleejtimes.com/education')
    if not html:
        return items
    # Extract article titles and links
    pattern = r'<a[^>]+href="(https://www\.khaleejtimes\.com/[^"]+)"[^>]*>\s*<h[23][^>]*>([^<]{20,200})</h[23]>'
    matches = re.findall(pattern, html, re.DOTALL)
    for url, title in matches[:6]:
        title = re.sub(r'\s+', ' ', title).strip()
        if title and len(title) > 15:
            items.append({'title': title, 'url': url, 'source': 'Khaleej Times'})
    return items

def scrape_gulf_news():
    """Scrape Gulf News education"""
    items = []
    html = fetch('https://gulfnews.com/uae/education')
    if not html:
        return items
    pattern = r'<a[^>]+href="(https://gulfnews\.com/uae/education/[^"#]+)"[^>]*>([^<]{20,200})</a>'
    matches = re.findall(pattern, html)
    for url, title in matches[:6]:
        title = re.sub(r'<[^>]+>', '', title).strip()
        title = re.sub(r'\s+', ' ', title).strip()
        if title and len(title) > 15:
            items.append({'title': title, 'url': url, 'source': 'Gulf News'})
    return items

def scrape_the_national():
    """Scrape The National UAE education"""
    items = []
    html = fetch('https://www.thenationalnews.com/uae/education/')
    if not html:
        return items
    pattern = r'<a[^>]+href="(/uae/education/[^"#]+)"[^>]*>\s*<span[^>]*>([^<]{20,200})</span>'
    matches = re.findall(pattern, html)
    for path, title in matches[:6]:
        title = re.sub(r'\s+', ' ', title).strip()
        if title and len(title) > 15:
            url = 'https://www.thenationalnews.com' + path
            items.append({'title': title, 'url': url, 'source': 'The National'})
    return items

def scrape_moe():
    """Scrape MOE news page"""
    items = []
    html = fetch('https://www.moe.gov.ae/ar/MediaCenter/News/Pages/default.aspx')
    if not html:
        return items
    # Arabic title pattern
    pattern = r'<a[^>]+href="(/ar/MediaCenter/News/Pages/[^"]+)"[^>]*>([^<]{10,200})</a>'
    matches = re.findall(pattern, html)
    for path, title in matches[:5]:
        title = re.sub(r'\s+', ' ', title).strip()
        if title and len(title) > 10 and 'Pages' not in title:
            url = 'https://www.moe.gov.ae' + path
            items.append({'title': title, 'url': url, 'source': 'MOE'})
    return items

# ── Classify news ─────────────────────────────────────────────────────────────
KEYWORDS = {
    'urgent':   ['emergency','alert','urgent','closure','closed','عاجل','إغلاق','طارئ','تحذير'],
    'holiday':  ['holiday','vacation','eid','break','عيد','إجازة','عطلة','عطله'],
    'remote':   ['remote','distance','online','virtual','تعلم عن بعد','إلكتروني','افتراضي'],
    'ramadan':  ['ramadan','رمضان'],
    'curriculum':['curriculum','grade','subject','منهج','مادة','درجات','مناهج','تعديل'],
    'document': ['circular','document','policy','announcement','وثيقة','تعميم','قرار','بلاغ'],
    'event':    ['ceremony','competition','award','festival','حفل','مسابقة','جائزة','فعالية'],
}

TYPE_EXPIRES = {
    'urgent': 2, 'holiday': 2, 'remote': 2,
    'ramadan': 2, 'curriculum': 14, 'document': 14,
    'event': 2, 'general': 7
}

TYPE_LABELS = {
    'urgent': {'ar': '🚨 عاجل', 'en': '🚨 Urgent'},
    'holiday': {'ar': '🏖️ إجازة', 'en': '🏖️ Holiday'},
    'remote': {'ar': '💻 تعلم عن بُعد', 'en': '💻 Remote Learning'},
    'ramadan': {'ar': '🌙 رمضان', 'en': '🌙 Ramadan'},
    'curriculum': {'ar': '📚 مناهج', 'en': '📚 Curriculum'},
    'document': {'ar': '📄 وثيقة', 'en': '📄 Document'},
    'event': {'ar': '📅 فعالية', 'en': '📅 Event'},
    'general': {'ar': '📰 عام', 'en': '📰 General'},
}

def classify(title):
    tl = title.lower()
    for t, kws in KEYWORDS.items():
        if any(k.lower() in tl for k in kws):
            return t
    return 'general'

def school_type(title, source):
    tl = title.lower()
    if any(k in tl for k in ['private','خاصة','خاص','إيلتس','cbse','ib ']):
        return '(المدارس الخاصة)' if source in ['Khaleej Times','Gulf News','The National'] else '(Private Schools)'
    if source == 'MOE':
        return '(جميع المدارس)'
    return '(جميع المدارس)'

def make_id(title):
    return hashlib.md5(title.encode()).hexdigest()[:12]

# ── Gemini summarize (optional, fallback to title if no key) ─────────────────
def summarize(title, news_type):
    if not GEMINI_KEY:
        return title
    try:
        prompt = f"Summarize this UAE education news in ONE short Arabic sentence (max 15 words), keep it factual: {title}"
        body = json.dumps({"contents":[{"parts":[{"text": prompt}]}]})
        req = Request(
            f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_KEY}',
            data=body.encode(), method='POST',
            headers={'Content-Type': 'application/json'}
        )
        with urlopen(req, timeout=10) as r:
            result = json.loads(r.read())
            text = result['candidates'][0]['content']['parts'][0]['text'].strip()
            return text if text else title
    except:
        return title

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print(f'🕐 AI News Monitor starting — {now_dubai().strftime("%Y-%m-%d %H:%M")} Dubai time')

    # Load existing news
    existing_content, existing_sha = get_file(NEWS_FILE)
    existing = json.loads(existing_content) if existing_content else {"news": [], "lastUpdated": ""}
    existing_ids = {item.get('id') for item in existing.get('news', [])}

    print(f'📰 Existing news: {len(existing.get("news", []))} items')

    # Scrape all sources
    all_scraped = []
    print('🔍 Scraping sources...')
    for scraper in [scrape_khaleej_times, scrape_gulf_news, scrape_the_national, scrape_moe]:
        results = scraper()
        print(f'  {scraper.__name__}: {len(results)} articles')
        all_scraped.extend(results)

    # Build new news items
    new_items = []
    for art in all_scraped:
        title = art['title']
        nid = make_id(title)
        if nid in existing_ids:
            continue  # already have it

        news_type = classify(title)
        expires_days = TYPE_EXPIRES.get(news_type, 7)
        label = TYPE_LABELS.get(news_type, TYPE_LABELS['general'])
        stype = school_type(title, art['source'])

        item = {
            'id': nid,
            'title': title + ' ' + stype,
            'title_ar': title + ' ' + stype,
            'url': art['url'],
            'source': art['source'],
            'type': news_type,
            'label_ar': label['ar'],
            'label_en': label['en'],
            'date': fmt_date(now_dubai()),
            'expires': days_from_now(expires_days),
            'color': '#ef4444' if news_type == 'urgent' else '#0ea5e9',
            'urgent': news_type == 'urgent'
        }
        new_items.append(item)

    print(f'✨ New items: {len(new_items)}')

    # Remove expired items
    now = now_dubai()
    kept = []
    for item in existing.get('news', []):
        try:
            exp = datetime.fromisoformat(item['expires'].replace('Z','+00:00'))
            if exp.replace(tzinfo=timezone.utc) > now.replace(tzinfo=timezone.utc):
                kept.append(item)
        except:
            kept.append(item)  # keep if can't parse

    # Merge: new items first, then existing
    merged = new_items + kept
    merged = merged[:MAX_NEWS]

    updated = {
        "news": merged,
        "lastUpdated": fmt_date(now_dubai()),
        "totalCount": len(merged),
        "newCount": len(new_items)
    }

    # Commit to GitHub
    content_str = json.dumps(updated, ensure_ascii=False, indent=2)
    result = put_file(
        NEWS_FILE, content_str, existing_sha,
        f'📰 تحديث الأخبار التلقائي — {len(new_items)} خبر جديد — {now_dubai().strftime("%Y-%m-%d")}'
    )

    if result:
        print(f'✅ Committed {len(new_items)} new items ({len(merged)} total)')
    else:
        print('❌ Failed to commit')
        sys.exit(1)

if __name__ == '__main__':
    main()
