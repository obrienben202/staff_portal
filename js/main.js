// main.js - consolidated page logic for Staff Portal
(function(){
  // Helpers
  function $(id){ return document.getElementById(id); }
  function qs(sel){ return document.querySelector(sel); }

  const role = sessionStorage.getItem('userRole');
  const fullName = sessionStorage.getItem('fullName') || '';
  const authorizedRoles = ['admin', 'HR', 'HoD'];

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

  // Role-based UI visibility
  const isAuthorized = authorizedRoles.includes(role);

  const postArea = $('post-news-area');
  if (postArea) postArea.style.display = isAuthorized ? 'block' : 'none';

  const adminNavLink = $('admin-nav-link');
  if (adminNavLink) adminNavLink.style.display = isAuthorized ? 'inline-block' : 'none';

  // Storage keys
  const NEWS_KEY = 'staffPortal_latestNews';
  const PORTAL_KEY = 'staffPortal_customPortalItems';

  function loadJSON(key){ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; }catch(e){ console.error('Failed to load', key, e); return []; } }
  function saveJSON(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){ console.error('Failed to save', key, e); } }
  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s])); }

  // Render news
  function renderNews(){
    const container = $('dynamic-news'); if(!container) return;
    const items = loadJSON(NEWS_KEY);
    container.innerHTML = '';
    // We reverse to show newest first, but we need to track original index for removal
    items.slice().reverse().forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'news-card'; // Match CSS in staff_portal_style.css
      div.innerHTML = `
          ${item.image ? `<img src="${item.image}" alt="${escapeHtml(item.title)}">` : ''}
          <h3>${escapeHtml(item.title)}</h3>
          <p style="font-size:0.8em; margin-bottom:5px;"><em>Published: ${escapeHtml(item.date)}</em></p>
          <p class="news-summary">${escapeHtml(item.content)}</p>
          ${item.url ? `<a href="${escapeHtml(item.url)}" class="read-more">Read More</a>` : ''}
          ${ isAuthorized ? `<div style="margin-top:.5rem;"><button data-idx="${idx}" class="remove-news" style="background:#e74c3c; color:white; border:none; border-radius:3px; padding:4px 8px; cursor:pointer; font-size:0.8em;">Remove</button></div>` : '' }
      `;
      container.appendChild(div);
    });

    if (isAuthorized){
      container.querySelectorAll('.remove-news').forEach(btn => btn.addEventListener('click', function(){
        const i = parseInt(this.dataset.idx,10);
        const currentItems = loadJSON(NEWS_KEY);
        // Reversed index back to original
        const targetIndex = currentItems.length - 1 - i;
        if (targetIndex >= 0){
            if(confirm('Are you sure you want to remove this news item?')) {
                currentItems.splice(targetIndex,1);
                saveJSON(NEWS_KEY, currentItems);
                renderNews();
            }
        }
      }));
    }
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
  function insertPortalItemToDom(item){
    if(!item.section) return;
    const section = document.getElementById(item.section);
    if(!section) return;
    const card = document.createElement('div'); card.className='card';
    const a = document.createElement('a'); a.href = item.url; a.textContent = item.title;
    card.appendChild(a);
    const grid = section.querySelector('.dropdown-grid');
    if(grid) grid.appendChild(card);
  }

  if (isAuthorized){
    const mgr = document.createElement('div');
    mgr.style.position = 'fixed'; mgr.style.right='12px'; mgr.style.bottom='12px'; mgr.style.zIndex=2000;
    mgr.innerHTML = `<button id="open-portal-mgr" style="background:#2c3e50; color:white; border:none; border-radius:4px; padding:8px 12px; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2);">Manage Portal Items</button>`;
    document.body.appendChild(mgr);

    const modal = document.createElement('div'); modal.id='portal-mgr-modal';
    modal.style.position='fixed'; modal.style.left=0; modal.style.top=0; modal.style.right=0; modal.style.bottom=0;
    modal.style.display='none'; modal.style.background='rgba(0,0,0,0.6)'; modal.style.padding='40px'; modal.style.zIndex=2001;
    modal.innerHTML = `
      <div style="background:#fff;padding:20px;max-width:720px;margin:0 auto;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.2);max-height:80vh;overflow-y:auto;">
        <h3 style="margin-top:0;">Portal Manager</h3>
        <form id="portal-item-form">
          <label style="display:block;margin-bottom:4px;font-weight:bold;">Item Text</label>
          <input id="portal-title" placeholder="e.g. My Tasks" style="width:100%;margin-bottom:1rem;padding:8px;border:1px solid #ccc;border-radius:4px;" required />
          <label style="display:block;margin-bottom:4px;font-weight:bold;">URL</label>
          <input id="portal-url" placeholder="e.g. todo.html or https://google.com" style="width:100%;margin-bottom:1rem;padding:8px;border:1px solid #ccc;border-radius:4px;" required />
          <label style="display:block;margin-bottom:4px;font-weight:bold;">Section ID</label>
          <input id="portal-section" placeholder="e.g. myWorkDropdown" style="width:100%;margin-bottom:1rem;padding:8px;border:1px solid #ccc;border-radius:4px;" />
          <div style="display:flex;gap:.5rem;"><button type="submit" style="background:#27ae60;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-weight:bold;">Add Item</button><button type="button" id="close-portal-mgr" style="background:#95a5a6;color:white;border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-weight:bold;">Close</button></div>
        </form>
        <h4 style="margin-top:2rem;border-top:1px solid #eee;padding-top:1rem;">Existing Custom Items</h4>
        <div id="portal-items-list"></div>
      </div>`;
    document.body.appendChild(modal);

    document.getElementById('open-portal-mgr').addEventListener('click', ()=>{ modal.style.display='block'; renderPortalItems(); });
    document.getElementById('close-portal-mgr').addEventListener('click', ()=>{ modal.style.display='none'; });

    const pform = document.getElementById('portal-item-form');
    pform.addEventListener('submit', function(e){
      e.preventDefault();
      const title = $('portal-title').value.trim();
      const url = $('portal-url').value.trim();
      const section = $('portal-section').value.trim();
      if(!title||!url){ alert('Provide title and URL'); return; }
      const items = loadJSON(PORTAL_KEY);
      items.push({ title, url, section });
      saveJSON(PORTAL_KEY, items);
      $('portal-title').value=''; $('portal-url').value=''; $('portal-section').value='';
      renderPortalItems();
      insertPortalItemToDom({ title, url, section });
    });

    function renderPortalItems(){
      const list = $('portal-items-list');
      const items = loadJSON(PORTAL_KEY);
      list.innerHTML='';
      items.forEach((it,i)=>{
        const el = document.createElement('div');
        el.style.display='flex'; el.style.justifyContent='space-between'; el.style.alignItems='center'; el.style.padding='.5rem 0'; el.style.borderBottom='1px solid #f9f9f9';
        el.innerHTML = `<div><strong>${escapeHtml(it.title)}</strong> — <small>${escapeHtml(it.url)}</small> ${it.section?`<br><em style="color:#666;font-size:0.8em;">(Section: ${escapeHtml(it.section)})</em>`:''}</div><div><button data-i="${i}" class="remove-portal" style="background:#e74c3c;color:white;border:none;border-radius:3px;padding:3px 8px;cursor:pointer;">Remove</button></div>`;
        list.appendChild(el);
      });
      list.querySelectorAll('.remove-portal').forEach(btn=>btn.addEventListener('click', function(){
        const i = parseInt(this.dataset.i,10);
        const currentItems = loadJSON(PORTAL_KEY);
        currentItems.splice(i,1);
        saveJSON(PORTAL_KEY, currentItems);
        renderPortalItems();
        alert('Item removed. Refresh to see changes in dropdowns.');
      }));
    }

    loadJSON(PORTAL_KEY).forEach(insertPortalItemToDom);
  }

  // Quick Links Logic
  async function updatePortalLinks() {
    try {
        const response = await fetch('links.json');
        if (!response.ok) throw new Error('links.json not found');
        const data = await response.json();
        const container = $('dynamic-links');
        if (!container) return;

        let listHtml = '';

        // 1. Build the Standard list (Everyone gets these)
        data.standardLinks.forEach(link => {
            listHtml += `<li><a href="${link.url}"><span class="icon">${link.icon}</span> ${link.name}</a></li>`;
        });

        // 2. Add Elevated links ONLY for Admin, HR, and HoD
        if (isAuthorized) {
            // Add a small divider to keep it organized
            listHtml += `<li style="font-size: 11px; color: #f39c12; margin-top: 15px; border-bottom: 1px solid #eee; font-weight: bold;">ADMIN & LEADERSHIP</li>`;

            data.adminLinks.forEach(link => {
                listHtml += `<li class="admin-link"><a href="${link.url}" target="_blank"><span class="icon">${link.icon}</span> ${link.name}</a></li>`;
            });
        }

        container.innerHTML = listHtml;
    } catch (error) {
        console.error("Quick Links error:", error);
    }
  }

  // Initial render
  renderNews();
  updatePortalLinks();
})();
