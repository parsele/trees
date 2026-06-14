const API = '/api/trees';

const map = L.map('map').setView([-2.648, 37.253], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
const markers = L.layerGroup().addTo(map);

// Adjust zoom control for mobile
if(map.zoomControl){
  if(window.innerWidth < 700) map.zoomControl.setPosition('topright');
  else map.zoomControl.setPosition('topleft');
}

function loadAll(){
  fetch(API).then(r=>r.json()).then(list=>{
    markers.clearLayers();
    const container = document.getElementById('treeList');
    container.innerHTML = '';
    list.forEach(t=>{
      markers.addLayer(L.marker([t.lat,t.lng]).bindPopup(`${t.species||'Unknown'}`));
      const row = document.createElement('div');
      row.style.borderBottom='1px solid #eee';
      row.style.padding='6px 0';
      row.innerHTML = `<strong>${escapeHtml(t.species||'Unknown')}</strong> ${t.date||''}<br>${escapeHtml(t.planted_by||'')}<br>
        <button data-id="${t.id}" data-spec="${escapeHtml(t.species||'Unknown')}" class="deleteBtn">Delete</button>`;
      container.appendChild(row);
    });
    Array.from(document.getElementsByClassName('deleteBtn')).forEach(b=>b.addEventListener('click', onDelete));
  });
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }

async function onDelete(e){
  const id = e.currentTarget.dataset.id;
  const spec = e.currentTarget.dataset.spec || '';
  const confirmation = prompt(`Type DELETE to confirm deletion of "${spec}" (id ${id})`);
  if(confirmation !== 'DELETE'){
    alert('Deletion cancelled');
    return;
  }
  const res = await fetch(API+'/'+id, { method:'DELETE' });
  if(!res.ok){
    const j = await res.json().catch(()=>({ error: res.status }));
    return alert('Delete failed: '+(j.error || res.status));
  }
  loadAll();
}

loadAll();
setInterval(loadAll, 20000);

// --- Add form handling ---
const form = document.getElementById('adminForm');
if(form){
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const fd = new FormData(form);
    const tree = {
      species: fd.get('species') || '',
      lat: parseFloat(fd.get('lat')),
      lng: parseFloat(fd.get('lng')),
      date: fd.get('date') || '',
      planted_by: fd.get('planted_by') || '',
      notes: fd.get('notes') || ''
    };
    if(isNaN(tree.lat) || isNaN(tree.lng)) return alert('Invalid latitude or longitude');
    const res = await fetch(API, {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(tree)});
    if(!res.ok){ const j = await res.json().catch(()=>({error:'Failed'})); return alert('Add failed: '+(j.error||res.status)); }
    form.reset();
    loadAll();
    alert('Tree added');
  });
}

// CSV upload (admin only)
const csvBtn = document.getElementById('importCsv');
if(csvBtn){
  csvBtn.addEventListener('click', ()=>{
    const f = document.getElementById('csvFile').files[0];
    if(!f) return alert('Select a CSV file first');
    Papa.parse(f, {header:true,skipEmptyLines:true,complete:results=>{
      importBatch(results.data);
    }});
  });
}

const fetchBtn = document.getElementById('fetchUrl');
if(fetchBtn){
  fetchBtn.addEventListener('click', ()=>{
    const url = document.getElementById('importUrl').value.trim();
    if(!url) return alert('Enter a dataset URL');
    fetch(url).then(r=>r.text()).then(text=>{
      Papa.parse(text, {header:true,skipEmptyLines:true,complete:results=>{
        if(results.data && results.data.length) return importBatch(results.data);
        try{ const json = JSON.parse(text); if(Array.isArray(json)) return importBatch(json); }
        catch(e){}
        alert('No usable data found at URL');
      }});
    }).catch(err=>alert('Fetch failed: '+err));
  });
}

function importBatch(items){
  const toSend = items.map(i=>({
    species: i.species||i.Species||'',
    lat: parseFloat(i.lat||i.Lat||i.latitude||i.Latitude),
    lng: parseFloat(i.lng||i.Lng||i.lon||i.Longitude||i.longitude),
    date: i.date||i.Date||'',
    planted_by: i.planted_by||i.Planted_by||i.plantedBy||'',
    notes: i.notes||i.Notes||''
  })).filter(t=>!isNaN(t.lat) && !isNaN(t.lng));

  if(!toSend.length) return alert('No valid rows with lat/lng found');

  (async ()=>{
    for(const t of toSend){
      await fetch(API, {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}).catch(e=>console.error('import error',e));
    }
    loadAll();
    alert('Import complete: '+toSend.length+' trees');
  })();
}

// Map click to set lat/lng in form
map.on('click', function(e){
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);
  const latInput = document.querySelector('input[name="lat"]');
  const lngInput = document.querySelector('input[name="lng"]');
  if(latInput && lngInput){
    latInput.value = lat;
    lngInput.value = lng;
    latInput.focus();
  }
});
