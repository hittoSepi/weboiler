'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

function createAuthStore({ filePath, fallbackUsername, fallbackPassword }) {
  function read() {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  function write(value) {
    const tempFile = `${filePath}.${process.pid}.tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tempFile, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(tempFile, filePath);
  }

  function hashPassword(password, salt) {
    return crypto.scryptSync(String(password), salt, 64).toString('base64url');
  }

  function safeEqual(left, right) {
    const a = Buffer.from(String(left));
    const b = Buffer.from(String(right));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  function authenticate(username, password) {
    const stored = read();
    if (!stored) return safeEqual(username, fallbackUsername) && safeEqual(password, fallbackPassword);
    return safeEqual(username, stored.username) && safeEqual(hashPassword(password, stored.passwordSalt), stored.passwordHash);
  }

  function publicSettings() {
    const stored = read();
    return { username: stored?.username || fallbackUsername, hasCustomCredentials: Boolean(stored) };
  }

  function update({ currentPassword, username, newPassword }) {
    const current = read();
    const currentUsername = current?.username || fallbackUsername;
    if (!authenticate(currentUsername, currentPassword)) throw new Error('Nykyinen salasana on väärä.');
    const nextUsername = String(username || '').trim().slice(0, 100);
    const password = String(newPassword || '');
    if (nextUsername.length < 3) throw new Error('Käyttäjätunnuksessa pitää olla vähintään 3 merkkiä.');
    if (password && password.length < 12) throw new Error('Uudessa salasanassa pitää olla vähintään 12 merkkiä.');

    let passwordSalt = current?.passwordSalt;
    let passwordHash = current?.passwordHash;
    if (!current || password) {
      const value = password || fallbackPassword;
      if (!value) throw new Error('Syötä uusi salasana.');
      passwordSalt = crypto.randomBytes(24).toString('base64url');
      passwordHash = hashPassword(value, passwordSalt);
    }
    write({ username: nextUsername, passwordSalt, passwordHash, updatedAt: new Date().toISOString() });
    return publicSettings();
  }

  return { authenticate, publicSettings, update };
}

module.exports = createAuthStore;
