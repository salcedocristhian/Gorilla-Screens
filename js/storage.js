/* Almacenamiento local en el dispositivo (IndexedDB): proyectos + fotos. */
(function () {
  const DB = 'gss-screens', VER = 1;
  let dbp = null, memory = null;
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res) => {
      if (!('indexedDB' in window)) { memory = { projects: new Map(), photos: new Map() }; return res(null); }
      const r = indexedDB.open(DB, VER);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('projects')) d.createObjectStore('projects', { keyPath: 'id' }); if (!d.objectStoreNames.contains('photos')) { const s = d.createObjectStore('photos', { keyPath: 'id' }); s.createIndex('project', 'projectId'); } };
      r.onsuccess = () => res(r.result);
      r.onerror = () => { memory = { projects: new Map(), photos: new Map() }; res(null); };
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
