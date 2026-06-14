const API = '/api/trees';

const map = L.map('map').setView([-2.648, 37.253], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Adjust zoom control position for mobile
if(map.zoomControl){
  if(window.innerWidth < 700) map.zoomControl.setPosition('topright');
  else map.zoomControl.setPosition('topleft');
}

const markers = L.layerGroup().addTo(map);

function loadTrees(){
  fetch(API).then(r=>r.json()).then(list=>{
    markers.clearLayers();
    list.forEach(t=>{
      const m = L.marker([t.lat, t.lng]).addTo(markers);
      const html = `<b>${escapeHtml(t.species||'Unknown')}</b><br>${t.date||''}<br>${escapeHtml(t.planted_by||'')}<br>${escapeHtml(t.notes||'')}`;
      m.bindPopup(html);
    });
  });
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

loadTrees();

// Fetch and display stats (total planted)
function loadStats(){
  fetch('/api/stats').then(r=>r.json()).then(s=>{
    const el = document.getElementById('totalCount');
    if(el) el.textContent = (typeof s.total === 'number' ? s.total : 0);
  }).catch(()=>{});
}

loadStats();
setInterval(loadTrees, 30000);
setInterval(loadStats, 30000);
