'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = function createSiteStore({ editorFile, liveFile, clean }) {
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
  return {
    snapshot,
    live: () => read(liveFile),
    draft: () => read(editorFile),
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
      write(liveFile, site);
      return { ...snapshot(), publishedAt: new Date().toISOString() };
    }
  };
};
