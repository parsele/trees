// UI helpers: theme toggle, compact header, logo fallback
(function(){
  const themeToggleId = 'themeToggle';
  const compactToggleId = 'compactToggle';

  function applyTheme(t){
    if(t==='dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', t);
    const btn = document.getElementById(themeToggleId);
    if(btn) btn.textContent = t==='dark' ? '☀️' : '🌙';
  }

  function toggleTheme(){
    const cur = localStorage.getItem('theme') || 'light';
    applyTheme(cur==='dark' ? 'light' : 'dark');
  }

  function applyCompact(v){
    const topbar = document.getElementById('topbar');
    if(!topbar) return;
    if(v){ topbar.classList.add('compact'); } else { topbar.classList.remove('compact'); }
    localStorage.setItem('compact', v? '1' : '0');
    const btn = document.getElementById(compactToggleId);
    if(btn) btn.textContent = v ? '🔽' : '☰';
  }

  function toggleCompact(){
    const cur = localStorage.getItem('compact') === '1';
    applyCompact(!cur);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // theme
    const stored = localStorage.getItem('theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
    applyTheme(stored);
    const th = document.getElementById(themeToggleId);
    if(th) th.addEventListener('click', toggleTheme);

    // compact
    const storedCompact = localStorage.getItem('compact') === '1';
    applyCompact(storedCompact || window.innerWidth < 600);
    const ct = document.getElementById(compactToggleId);
    if(ct) ct.addEventListener('click', toggleCompact);

    // logo fallback: hide image if not loaded
    const logo = document.getElementById('siteLogo');
    if(logo){
      logo.addEventListener('error', ()=>{ logo.style.display='none'; });
    }

    // panel toggle FAB on mobile
    const fab = document.getElementById('panelFab');
    if(fab){
      fab.addEventListener('click', ()=>{ document.body.classList.toggle('panel-open'); });
    }
    // close panel when clicking outside on mobile
    document.addEventListener('click', (e)=>{
      if(!document.body.classList.contains('panel-open')) return;
      const panel = document.getElementById('panel');
      const fab = document.getElementById('panelFab');
      if(panel && !panel.contains(e.target) && fab && !fab.contains(e.target)){
        document.body.classList.remove('panel-open');
      }
    });

    // Register service worker for PWA
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/service-worker.js').then(reg=>{
        console.log('SW registered', reg.scope);
      }).catch(err=>{
        console.warn('SW registration failed', err);
      });
    }
  });
})();
