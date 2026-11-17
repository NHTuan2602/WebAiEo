// Zero-dependency Transactional Email Transport for OTP & Verification Emails
// Supports Resend HTTPS API, Brevo HTTPS API, and pure Node SMTP (TLS 465 / STARTTLS 587).
import net from 'node:net';
import tls from 'node:tls';

export function maskEmailAddress(email) {
  const clean = String(email || '').trim().toLowerCase();
  const atIdx = clean.indexOf('@');
  if (atIdx <= 0) return '';
  const local = clean.slice(0, atIdx);
  const domain = clean.slice(atIdx + 1);
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}

export function isValidEmailAddress(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean || clean.length > 160) return false;
  return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean);
}

export function isValidAppsScriptUrl(rawUrl) {
  try {
    const u = new URL(String(rawUrl || '').trim());
    return (
      u.protocol === 'https:' &&
      u.hostname === 'script.google.com' &&
      u.pathname.startsWith('/macros/')
    );
  } catch {
    return false;
  }
}

export function getEffectiveMailConfig(store) {
  const stored = store?.mailConfig && typeof store.mailConfig === 'object' ? store.mailConfig : {};
  const resendApiKey = String(stored.resendApiKey || process.env.RESEND_API_KEY || '').trim();
  const brevoApiKey = String(stored.brevoApiKey || process.env.BREVO_API_KEY || '').trim();
  const rawAppsScriptUrl = String(stored.appsScriptUrl || process.env.APPS_SCRIPT_MAIL_URL || '').trim();
  const appsScriptUrl = isValidAppsScriptUrl(rawAppsScriptUrl) ? rawAppsScriptUrl : '';
  const smtpHost = String(stored.smtpHost || process.env.SMTP_HOST || '').trim();
  const smtpPort = Number(stored.smtpPort || process.env.SMTP_PORT || 465) || 465;
  const smtpSecure =
    smtpPort === 465
      ? true
      : smtpPort === 587
      ? false
      : stored.smtpSecure !== undefined
      ? Boolean(stored.smtpSecure)
      : process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE !== 'false'
      : false;
  const smtpUser = String(stored.smtpUser || process.env.SMTP_USER || '').trim();
  const rawSmtpPass = String(stored.smtpPass || process.env.SMTP_PASS || '').trim();
  const smtpPass = /gmail\.com|googlemail\.com/i.test(smtpHost)
    ? rawSmtpPass.replace(/\s+/g, '')
    : rawSmtpPass;
  const fromEmail = String(
    stored.fromEmail ||
      process.env.MAIL_FROM ||
      smtpUser ||
      (resendApiKey ? 'onboarding@resend.dev' : '')
  ).trim();
  const fromName = String(stored.fromName || process.env.MAIL_FROM_NAME || 'IELTS Nha Trang — Ms. Như').trim();

  const explicitProvider = ['resend', 'brevo', 'smtp', 'apps_script'].includes(stored.provider) ? stored.provider : '';
  let provider = 'none';
  if (explicitProvider === 'apps_script' && appsScriptUrl) provider = 'apps_script';
  else if (explicitProvider === 'resend' && resendApiKey) provider = 'resend';
  else if (explicitProvider === 'brevo' && brevoApiKey) provider = 'brevo';
  else if (explicitProvider === 'smtp' && smtpHost && smtpUser && smtpPass) provider = 'smtp';
  else if (appsScriptUrl) provider = 'apps_script';
  else if (resendApiKey) provider = 'resend';
  else if (brevoApiKey) provider = 'brevo';
  else if (smtpHost && smtpUser && smtpPass) provider = 'smtp';

  return {
    configured: provider !== 'none',
    provider,
    resendApiKey,
    brevoApiKey,
    appsScriptUrl,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPass,
    fromEmail,
    fromName
  };
}

export function getPublicMailConfigSummary(store) {
  const cfg = getEffectiveMailConfig(store);
  return {
    configured: cfg.configured,
    provider: cfg.provider,
    fromEmail: cfg.fromEmail,
    fromName: cfg.fromName,
    smtpHost: cfg.smtpHost,
    smtpPort: cfg.smtpPort,
    smtpSecure: cfg.smtpSecure,
    smtpUser: cfg.smtpUser,
    hasResendKey: Boolean(cfg.resendApiKey),
    hasBrevoKey: Boolean(cfg.brevoApiKey),
    hasAppsScriptUrl: Boolean(cfg.appsScriptUrl),
    hasSmtpPass: Boolean(cfg.smtpPass)
  };
}

function encodeMimeHeaderUtf8(str) {
  return `=?UTF-8?B?${Buffer.from(String(str || ''), 'utf8').toString('base64')}?=`;
}

async function sendViaResendApi(cfg, { to, subject, html, text }) {
  const from = cfg.fromEmail.includes('<') ? cfg.fromEmail : `${cfg.fromName} <${cfg.fromEmail || 'onboarding@resend.dev'}>`;
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to: [to], subject, html, text })
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.message || data?.error?.message || `Resend HTTP ${resp.status}`);
  }
  return { ok: true, provider: 'resend', messageId: data?.id || '' };
}

async function sendViaBrevoApi(cfg, { to, subject, html, text }) {
  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': cfg.brevoApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: cfg.fromName, email: cfg.fromEmail || cfg.smtpUser },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text
    })
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.message || `Brevo HTTP ${resp.status}`);
  }
  return { ok: true, provider: 'brevo', messageId: data?.messageId || '' };
}

async function sendViaAppsScript(cfg, { to, subject, html, text }) {
  if (!isValidAppsScriptUrl(cfg.appsScriptUrl)) {
    throw new Error('URL Google Apps Script phải bắt đầu bằng https://script.google.com/macros/...');
  }
  const resp = await fetch(cfg.appsScriptUrl, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to,
      subject,
      html,
      text,
      fromName: cfg.fromName,
      replyTo: cfg.fromEmail || ''
    })
  });
  const rawText = await resp.text();
  if (!resp.ok) {
    throw new Error(`Apps Script HTTP ${resp.status}`);
  }
  if (/^\s*<!doctype|^\s*<html/i.test(rawText)) {
    throw new Error('Apps Script trả về trang HTML đăng nhập — hãy kiểm tra quyền Deploy chọn "Who has access: Anyone (Bất kỳ ai)".');
  }
  let parsed = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    parsed = null;
  }
  if (parsed && parsed.ok === false) {
    throw new Error(parsed.error || 'Apps Script báo lỗi gửi email.');
  }
  return { ok: true, provider: 'apps_script' };
}

export function formatTransportErrorDetails(err) {
  if (!err) return { codes: [], message: '' };
  const inner = Array.isArray(err.errors) && err.errors.length > 0 ? err.errors : [err];
  const codes = [];
  const msgs = [];
  if (err.code) codes.push(err.code);
  inner.forEach(item => {
    if (item?.code && !codes.includes(item.code)) codes.push(item.code);
    if (item?.message) msgs.push(item.message);
  });
  if (err.message && !msgs.includes(err.message)) msgs.unshift(err.message);
  return {
    codes: Array.from(new Set(codes)),
    message: msgs.filter(Boolean).join(' | ')
  };
}

export function formatMailTransportError(err, fallback = 'Gửi email thất bại.') {
  if (!err) return fallback;
  const details = formatTransportErrorDetails(err);
  if (err.message && String(err.message).trim()) return err.message;
  if (details.message) return details.message;
  if (details.codes.length > 0) return `Lỗi kết nối dịch vụ email (${details.codes.join(', ')}).`;
  return fallback;
}

function createSmtpLineReader(socket) {
  let buffer = '';
  const pendingResolvers = [];
  const queuedLines = [];
  let closedErr = null;

  const flush = () => {
    while (buffer.includes('\n')) {
      const idx = buffer.indexOf('\n');
      const line = buffer.slice(0, idx).replace(/\r$/, '');
      buffer = buffer.slice(idx + 1);
      queuedLines.push(line);
      if (/^\d{3} /.test(line) && pendingResolvers.length > 0) {
        const res = pendingResolvers.shift();
        const block = queuedLines.splice(0, queuedLines.length);
        res.resolve({ code: Number(line.slice(0, 3)), lines: block, last: line });
      }
    }
  };

  const onData = chunk => {
    buffer += chunk.toString('utf8');
    flush();
  };

  socket.on('data', onData);

  const failAll = err => {
    closedErr = err;
    while (pendingResolvers.length > 0) {
      pendingResolvers.shift().reject(err);
    }
  };

  const onClose = () => failAll(new Error('SMTP connection closed unexpectedly'));
  socket.on('error', failAll);
  socket.on('close', onClose);

  const readReply = (timeoutMs = 12_000) => {
    if (queuedLines.length > 0 && /^\d{3} /.test(queuedLines[queuedLines.length - 1])) {
      const last = queuedLines[queuedLines.length - 1];
      const block = queuedLines.splice(0, queuedLines.length);
      return Promise.resolve({ code: Number(last.slice(0, 3)), lines: block, last });
    }
    if (closedErr) return Promise.reject(closedErr);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const i = pendingResolvers.indexOf(entry);
        if (i >= 0) pendingResolvers.splice(i, 1);
        reject(new Error('Hết thời gian chờ phản hồi từ máy chủ SMTP.'));
      }, timeoutMs);
      const entry = {
        resolve: val => {
          clearTimeout(timer);
          resolve(val);
        },
        reject: err => {
          clearTimeout(timer);
          reject(err);
        }
      };
      pendingResolvers.push(entry);
    });
  };

  const rebindSocket = nextSocket => {
    try {
      socket.removeListener('data', onData);
      socket.removeListener('error', failAll);
      socket.removeListener('close', onClose);
    } catch {}
    socket = nextSocket;
    buffer = '';
    queuedLines.length = 0;
    closedErr = null;
    socket.on('data', onData);
    socket.on('error', failAll);
    socket.on('close', () => failAll(new Error('SMTP TLS connection closed')));
  };

  return { readReply, rebindSocket };
}

async function sendViaSmtpNode(cfg, { to, subject, html, text }) {
  const host = cfg.smtpHost;
  const port = Number(cfg.smtpPort) || 465;
  const useImplicitTls = port === 465 || (Boolean(cfg.smtpSecure) && port !== 587);

  let socket;
  try {
    socket = await new Promise((resolve, reject) => {
      const conn = useImplicitTls
        ? tls.connect({ host, port, servername: host, rejectUnauthorized: true })
        : net.connect({ host, port });
      const timer = setTimeout(() => {
        conn.destroy();
        reject(new Error('SMTP_CONNECT_TIMEOUT'));
      }, 12_000);
      conn.once(useImplicitTls ? 'secureConnect' : 'connect', () => {
        clearTimeout(timer);
        resolve(conn);
      });
      conn.once('error', err => {
        clearTimeout(timer);
        reject(err);
      });
    });
  } catch (connErr) {
    const info = formatTransportErrorDetails(connErr);
    const codeTag = info.codes.join(', ') || (info.message === 'SMTP_CONNECT_TIMEOUT' ? 'TIMEOUT' : info.message || 'BLOCKED');
    throw new Error(
      `Không thể kết nối SMTP ${host}:${port} (${codeTag}). Máy chủ Railway gói Free/Trial/Hobby CHẶN cổng SMTP 465/587 ra ngoài — hãy chuyển sang tab "Gmail (HTTPS)" hoặc "Brevo API" để gửi bằng ${cfg.smtpUser || cfg.fromEmail || 'Gmail của bạn'} qua HTTPS (cổng 443).`
    );
  }

  const reader = createSmtpLineReader(socket);
  const sendCmd = async (cmd, expectedCodes) => {
    if (cmd !== null) socket.write(`${cmd}\r\n`);
    const reply = await reader.readReply();
    const okCodes = Array.isArray(expectedCodes) ? expectedCodes : [expectedCodes];
    if (!okCodes.includes(reply.code)) {
      throw new Error(`SMTP error (${reply.code}): ${reply.last}`);
    }
    return reply;
  };

  try {
    await sendCmd(null, 220);
    const ehlo = await sendCmd(`EHLO ${host}`, 250);
    if (!useImplicitTls && ehlo.lines.some(l => /STARTTLS/i.test(l))) {
      await sendCmd('STARTTLS', 220);
      socket = await new Promise((resolve, reject) => {
        const tlsSock = tls.connect({ socket, servername: host, rejectUnauthorized: true }, () => resolve(tlsSock));
        tlsSock.once('error', reject);
      });
      reader.rebindSocket(socket);
      await sendCmd(`EHLO ${host}`, 250);
    }

    await sendCmd('AUTH LOGIN', 334);
    await sendCmd(Buffer.from(cfg.smtpUser, 'utf8').toString('base64'), 334);
    await sendCmd(Buffer.from(cfg.smtpPass, 'utf8').toString('base64'), 235);

    const envelopeFrom = cfg.fromEmail && cfg.fromEmail.includes('@') ? cfg.fromEmail : cfg.smtpUser;
    await sendCmd(`MAIL FROM:<${envelopeFrom}>`, 250);
    await sendCmd(`RCPT TO:<${to}>`, [250, 251]);
    await sendCmd('DATA', 354);

    const boundary = `ielts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const bodyLines = [
      `From: ${encodeMimeHeaderUtf8(cfg.fromName)} <${envelopeFrom}>`,
      `To: <${to}>`,
      `Subject: ${encodeMimeHeaderUtf8(subject)}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(String(text || ''), 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'),
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(String(html || ''), 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'),
      '',
      `--${boundary}--`,
      '.'
    ].join('\r\n');

    await sendCmd(bodyLines, 250);
    try {
      socket.write('QUIT\r\n');
    } catch {}
    socket.end();
    return { ok: true, provider: 'smtp' };
  } catch (err) {
    try {
      socket.destroy();
    } catch {}
    throw err;
  }
}

export async function sendTransactionalEmail(store, { to, subject, html, text }) {
  const cfg = getEffectiveMailConfig(store);
  if (!cfg.configured) {
    const err = new Error('Máy chủ chưa cấu hình dịch vụ gửi email (Apps Script / Brevo / Resend / SMTP).');
    err.code = 'MAIL_NOT_CONFIGURED';
    throw err;
  }
  try {
    if (cfg.provider === 'apps_script') {
      return await sendViaAppsScript(cfg, { to, subject, html, text });
    }
    if (cfg.provider === 'resend') {
      return await sendViaResendApi(cfg, { to, subject, html, text });
    }
    if (cfg.provider === 'brevo') {
      return await sendViaBrevoApi(cfg, { to, subject, html, text });
    }
    return await sendViaSmtpNode(cfg, { to, subject, html, text });
  } catch (err) {
    const details = formatTransportErrorDetails(err);
    if (!err?.message && (details.message || details.codes.length > 0)) {
      throw new Error(formatMailTransportError(err));
    }
    throw err;
  }
}

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildOtpEmailContent({ purpose, otpCode, username, displayName, expiresMinutes = 10 }) {
  const isReset = purpose === 'forgot_password';
  const title = isReset
    ? 'Mã xác minh OTP đặt lại mật khẩu'
    : 'Mã xác minh OTP liên kết email tài khoản';
  const subject = isReset
    ? `[IELTS Nha Trang] Mã OTP đặt lại mật khẩu: ${otpCode}`
    : `[IELTS Nha Trang] Mã OTP xác minh email: ${otpCode}`;
  const greetingName = escapeHtml(displayName || username || 'bạn');
  const safeUsername = escapeHtml(username || '');
  const actionLine = isReset
    ? `Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <b>@${safeUsername}</b> tại hệ thống Luyện Thi IELTS Nha Trang — Ms. Như.`
    : `Bạn vừa yêu cầu liên kết email khôi phục cho tài khoản <b>@${safeUsername}</b> tại hệ thống Luyện Thi IELTS Nha Trang — Ms. Như.`;

  const text = `${title}\n\nXin chào ${greetingName},\nMã OTP của bạn là: ${otpCode}\nMã có hiệu lực trong ${expiresMinutes} phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\nNếu không phải bạn yêu cầu, vui lòng bỏ qua email này.`;

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; background: #fff; border: 1px solid #f4d0dc; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #007A7A, #065B5B); padding: 20px 24px; color: #fff;">
      <p style="margin: 0; font-size: 12px; opacity: 0.9; text-transform: uppercase; letter-spacing: 0.08em;">IELTS Nha Trang • Ms. Như</p>
      <h2 style="margin: 6px 0 0; font-size: 18px; font-weight: 800;">${title}</h2>
    </div>
    <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.6;">
      <p style="margin-top: 0;">Xin chào <b>${greetingName}</b>,</p>
      <p>${actionLine}</p>
      <div style="margin: 22px 0; padding: 16px; background: #EDFFFD; border: 1px dashed #007A7A; border-radius: 12px; text-align: center;">
        <p style="margin: 0 0 6px; font-size: 11px; color: #065B5B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Mã xác minh OTP (hiệu lực ${expiresMinutes} phút)</p>
        <p style="margin: 0; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #0F172B; font-family: monospace;">${otpCode}</p>
      </div>
      <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">Vì lý do bảo mật, tuyệt đối không cung cấp mã OTP này cho người khác. Nếu bạn không thực hiện thao tác này, có thể bỏ qua email.</p>
    </div>
  </div>`;

  return { subject, text, html };
}
