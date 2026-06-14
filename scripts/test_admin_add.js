(async ()=>{
  const base = 'http://localhost:3000';
  try{
    // login
    let r = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'lekaoo12' }) });
    console.log('login status', r.status);
    const sc = r.headers.get('set-cookie') || '';
    console.log('set-cookie header:', sc);
    const cookie = sc ? sc.split(';')[0] : '';

    // add tree
    const tree = { species: 'TestTree', lat: -2.65, lng: 37.25 };
    r = await fetch(base + '/api/trees', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookie }, body: JSON.stringify(tree) });
    console.log('add status', r.status);
    try{ console.log('add body', await r.json()); } catch(e){ console.log('add body text', await r.text()); }

    // list trees
    r = await fetch(base + '/api/trees');
    console.log('list status', r.status);
    const list = await r.json();
    console.log('trees count', list.length);
    console.log('last tree', list[list.length-1]);
  }catch(e){ console.error('error', e); process.exit(1); }
})();
