/* Almacenamiento local en el dispositivo (IndexedDB): proyectos + fotos. */
(function () {
  const DB = 'gss-screens', VER = 1;
  let dbp = null, memory = null;
  function warnVolatileStorage() {
    if (document.getElementById('gss-storage-warning')) return;
    const banner = document.createElement('div');
    banner.id = 'gss-storage-warning';
    banner.setAttribute('role', 'alert');
    banner.style.cssText = 'position:fixed;z-index:99999;top:0;left:0;right:0;padding:12px 16px;background:#7f1d1d;color:white;font:600 14px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 2px 8px #0004';
    banner.textContent = '⚠ Almacenamiento permanente no disponible. Los cambios pueden perderse al cerrar esta página. No uses esta sesión para datos reales.';
    (document.body || document.documentElement).appendChild(banner);
  }
  function memoryFallback(res) {
    memory = { projects: new Map(), photos: new Map() };
    warnVolatileStorage();
    res(null);
  }
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res) => {
      if (!('indexedDB' in window)) { return memoryFallback(res); }
      let r;try{r=indexedDB.open(DB, VER);}catch(e){return memoryFallback(res);}
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' }); if (!d.objectStoreNames.contains('photos')) { const s = d.createObjectStore('photos', { keyPath: 'id' }); s.createIndex('project', 'projectId'); } };
      r.onsuccess = () => res(r.result);
      r.onerror = () => { memoryFallback(res); };
    });
    return dbp;
  }
  function tx(store, mode, fn) {
    return open().then(d => new Promise((res, rej) => {
      if (!d) { try { res(fn(null, memory[store])); } catch (e) { rej(e); } return; }
      const t = d.transaction(store, mode), s = t.objectStore(store); let out; const r = fn(s);
      if (r && 'onsuccess' in r) r.onsuccess = () => { out = r.result; };
      t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    }));
  }
  const S = {
    usingMemory: () => !!memory,
    listProjects: () => tx('projects', 'readonly', (s, m) => m ? [...m.values()] : s.getAll()).then(a => (a || []).sort((x, y) => y.updatedAt - x.updatedAt)),
    getProject: id => tx('projects', 'readonly', (s, m) => m ? m.get(id) : s.get(id)),
    saveProject: p => { p.updatedAt = Date.now(); return tx('projects', 'readwrite', (s, m) => m ? m.set(p.id, p) : s.put(p)); },
    deleteProject: async id => { const ph = await S.listPhotos(id); for (const x of ph) await S.deletePhoto(x.id); return tx('projects', 'readwrite', (s, m) => m ? m.delete(id) : s.delete(id)); },
    listPhotos: pid => tx('photos', 'readonly', (s, m) => m ? [...m.values()].filter(x => x.projectId === pid) : s.index('project').getAll(pid)).then(a => (a || []).sort((x, y) => x.createdAt - y.createdAt)),
    savePhoto: ph => tx('photos', 'readwrite', (s, m) => m ? m.set(ph.id, ph) : s.put(ph)),
    deletePhoto: id => tx('photos', 'readwrite', (s, m) => m ? m.delete(id) : s.delete(id))
  };
  window.GSSStore = S;
})();
