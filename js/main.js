// main.js - consolidated page logic for Staff Portal
(function(){
  // Helpers
  function $(id){ return document.getElementById(id); }
  function qs(sel){ return document.querySelector(sel); }

  const role = sessionStorage.getItem('userRole');
  const fullName = sessionStorage.getItem('fullName') || '';

  // User greeting / auth
  if (!fullName) {
    // not logged in
    window.location.href = 'login.html';
    return;
  }
  if ($('user-info')) $('user-info').textContent = `Welcome, ${fullName} to your staff portal!`;

  // Logout handler
  function logout(){ sessionStorage.clear(); window.location.href = 'login.html'; }
  if ($('logout-btn')) $('logout-btn').addEventListener('click', logout);

  // Role-based UI
  const postArea = $('post-news-area');
  if (postArea && (role === 'staff' || role === 'admin' || role === 'HoD' || role === 'HR')) postArea.style.display = 'block';
  const adminDropdown = $('admin-dropdown');
  if (adminDropdown && (role === 'admin' || role === 'HoD' || role === 'HR')) adminDropdown.style.display = 'inline-block';

  // Storage keys
  const NEWS_KEY = 'staffPortal_latestNews';
  const PORTAL_KEY = 'staffPortal_customPortalItems';

  function loadJSON(key){ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; }catch(e){ console.error('Failed to load', key, e); return []; } }
  function saveJSON(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){ console.error('Failed to save', key, e); } }
  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>\"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"}[s])); }

  // Render news
  function renderNews(){
    const container = $('dynamic-news'); if(!container) return;
    const items = loadJSON(NEWS_KEY);
    container.innerHTML = '';
    items.slice().reverse().forEach((item, idx) => {
      const div = document.createElement('div'); div.className = 'news-item';
      div.innerHTML = `\n          ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.title)}">` : ''}\n          <div class="news-content">\n            <h3>${escapeHtml(item.title)}</h3>\n            <p><em>Published By: ${escapeHtml(item.author)}</em></p>\n            <p><em>Published: ${escapeHtml(item.date)}</em></p>\n            <p>${escapeHtml(item.content)}</p>\n            ${item.url ? `<a href="${escapeHtml(item.url)}">Read more →</a>` : ''}\n            ${ (role === 'admin' || role === 'HR') ? `<div style="margin-top:.5rem;"><button data-idx="${idx}" class="remove-news">Remove</button></div>` : '' }\n          </div>`;
      container.appendChild(div);
    });

    if (role === 'admin' || role === 'HR'){
      container.querySelectorAll('.remove-news').forEach(btn => btn.addEventListener('click', function(){
        const i = parseInt(this.dataset.idx,10);
        const items = loadJSON(NEWS_KEY);
        const targetIndex = items.length - 1 - i;
        if (targetIndex >= 0){ items.splice(targetIndex,1); saveJSON(NEWS_KEY, items); renderNews(); }
      }));
    }
  }

  // Post news form
  const form = $('post-news-form');
  if (form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const title = $('news-title').value.trim();
      const content = $('news-content-input').value.trim();
      const url = $('news-url').value.trim();
      const image = $('news-image').value.trim();
      if (!title || !content){ alert('Please provide title and content.'); return; }
      const items = loadJSON(NEWS_KEY);
      items.push({ title, content, url, image, author: fullName, date: new Date().toLocaleDateString() });
      saveJSON(NEWS_KEY, items);
      form.reset(); renderNews(); alert('News posted.');
    });
    const cancel = $('cancel-post'); if(cancel) cancel.addEventListener('click', ()=>form.reset());
  }

  // Dropdown toggle helper (exposed globally for inline onclick handlers in HTML)
  window.toggleDropdown = function(id){
    const dropdowns = document.querySelectorAll('.dropdown-section');
    dropdowns.forEach(section => {
      if (section.id === id) section.style.display = (section.style.display === 'block') ? 'none' : 'block';
      else section.style.display = 'none';
    });
  };

  // Portal manager
  function insertPortalItemToDom(item){ if(!item.section) return; const section = document.getElementById(item.section); if(!section) return; const card = document.createElement('div'); card.className='card'; const a = document.createElement('a'); a.href = item.url; a.textContent = item.title; card.appendChild(a); const grid = section.querySelector('.dropdown-grid'); if(grid) grid.appendChild(card); }

  if (role === 'admin' || role === 'HoD' || role === 'HR'){
    const mgr = document.createElement('div'); mgr.style.position = 'fixed'; mgr.style.right='12px'; mgr.style.bottom='12px'; mgr.style.zIndex=2000;
    mgr.innerHTML = `<button id="open-portal-mgr">Manage Portal Items</button>`; document.body.appendChild(mgr);

    const modal = document.createElement('div'); modal.id='portal-mgr-modal'; modal.style.position='fixed'; modal.style.left=0; modal.style.top=0; modal.style.right=0; modal.style.bottom=0; modal.style.display='none'; modal.style.background='rgba(0,0,0,0.4)'; modal.style.padding='40px';
    modal.innerHTML = `
      <div style="background:#fff;padding:20px;max-width:720px;margin:0 auto;border-radius:6px;">
        <h3>Portal Manager</h3>
        <form id="portal-item-form">
          <input id="portal-title" placeholder="Item text (e.g. My Tasks)" style="width:100%;margin-bottom:.5rem;" required />
          <input id="portal-url" placeholder="URL (relative or absolute)" style="width:100%;margin-bottom:.5rem;" required />
          <input id="portal-section" placeholder="Section id (e.g. myWorkDropdown) - optional" style="width:100%;margin-bottom:.5rem;" />
          <div style="display:flex;gap:.5rem;"><button type="submit">Add Item</button><button type="button" id="close-portal-mgr">Close</button></div>
        </form>
        <h4>Existing Custom Items</h4>
        <div id="portal-items-list"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('open-portal-mgr').addEventListener('click', ()=>{ modal.style.display='block'; renderPortalItems(); });
    document.getElementById('close-portal-mgr').addEventListener('click', ()=>{ modal.style.display='none'; });

    const pform = document.getElementById('portal-item-form');
    pform.addEventListener('submit', function(e){ e.preventDefault(); const title = $('portal-title').value.trim(); const url = $('portal-url').value.trim(); const section = $('portal-section').value.trim(); if(!title||!url){ alert('Provide title and URL'); return; } const items = loadJSON(PORTAL_KEY); items.push({ title, url, section }); saveJSON(PORTAL_KEY, items); $('portal-title').value=''; $('portal-url').value=''; $('portal-section').value=''; renderPortalItems(); insertPortalItemToDom({ title, url, section }); });

    function renderPortalItems(){ const list = $('portal-items-list'); const items = loadJSON(PORTAL_KEY); list.innerHTML=''; items.forEach((it,i)=>{ const el = document.createElement('div'); el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center'; el.style.padding='.25rem 0'; el.innerHTML = `<div>${escapeHtml(it.title)} — <small>${escapeHtml(it.url)}</small> ${it.section?`<em>(${escapeHtml(it.section)})</em>`:''}</div><div><button data-i="${i}" class="remove-portal">Remove</button></div>`; list.appendChild(el); }); list.querySelectorAll('.remove-portal').forEach(btn=>btn.addEventListener('click', function(){ const i = parseInt(this.dataset.i,10); const items = loadJSON(PORTAL_KEY); items.splice(i,1); saveJSON(PORTAL_KEY, items); renderPortalItems(); })); }

    loadJSON(PORTAL_KEY).forEach(insertPortalItemToDom);
  }

  // Initial render
  renderNews();
})();
