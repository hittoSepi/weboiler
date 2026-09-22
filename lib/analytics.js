'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DAY = 24 * 60 * 60 * 1000;
const RETENTION = 90 * DAY;

function createAnalytics({ filePath }) {
  function readData() {
    if (!fs.existsSync(filePath)) return { sessions: {} };
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { sessions: data.sessions && typeof data.sessions === 'object' ? data.sessions : {} };
    } catch (_error) {
      return { sessions: {} };
    }
  }

  function writeData(data) {
    const tempFile = `${filePath}.${process.pid}.tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tempFile, `${JSON.stringify(data)}\n`, 'utf8');
    fs.renameSync(tempFile, filePath);
  }

  function hash(value) {
    return crypto.createHash('sha256').update(String(value)).digest('base64url');
  }

  function prune(data, now) {
    for (const [key, session] of Object.entries(data.sessions)) {
      if (!session.lastSeen || now - Date.parse(session.lastSeen) > RETENTION) delete data.sessions[key];
    }
  }

  function record(input) {
    const visitorId = String(input.visitorId || '').slice(0, 100);
    const sessionId = String(input.sessionId || '').slice(0, 100);
    if (!/^[a-zA-Z0-9_-]{12,100}$/.test(visitorId) || !/^[a-zA-Z0-9_-]{12,100}$/.test(sessionId)) return false;

    const now = Date.now();
    const data = readData();
    prune(data, now);
    const sessionKey = hash(sessionId);
    const existing = data.sessions[sessionKey];
    const session = existing || {
      visitor: hash(visitorId),
      startedAt: new Date(now).toISOString(),
      lastSeen: new Date(now).toISOString(),
      durationMs: 0,
      pageViews: 0
    };
    session.lastSeen = new Date(now).toISOString();
    session.durationMs = Math.max(session.durationMs || 0, Math.min(Number(input.durationMs) || 0, DAY));
    if (input.event === 'view') session.pageViews = (session.pageViews || 0) + 1;
    data.sessions[sessionKey] = session;
    writeData(data);
    return true;
  }

  function summary(messages = []) {
    const now = Date.now();
    const data = readData();
    prune(data, now);
    const sessions = Object.values(data.sessions);
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const period = (since) => {
      const selected = sessions.filter((session) => Date.parse(session.startedAt) >= since);
      const visitors = new Set(selected.map((session) => session.visitor)).size;
      const durationSessions = selected.filter((session) => (session.durationMs || 0) > 0);
      return {
        visitors,
        visits: selected.length,
        pageViews: selected.reduce((sum, session) => sum + (session.pageViews || 0), 0),
        averageDurationMs: durationSessions.length
          ? Math.round(durationSessions.reduce((sum, session) => sum + session.durationMs, 0) / durationSessions.length)
          : 0
      };
    };

    const messagesSince = (since) => messages.filter((message) => Date.parse(message.createdAt) >= since).length;
    return {
      today: { ...period(startToday.getTime()), messages: messagesSince(startToday.getTime()) },
      last7Days: { ...period(now - 7 * DAY), messages: messagesSince(now - 7 * DAY) },
      last30Days: { ...period(now - 30 * DAY), messages: messagesSince(now - 30 * DAY) },
      retentionDays: 90
    };
  }

  return { record, summary };
}

module.exports = createAnalytics;
