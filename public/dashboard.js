const STATS_API = '/api/stats';
const TREES_API = '/api/trees';

// map
const map = L.map('map').setView([-2.648, 37.253], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
const markers = L.layerGroup().addTo(map);

function loadMapMarkers(){
  fetch(TREES_API).then(r=>r.json()).then(list=>{
    markers.clearLayers();
    list.forEach(t=>L.marker([t.lat,t.lng]).addTo(markers).bindPopup(`${t.species||'Unknown'}<br>${t.planted_by||''}`))
  });
}

function loadStats(){
  fetch(STATS_API).then(r=>r.json()).then(s=>{
    document.getElementById('total').textContent = s.total;
    const species = Object.keys(s.bySpecies||{});
    const counts = species.map(k=>s.bySpecies[k]);
    renderChart(species, counts);
  });
}

let chart=null;
function renderChart(labels, data){
  const ctx = document.getElementById('speciesChart').getContext('2d');
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets:[{label:'Trees by species',data,backgroundColor:'rgba(75,192,192,0.5)'}] },
    options: { responsive:true }
  });
}

loadMapMarkers();
loadStats();
setInterval(loadStats, 30_000);
setInterval(loadMapMarkers, 30_000);
