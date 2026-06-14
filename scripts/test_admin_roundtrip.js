(async ()=>{
  const base = 'http://localhost:3000';
  try{
    // login
    let r = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'lekaoo12' }) });
    console.log('login status', r.status);
    const sc = r.headers.get('set-cookie') || '';
    const cookie = sc ? sc.split(';')[0] : '';

    // add tree
    const tree = { species: 'TempTest', lat: -2.660, lng: 37.260 };
    r = await fetch(base + '/api/trees', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Cookie': cookie }, body: JSON.stringify(tree) });
    console.log('add status', r.status);
    const addBody = await r.json().catch(()=>null);
    console.log('add body', addBody);
    const id = addBody && addBody.tree && addBody.tree.id;
    if(!id) throw new Error('Add failed, no id');

    // fetch list and confirm
    r = await fetch(base + '/api/trees');
    const list = await r.json();
    console.log('trees count after add', list.length);

    // delete the added tree
    r = await fetch(base + '/api/trees/' + id, { method: 'DELETE', headers: { 'Cookie': cookie } });
    console.log('delete status', r.status);
    const delBody = await r.json().catch(()=>null);
    console.log('delete body', delBody);

    // final list
    r = await fetch(base + '/api/trees');
    const list2 = await r.json();
    console.log('trees count after delete', list2.length);
    console.log('roundtrip successful');
  }catch(e){ console.error('error', e); process.exit(1); }
})();
