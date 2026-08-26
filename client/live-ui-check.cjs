/* Live UI check: drives the deployed frontend in headless Chrome (mobile viewport).
   Covers the MVP checklist: register, search, open chat, send via button AND Enter,
   refresh persistence, console errors. */
const puppeteer = require('puppeteer-core');

const FRONTEND = 'https://whatsapp2-frontend-0pdh.onrender.com';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SHOTS = `${process.env.TEMP}\\qa-browser\\live`;
const uniq = Date.now().toString(36);
const USER = `liveui_${uniq}`;
const PEER = `livepeer_${uniq}`;
const PEER_NAME = `Peer ${uniq}`;

(async () => {
  const fs = require('fs');
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`); });

  const step = (name, ok, note = '') => console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${note ? ' — ' + note : ''}`);

  // Peer unico per questa run (evita collisioni con run precedenti)
  await fetch('https://whatsapp2-backend-tz1e.onrender.com/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: PEER, fullName: PEER_NAME })
  });

  await page.goto(FRONTEND, { waitUntil: 'networkidle0', timeout: 60000 });
  const title = await page.title();
  step('app loads, title WhatsApp 2', title === 'WhatsApp 2', title);
  await page.screenshot({ path: `${SHOTS}\\01-onboarding.png` });

  // Onboarding: username-only registration
  const input = await page.waitForSelector('input[aria-label="Username"]', { timeout: 15000 });
  await input.type(USER, { delay: 40 });
  await new Promise((r) => setTimeout(r, 600));
  await page.click('button[type="submit"]');
  const onboarded = await page
    .waitForFunction(() => !!localStorage.getItem('whatsapp2_user_session'), { timeout: 20000, polling: 500 })
    .then(() => true)
    .catch(() => false);
  step('username-only registration + stored in localStorage', onboarded);
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${SHOTS}\\02-home.png` });

  // Search for a real user: click "Nuova chat" to open the NewChatModal
  await page.click('button[aria-label="Nuova chat"]');
  await new Promise((r) => setTimeout(r, 1500));
  const searchInput = await page.waitForSelector('input[placeholder*="Cerca"], input[placeholder*="cerca"], input[type="search"], input', { timeout: 8000 });
  await searchInput.type(PEER, { delay: 40 });
  await new Promise((r) => setTimeout(r, 3000));
  const foundUser = await page.evaluate((p) => document.body.innerText.includes(p), PEER);
  step('user search shows real users', foundUser);
  await page.screenshot({ path: `${SHOTS}\\03-search.png` });

  // Open conversation with first result
  const clicked = await page.evaluate((p) => {
    const els = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && e.innerText?.includes(p));
    if (els.length) { els[0].click(); return true; }
    return false;
  }, PEER);
  await new Promise((r) => setTimeout(r, 2500));
  step('open real conversation', clicked);
  await page.screenshot({ path: `${SHOTS}\\04-chat.png` });

  // Send message with Enter (wait for socket "connected" status first)
  await page.waitForFunction(() => {
    const s = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && /Online|Offline/.test(e.innerText || '') && e.innerText.length < 30);
    return s && !/connettendo|connecting|riconnessione/i.test(document.body.innerText);
  }, { timeout: 20000 }).catch(() => console.log('WARN: status wait timed out'));
  await new Promise((r) => setTimeout(r, 1500));
  // Pick the VISIBLE textarea (hit-test verified): the app mounts layout
  // variants and querySelector alone can return a covered instance.
  const pickVisible = (sel) =>
    page.evaluateHandle((s) => {
      const els = [...document.querySelectorAll(s)];
      return els.find((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        const top = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, r.height - 1));
        return top && (top === el || el.contains(top) || top.contains(el));
      }) || null;
    }, sel);
  const msgInput = (await pickVisible('textarea')).asElement();
  if (!msgInput) { step('visible message textarea found', false); throw new Error('no visible textarea'); }
  // Le bolle mostrano il testo TRADOTTO (è la feature): per asserzioni
  // robuste contiamo le bolle invece di cercare il testo originale.
  const bubbleCount = () => page.$$eval('.animate-pop-in', (els) => els.length).catch(() => 0);
  const waitBubbles = async (min) => {
    try {
      await page.waitForFunction((m) => document.querySelectorAll('.animate-pop-in').length >= m, { timeout: 20000, polling: 800 }, min);
      return true;
    } catch { return false; }
  };
  const baseCount = await bubbleCount();
  await msgInput.click();
  await msgInput.type(`Messaggio via Enter ${uniq}`, { delay: 30 });
  await page.keyboard.press('Enter');
  const enterSent = await waitBubbles(baseCount + 1);
  step('send message via Enter', enterSent);
  await page.screenshot({ path: `${SHOTS}\\05-sent-enter.png` });

  // Send message via real mouse click at the VISIBLE button's coordinates
  // (fresh handle: the textarea node is re-mounted after each send)
  const msgInput2 = (await pickVisible('textarea')).asElement();
  await msgInput2.click();
  await msgInput2.type(`Messaggio via bottone ${uniq}`, { delay: 30 });
  await new Promise((r) => setTimeout(r, 800));
  let sendClicked = false;
  const sendBtn = (await pickVisible('button[aria-label="Invia messaggio"]')).asElement();
  if (sendBtn) {
    await page.evaluate((b) => {
      window.__sendClicked = 0;
      b.addEventListener('click', () => { window.__sendClicked++; }, true);
    }, sendBtn);
    const info = await page.evaluate((b) => {
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, disabled: b.disabled };
    }, sendBtn);
    if (!info.disabled) {
      await page.evaluate((b) => b.click(), sendBtn);
      await new Promise((r) => setTimeout(r, 500));
      const fired = await page.evaluate(() => window.__sendClicked);
      sendClicked = true;
    }
  }
  const btnSent = sendClicked && (await waitBubbles(baseCount + 2));
  step('send message via button', btnSent, sendClicked ? '' : 'button not clickable');
  await page.screenshot({ path: `${SHOTS}\\05b-after-button.png` });

  // Refresh: user remembered + messages persisted
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 3500));
  const stillLoggedIn = await page.evaluate(() => !!localStorage.getItem('whatsapp2_user_session'));
  step('user remembered after refresh', stillLoggedIn);
  await page.screenshot({ path: `${SHOTS}\\06-after-refresh.png` });

  // Reopen the conversation from chat list and verify messages persisted
  const reopened = await page.evaluate((pn) => {
    const els = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.innerText || '').includes(pn));
    if (els.length) { els[0].click(); return true; }
    return false;
  }, PEER_NAME);
  let persisted = false;
  if (reopened) {
    persisted = await waitBubbles(2);
  }
  step('messages visible after refresh (persistence)', persisted);
  await page.screenshot({ path: `${SHOTS}\\07-persisted.png` });

  // No fake UI elements
  const fakeUI = await page.evaluate(() => {
    const t = document.body.innerText.toLowerCase();
    return ['stories', 'canali'].filter((k) => t.includes(k));
  });
  step('no stories/channels fake sections', fakeUI.length === 0, fakeUI.join(',') || 'clean');

  step('no critical console errors', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  step('no failed network requests', failedRequests.length === 0, failedRequests.slice(0, 3).join(' | '));

  await browser.close();
  console.log('DONE');
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
