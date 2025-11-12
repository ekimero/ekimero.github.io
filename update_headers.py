#!/usr/bin/env python3
"""
Script to update all HTML pages with the new header and mobile menu from index.html
"""

import os
import re
import glob
from pathlib import Path

# The new header HTML (from index.html lines 75-94)
NEW_HEADER = '''  <header>
    <a href="/index.html" class="title-link">
      <img src="/logo.png" alt="どこでも駅メロのロゴ - 発車メロディ検索サイト" class="logo">
      <b class="header1">どこでも駅メロ</b>
    </a>
    <nav>
      <a href="/jr-east.html" class="company-btn">JR東日本</a>
      <a href="/tokyo-metro.html" class="company-btn">東京メトロ</a>
      <a href="/stations/未使用.html" class="company-btn">消滅したメロディー</a>
      <div style="position:relative;display:inline-block;min-width:220px;vertical-align:middle;">
        <input id="header-search" type="text" placeholder="駅名・メロディ名で検索" 
  style="font-size:1em;padding:8px 14px;border-radius:8px;
  border:1px solid #bcd;box-shadow:0 2px 12px #1976d220;width:300px;">


        <div id="header-search-results" style="position:absolute;top:110%;left:0;width:100%;background:#fff;box-shadow:0 2px 12px #1976d220;border-radius:8px;z-index:100;display:none;"></div>
      </div>
    </nav>
    
  </header>'''

# The mobile menu styles (from index.html lines 96-206)
MOBILE_MENU_STYLES = '''<!-- Redesigned Mobile Menu: fade in/out animation with blurred background overlay -->
<style>
  /* simple header button (just 3 lines, no background) */
  .mobile-menu-btn {
    display: none;
    position: absolute;
    top: 12px;
    right: 12px;
    width: 40px;
    height: 40px;
    background: transparent;
    color: #1976d2;
    border: none;
    align-items: center;
    justify-content: center;
    z-index: 220;
    cursor: pointer;
    transition: opacity 200ms ease;
  }
  .mobile-menu-btn:hover { opacity: 0.7; }
  .mobile-menu-btn:active { opacity: 0.5; }
  .mobile-menu-btn .icon { width:24px; height:24px; }

  /* overlay container with blur effect */
  .mobile-menu-overlay { 
    position:fixed; 
    inset:0; 
    z-index:210; 
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
    opacity: 0;
    visibility: hidden;
    transition: opacity 360ms ease, 
                visibility 360ms ease, 
                backdrop-filter 360ms ease, 
                -webkit-backdrop-filter 360ms ease;
  }
  .mobile-menu-overlay.visible { 
    visibility: visible;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    opacity: 1;
  }

  /* full-screen panel with fade animation */
  .mobile-menu-panel {
    position: fixed; 
    top:0; 
    left:0;
    right:0;
    bottom:0; 
    width:100%; 
    background: rgba(255, 255, 255, 0.5); 
    z-index:230;
    opacity: 0;
    visibility: hidden;
    transition: opacity 360ms ease, 
                visibility 360ms ease;
    display:flex; 
    flex-direction:column; 
    padding:20px; 
    overflow:auto;
  }
  .mobile-menu-panel.open { 
    opacity: 1;
    visibility: visible;
  }

  /* close button in top right with X icon */
  .mobile-menu-close {
    position: absolute; 
    right: 12px; 
    top: 12px; 
    background: transparent; 
    border: none; 
    font-size: 28px; 
    color:#1976d2; 
    cursor: pointer; 
    padding:8px; 
    border-radius:8px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 200ms ease;
  }
  .mobile-menu-close:hover { opacity: 0.7; }
  .mobile-menu-close:active { opacity: 0.5; }

  .mobile-menu-header-title { text-align:center; width:100%; font-weight:800; color:#0d47a1; }

  .mobile-menu-search { margin-top:42px; margin-bottom:14px; }
  .mobile-menu-search input { width:100%; padding:12px 14px; border-radius:12px; border:1px solid #e6f3ff; font-size:16px; box-shadow: inset 0 2px 10px rgba(3,88,180,0.03); }

  .mobile-menu-links { display:flex; flex-direction:column; gap:12px; margin-top:6px; }
  .mobile-menu-links a { display:block; text-align:center; padding:14px; border-radius:12px; text-decoration:none; color:#fff; background: linear-gradient(90deg,#1976d2,#42a5f5); font-weight:800; box-shadow: 0 8px 20px rgba(25,118,210,0.08); }

  .mobile-menu-results { margin-top:14px; }
  .mobile-menu-result { 
    padding:12px 10px; 
    border-bottom:1px solid #f3f7ff; 
    background: rgba(255, 255, 255, 1);
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .mobile-menu-overlay,
.mobile-menu-panel {
  border-radius: 0 !important;
}

  .mobile-menu-result a { color:#1976d2; font-weight:700; text-decoration:none; }

  @media (max-width: 768px) {
    .mobile-menu-btn { display:inline-flex; }
    header { position: relative; }
    header nav > a.company-btn { display: none !important; }
    header nav input#header-search { display: none !important; }
    header .title-link { padding-right: 60px; }
  }
</style>'''

# The mobile menu HTML (from index.html lines 208-228)
MOBILE_MENU_HTML = '''<!-- overlay + panel markup -->
<div id="mobileMenuOverlay" class="mobile-menu-overlay" aria-hidden="true">
  <div id="mobileMenuPanel" class="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="モバイルメニュー">
    <button id="mobileMenuClose" class="mobile-menu-close" aria-label="閉じる">×</button>
    <div style="height:6px"></div>
    <div class="mobile-menu-search">
      <form id="mobileMenuSearchForm" role="search">
        <input id="mobileMenuSearchInput" type="search" placeholder="駅名・メロディ名で検索" aria-label="検索">
      </form>
    </div>

    <div class="mobile-menu-links" role="navigation" aria-label="モバイルメニューのリンク">
<a href="/jr-east.html" style="
display: inline-flex;
align-items: center;
justify-content: center;
gap: 6px; /* space between image and text */
text-decoration: none;
padding: 15px 12px;
">
<img src="/images/jr-east.png" alt="JR東日本" style="height:24px; width:auto;">
JR東日本
</a>
      <a href="/tokyo-metro.html" style="
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px; /* space between image and text */
  text-decoration: none;
  padding: 15px 12px;
">
  <img src="/images/tokyo-metro.png" alt="東京メトロ" style="height:24px; width:auto;">
  東京メトロ
</a>

<a href="/stations/未使用.html" style="
display: inline-flex;
align-items: center;
justify-content: center;
gap: 6px; /* space between image and text */
text-decoration: none;
padding: 15px 12px;
">
消滅したメロディー
</a>
<a href="/radio.html" style="
display: inline-flex;
align-items: center;
justify-content: center;
gap: 6px; /* space between image and text */
text-decoration: none;
padding: 15px 12px;
">
メロディーラジオ
</a>
    </div>

    <div class="mobile-menu-results" id="mobileSearchResults" aria-live="polite"></div>
  </div>
</div>'''

# The mobile menu script (from index.html lines 230-318)
MOBILE_MENU_SCRIPT = r'''<script>
(function(){
  // create and insert the header button so it truly lives in the header
  const header = document.querySelector('header');
  const mobileBtn = document.createElement('button');
  mobileBtn.id = 'mobileMenuButton';
  mobileBtn.className = 'mobile-menu-btn';
  mobileBtn.title = 'メニュー';
  mobileBtn.setAttribute('aria-controls','mobileMenuPanel');
  mobileBtn.setAttribute('aria-expanded','false');
  mobileBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M4 12h16M4 17h16" stroke="#1976d2" stroke-width="2" stroke-linecap="round"/></svg>';
  if (header) header.appendChild(mobileBtn);

  const btn = mobileBtn;
  const overlay = document.getElementById('mobileMenuOverlay');
  const panel = document.getElementById('mobileMenuPanel');
  const closeBtn = document.getElementById('mobileMenuClose');
  const searchForm = document.getElementById('mobileMenuSearchForm');
  const searchInput = document.getElementById('mobileMenuSearchInput');
  const resultsEl = document.getElementById('mobileSearchResults');

  function openMenu(){
    overlay.classList.add('visible');
    // allow layout, then fade panel in
    requestAnimationFrame(()=> {
      requestAnimationFrame(()=> panel.classList.add('open'));
    });
    document.body.classList.add('mobile-menu-open');
    btn.setAttribute('aria-expanded','true');
    overlay.setAttribute('aria-hidden','false');
    
  }
  function closeMenu(){
    // Remove both classes simultaneously for smooth fade out
    panel.classList.remove('open');
    overlay.classList.remove('visible');
    btn.setAttribute('aria-expanded','false');
    overlay.setAttribute('aria-hidden','true');
    document.body.classList.remove('mobile-menu-open');
    // Focus button after animation completes
    setTimeout(()=> btn.focus(), 400);
  }

  btn.addEventListener('click', (e)=>{ e.preventDefault(); openMenu(); });
  closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); closeMenu(); });
  overlay.addEventListener('click', (e)=>{ if (!panel.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeMenu(); });

  // search helper: ensure we have stations data, fetch if necessary
  async function ensureStationsData(){
    if (window.stationsData && Array.isArray(window.stationsData) && window.stationsData.length>0) return window.stationsData;
    try {
      const res = await fetch('/stations.json');
      if (!res.ok) throw new Error('stations.json fetch failed');
      const data = await res.json();
      window.stationsData = data;
      return data;
    } catch (err) {
      console.error('Failed to load stations.json for mobile search', err);
      return null;
    }
  }

  async function performSearch(q, targetEl){
    if (!q) { if (targetEl) targetEl.innerHTML=''; return; }
    const data = await ensureStationsData();
    if (!data) { if (targetEl) targetEl.innerHTML = '<div style="padding:12px;color:#888;">検索データを読み込み中です…</div>'; return; }
    const lowerQ = q.toLowerCase();
    const matches = data.filter(st => (st.station||'').toLowerCase().includes(lowerQ) || (st.melody||'').toLowerCase().includes(lowerQ));
    if (matches.length === 0) { if (targetEl) targetEl.innerHTML = '<div style="padding:12px;color:#888;">該当なし</div>'; return; }
    const html = matches.slice(0,50).map(st=>{
        const audioSrc = st.file
  ? (st.file.match(/^https?:\/\//)
      ? st.file
      : (st.file.startsWith('/') ? st.file : '/' + st.file))
  : '';

      const stationUrl = `/stations/${encodeURIComponent(st.station)}.html`;
      const melodyUrl = `/melodies/${encodeURIComponent(st.melody)}.html`;
      return `<div class="mobile-menu-result">
        <div><a href="${stationUrl}">${st.station}</a> <span style="color:#666;">(${st.line||''})</span></div>
        <div style="color:#444;margin-top:6px;"><a href="${melodyUrl}">${st.melody}</a></div>
        ${audioSrc?`<div style="margin-top:8px;"><audio controls controlsList="nodownload" src="${audioSrc}" style="width:100%;"></audio></div>`:''}
      </div>`;
    }).join('');
    if (targetEl) targetEl.innerHTML = html;
  }

  // wire events
  searchForm.addEventListener('submit', function(e){ e.preventDefault(); performSearch(searchInput.value.trim(), resultsEl); });
  searchInput.addEventListener('input', function(e){ performSearch(this.value.trim(), resultsEl); });

})();
</script>'''


def normalize_paths(html_content, file_path):
    """
    Normalize paths in the header based on the file's location.
    For root files, use absolute paths (/).
    For subdirectory files, adjust paths accordingly.
    """
    # Determine if we're in a subdirectory
    path_parts = Path(file_path).parts
    depth = len(path_parts) - 1  # Subtract 1 for the filename
    
    if depth == 0:
        # Root level - paths are already correct (absolute)
        return html_content
    else:
        # In a subdirectory - need to adjust paths
        # For now, we'll use absolute paths which work from any depth
        return html_content


def find_header_end(content, start_pos):
    """Find the end of the header tag, handling nested tags."""
    depth = 0
    i = start_pos
    in_tag = False
    
    while i < len(content):
        if content[i] == '<':
            # Check if it's a closing tag
            if i + 1 < len(content) and content[i + 1] == '/':
                # Find the tag name
                tag_end = content.find('>', i)
                if tag_end == -1:
                    break
                tag_name = content[i + 2:tag_end].split()[0]
                if tag_name.lower() == 'header':
                    if depth == 0:
                        return tag_end + 1
                    depth -= 1
            else:
                # Opening tag
                tag_end = content.find('>', i)
                if tag_end == -1:
                    break
                tag_content = content[i + 1:tag_end]
                if tag_content.lower().startswith('header'):
                    depth += 1
            i = tag_end + 1
        else:
            i += 1
    
    return -1


def update_html_file(file_path):
    """Update a single HTML file with the new header and mobile menu."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return False
    
    original_content = content
    modified = False
    
    # 1. Replace existing header
    header_pattern = r'<header[^>]*>.*?</header>'
    header_match = re.search(header_pattern, content, re.DOTALL | re.IGNORECASE)
    
    if header_match:
        # Normalize paths for this file
        normalized_header = normalize_paths(NEW_HEADER, file_path)
        content = content[:header_match.start()] + normalized_header + content[header_match.end():]
        modified = True
        print(f"  ✓ Replaced header in {file_path}")
    else:
        # Try to find where to insert header (after <body> or after </head>)
        body_match = re.search(r'<body[^>]*>', content, re.IGNORECASE)
        if body_match:
            normalized_header = normalize_paths(NEW_HEADER, file_path)
            insert_pos = body_match.end()
            content = content[:insert_pos] + '\n' + normalized_header + '\n' + content[insert_pos:]
            modified = True
            print(f"  ✓ Inserted header in {file_path}")
        else:
            print(f"  ⚠ Could not find <body> tag in {file_path}")
    
    # 2. Check if mobile menu styles exist
    if 'mobile-menu-btn' not in content:
        # Insert mobile menu styles after the header (or after </head> if no header found)
        header_end = content.find('</header>')
        if header_end != -1:
            insert_pos = header_end + len('</header>')
            content = content[:insert_pos] + '\n' + MOBILE_MENU_STYLES + '\n' + content[insert_pos:]
            modified = True
            print(f"  ✓ Added mobile menu styles to {file_path}")
        else:
            # Try after </head>
            head_end = content.find('</head>')
            if head_end != -1:
                content = content[:head_end] + '\n' + MOBILE_MENU_STYLES + '\n' + content[head_end:]
                modified = True
                print(f"  ✓ Added mobile menu styles to {file_path} (after </head>)")
    
    # 3. Check if mobile menu HTML exists
    if 'mobileMenuOverlay' not in content:
        # Insert after header or after mobile menu styles
        header_end = content.find('</header>')
        if header_end != -1:
            insert_pos = header_end + len('</header>')
            # Check if styles are right after header
            styles_pos = content.find('<!-- Redesigned Mobile Menu:', insert_pos)
            if styles_pos != -1:
                # Find end of styles
                styles_end = content.find('</style>', styles_pos) + len('</style>')
                insert_pos = styles_end
            content = content[:insert_pos] + '\n' + MOBILE_MENU_HTML + '\n' + content[insert_pos:]
            modified = True
            print(f"  ✓ Added mobile menu HTML to {file_path}")
    
    # 4. Check if mobile menu script exists
    if 'mobileMenuButton' not in content:
        # Insert before </body> or at the end
        body_end = content.rfind('</body>')
        if body_end != -1:
            content = content[:body_end] + '\n' + MOBILE_MENU_SCRIPT + '\n' + content[body_end:]
            modified = True
            print(f"  ✓ Added mobile menu script to {file_path}")
        else:
            # Insert at the end
            content = content + '\n' + MOBILE_MENU_SCRIPT
            modified = True
            print(f"  ✓ Added mobile menu script to {file_path} (at end)")
    
    if modified:
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except Exception as e:
            print(f"  ✗ Error writing {file_path}: {e}")
            return False
    
    return False


def main():
    """Main function to update all HTML files."""
    # Get all HTML files except index.html (since it's already updated)
    html_files = []
    for pattern in ['*.html', '*/*.html', '*/*/*.html']:
        html_files.extend(glob.glob(pattern, recursive=True))
    
    # Filter out index.html
    html_files = [f for f in html_files if f != 'index.html']
    
    # Remove duplicates and sort
    html_files = sorted(set(html_files))
    
    print(f"Found {len(html_files)} HTML files to update (excluding index.html)")
    print("=" * 60)
    
    updated_count = 0
    for file_path in html_files:
        print(f"\nProcessing: {file_path}")
        if update_html_file(file_path):
            updated_count += 1
    
    print("\n" + "=" * 60)
    print(f"Update complete! Updated {updated_count} out of {len(html_files)} files.")


if __name__ == '__main__':
    main()

