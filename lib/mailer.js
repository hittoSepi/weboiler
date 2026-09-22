'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const PROVIDERS = new Set(['disabled', 'smtp', 'resend']);

function createMailer({ filePath, encryptionSecret }) {
  const encryptionKey = crypto.createHash('sha256').update(encryptionSecret).digest();

  function defaults() {
    return {
      provider: 'disabled',
      recipient: '',
      fromName: 'Weboiler verkkosivu',
      fromEmail: '',
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPassword: '',
      resendApiKey: ''
    };
  }

  function readRaw() {
    if (!fs.existsSync(filePath)) return defaults();
    return { ...defaults(), ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  }

  function writeRaw(settings) {
    const tempFile = `${filePath}.${process.pid}.tmp`;
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tempFile, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
    fs.renameSync(tempFile, filePath);
  }

  function encrypt(value) {
    if (!value) return '';
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    return `v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${encrypted.toString('base64url')}`;
  }

  function decrypt(value) {
    if (!value) return '';
    const [version, iv, tag, encrypted] = String(value).split(':');
    if (version !== 'v1' || !iv || !tag || !encrypted) throw new Error('Sähköpostisalaisuuden purkaminen epäonnistui.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
  }

  function text(value, max) {
    return String(value || '').trim().slice(0, max);
  }

  function publicSettings() {
    const settings = readRaw();
    return {
      provider: settings.provider,
      recipient: settings.recipient,
      fromName: settings.fromName,
      fromEmail: settings.fromEmail,
      smtpHost: settings.smtpHost,
      smtpPort: settings.smtpPort,
      smtpSecure: Boolean(settings.smtpSecure),
      smtpUser: settings.smtpUser,
      hasSmtpPassword: Boolean(settings.smtpPassword),
      hasResendApiKey: Boolean(settings.resendApiKey)
    };
  }

  function saveSettings(input) {
    const existing = readRaw();
    const provider = text(input.provider, 20);
    if (!PROVIDERS.has(provider)) throw new Error('Tuntematon sähköpostipalvelu.');

    const next = {
      provider,
      recipient: text(input.recipient, 200),
      fromName: text(input.fromName, 120) || 'JH-ProSell verkkosivu',
      fromEmail: text(input.fromEmail, 200),
      smtpHost: text(input.smtpHost, 240),
      smtpPort: Math.min(65535, Math.max(1, Number(input.smtpPort) || 587)),
      smtpSecure: Boolean(input.smtpSecure),
      smtpUser: text(input.smtpUser, 240),
      smtpPassword: text(input.smtpPassword, 1000) ? encrypt(text(input.smtpPassword, 1000)) : existing.smtpPassword,
      resendApiKey: text(input.resendApiKey, 1000) ? encrypt(text(input.resendApiKey, 1000)) : existing.resendApiKey
    };

    if (provider !== 'disabled' && (!next.recipient || !next.fromEmail)) {
      throw new Error('Vastaanottajan ja lähettäjän sähköpostiosoitteet ovat pakollisia.');
    }
    if (provider === 'smtp' && (!next.smtpHost || !next.smtpUser || !next.smtpPassword)) {
      throw new Error('Täytä SMTP-palvelin, käyttäjätunnus ja salasana.');
    }
    if (provider === 'resend' && !next.resendApiKey) throw new Error('Syötä Resend API-avain.');

    writeRaw(next);
    return publicSettings();
  }

  function messageText(message, isTest = false) {
    if (isTest) return 'Tämä on JH-ProSellin hallinnasta lähetetty sähköpostiasetusten testiviesti.';
    return [
      'Uusi yhteydenotto verkkosivulta',
      '',
      `Nimi: ${message.name}`,
      `Sähköposti: ${message.email || '-'}`,
      `Puhelin: ${message.phone || '-'}`,
      '',
      'Viesti:',
      message.message,
      '',
      `Lähetetty: ${new Date(message.createdAt).toLocaleString('fi-FI')}`
    ].join('\n');
  }

  async function send(message, isTest = false) {
    const settings = readRaw();
    if (settings.provider === 'disabled') return { skipped: true };
    const subject = isTest ? 'JH-ProSell - testiviesti' : `Uusi yhteydenotto: ${message.name}`;
    const replyTo = !isTest && message.email ? message.email : undefined;
    const body = messageText(message, isTest);

    if (settings.provider === 'smtp') {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: Number(settings.smtpPort),
        secure: Boolean(settings.smtpSecure),
        auth: { user: settings.smtpUser, pass: decrypt(settings.smtpPassword) },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000
      });
      await transporter.sendMail({
        from: { name: settings.fromName, address: settings.fromEmail },
        to: settings.recipient,
        replyTo,
        subject,
        text: body
      });
      return { sent: true };
    }

    if (settings.provider === 'resend') {
      const resend = new Resend(decrypt(settings.resendApiKey));
      const result = await resend.emails.send({
        from: `${settings.fromName} <${settings.fromEmail}>`,
        to: [settings.recipient],
        replyTo,
        subject,
        text: body
      });
      if (result.error) throw new Error(result.error.message || 'Resend-lähetys epäonnistui.');
      return { sent: true };
    }

    throw new Error('Sähköpostipalvelua ei ole määritetty.');
  }

  return {
    publicSettings,
    saveSettings,
    sendContact: (message) => send(message, false),
    sendTest: () => send({}, true)
  };
}

module.exports = createMailer;
