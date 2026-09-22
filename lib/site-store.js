'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = function createSiteStore({ editorFile, liveFile, clean, historyDir = path.join(path.dirname(liveFile), 'history') }) {
  const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
  const version = (site) => crypto.createHash('sha256').update(JSON.stringify(site)).digest('hex');
  function write(file, value) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temporary = `${file}.${crypto.randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
      fs.renameSync(temporary, file);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  function snapshot() {
    const site = read(editorFile);
    return { site, version: version(site), unpublished: version(site) !== version(read(liveFile)) };
  }
  function expectVersion(expected, site) {
    if (expected !== version(site)) {
      const error = new Error('Työversio muuttui toisessa ikkunassa. Kopioi tarvittavat muutokset talteen ja lataa hallinta uudelleen.');
      error.status = 409;
      throw error;
    }
  }
  function archive(site, kind) {
    const entry = {id:crypto.randomUUID(),createdAt:new Date().toISOString(),kind,version:version(site),site};
    write(path.join(historyDir,entry.id+'.json'),entry);
    return entry;
  }
  function historyEntry(id) {
    if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(String(id))) {
      const error=new Error('Virheellinen historiatunniste.');error.status=400;throw error;
    }
    const file=path.join(historyDir,id+'.json');
    if(!fs.existsSync(file)){const error=new Error('Versiota ei löytynyt.');error.status=404;throw error;}
    const entry=read(file);
    if(entry.id!==id||version(entry.site)!==entry.version)throw new Error('Historiaversion eheystarkistus epäonnistui.');
    return entry;
  }
  function history() {
    if(!fs.existsSync(historyDir))return [];
    return fs.readdirSync(historyDir).filter(name=>name.endsWith('.json')).map(name=>{
      const {site,...entry}=historyEntry(name.slice(0,-5));
      return {...entry,title:site.meta?.title||site.meta?.siteName||'Sivusto',pages:(site.pages||[]).map(page=>({title:page.title,slug:page.slug}))};
    }).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||b.id.localeCompare(a.id));
  }
  return {
    snapshot,
    history,
    historyEntry,
    live: () => read(liveFile),
    draft: () => read(editorFile),
    importDraft(input,expected){
      const current=read(editorFile);expectVersion(expected,current);
      const site=clean(input),result={site,version:version(site),unpublished:version(site)!==version(read(liveFile))};
      archive(current,'before-import');write(editorFile,site);return result;
    },
    save(input, expected) {
      expectVersion(expected, read(editorFile));
      const site = clean(input);
      write(editorFile, site);
      return snapshot();
    },
    publish(expected) {
      const site = read(editorFile);
      expectVersion(expected, site);
      clean(site); // Validate before publishing the exact saved draft.
      const previous=read(liveFile);
      // Persist the previous live state before changing it, even on the first publication.
      archive(previous,'previous-live');
      write(liveFile, site);
      // The previous state above remains recoverable even if this optional label write fails.
      try { archive(site,'published'); } catch { console.warn('Julkaisu onnistui, mutta uuden version historiakopio epäonnistui. Edellinen live-versio on tallessa historiassa.'); }
      return { ...snapshot(), publishedAt: new Date().toISOString() };
    },
    restore(id,expected) {
      const current=read(editorFile);
      expectVersion(expected,current);
      const restored=clean(historyEntry(id).site);
      // Restoring only affects the draft, and the displaced draft is itself recoverable.
      archive(current,'before-restore');
      write(editorFile,restored);
      return snapshot();
    }
  };
};
