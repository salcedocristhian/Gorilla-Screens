// Regression: no silent IndexedDB -> volatile-memory fallback.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../js/storage.js', import.meta.url), 'utf8');
const elements = [];
const document = {
  getElementById: id => elements.find(e => e.id === id) || null,
  createElement: () => ({ setAttribute() {}, style: {} }),
  body: { appendChild: el => elements.push(el) }
};
const window = {};
vm.runInNewContext(source, { window, document, Map, Promise, Date });
await window.GSSStore.saveProject({ id: 'a' });
assert.equal(window.GSSStore.usingMemory(), true);
assert.equal(elements.length, 1);
assert.match(elements[0].textContent, /pueden perderse/);
await window.GSSStore.saveProject({ id: 'b' });
assert.equal(elements.length, 1, 'warning must not duplicate');
assert.equal((await window.GSSStore.listProjects()).length, 2);
console.log('PASS: volatile storage warning appears once');
