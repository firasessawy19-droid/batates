const express = require('express');
const mineflayer = require('mineflayer');
const bedrock = require('bedrock-protocol');

const app = express();
app.use(express.json({ limit: '10kb' }));
app.use(express.static('public'));

const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const SERVER_HOST = process.env.MC_SERVER_HOST;
const JAVA_PORT = Number(process.env.MC_JAVA_PORT || 25565);
const BEDROCK_PORT = Number(process.env.MC_BEDROCK_PORT || 19132);
const BOT_USERNAME = process.env.MC_BOT_USERNAME || 'SharedHelperBot';
const BEDROCK_VERSION = process.env.BEDROCK_VERSION || '1.26.51';

// Never accept arbitrary server addresses from public visitors: this prevents
// the website being abused as a general-purpose network proxy.
let activeBot = null;
let activeEdition = null;
let status = { state: 'offline', message: 'البوت غير متصل', edition: null, logs: [] };

function log(message) {
  const line = `[${new Date().toISOString()}] ${String(message).slice(0, 300)}`;
  status.logs.push(line);
  status.logs = status.logs.slice(-40);
  console.log(line);
}
function setStatus(state, message, edition = activeEdition) {
  status = { ...status, state, message, edition };
  log(message);
}
function authorized(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ error: 'يجب ضبط ADMIN_TOKEN في إعدادات الاستضافة أولًا.' });
  const supplied = req.get('x-admin-token');
  if (!supplied || supplied !== ADMIN_TOKEN) return res.status(401).json({ error: 'رمز الإدارة غير صحيح.' });
  next();
}
function disconnect() {
  try { if (activeBot) activeBot.quit?.('Dashboard disconnect'); } catch {}
  try { if (activeBot && activeEdition === 'bedrock') activeBot.close?.(); } catch {}
  activeBot = null;
  activeEdition = null;
  status = { state: 'offline', message: 'البوت غير متصل', edition: null, logs: status.logs };
  log('تم فصل البوت');
}
function connectJava() {
  const bot = mineflayer.createBot({
    host: SERVER_HOST,
    port: JAVA_PORT,
    username: BOT_USERNAME,
    // Set MC_VERSION only when you know the server version, e.g. 1.21.4
    ...(process.env.MC_VERSION ? { version: process.env.MC_VERSION } : {})
  });
  activeBot = bot;
  activeEdition = 'java';
  setStatus('connecting', 'جارٍ الاتصال بسيرفر Java...', 'java');
  bot.once('login', () => setStatus('online', 'تم تسجيل دخول البوت إلى Java', 'java'));
  bot.on('kicked', reason => setStatus('error', `تم طرد البوت: ${JSON.stringify(reason)}`, 'java'));
  bot.on('error', err => setStatus('error', `خطأ Java: ${err.message}`, 'java'));
  bot.on('end', () => {
    if (activeBot === bot) {
      activeBot = null; activeEdition = null;
      setStatus('offline', 'انقطع اتصال Java', 'java');
    }
  });
}
function connectBedrock() {
  const client = bedrock.createClient({
    host: SERVER_HOST,
    port: BEDROCK_PORT,
    username: BOT_USERNAME,
    offline: process.env.BEDROCK_OFFLINE_MODE === 'true',
    version: BEDROCK_VERSION
  });
  activeBot = client;
  activeEdition = 'bedrock';
  setStatus('connecting', 'جارٍ الاتصال بسيرفر Bedrock...', 'bedrock');
  client.on('join', () => setStatus('online', 'تم الاتصال بسيرفر Bedrock', 'bedrock'));
  client.on('kick', reason => setStatus('error', `تم رفض اتصال Bedrock: ${JSON.stringify(reason)}`, 'bedrock'));
  client.on('error', err => setStatus('error', `خطأ Bedrock: ${err.message}`, 'bedrock'));
  client.on('close', () => {
    if (activeBot === client) {
      activeBot = null; activeEdition = null;
      setStatus('offline', 'انقطع اتصال Bedrock', 'bedrock');
    }
  });
}
app.get('/api/status', (_req, res) => res.json({
  state: status.state, message: status.message, edition: status.edition, logs: status.logs
}));
app.post('/api/connect', authorized, (req, res) => {
  const edition = req.body?.edition;
  if (!SERVER_HOST) return res.status(503).json({ error: 'اضبط MC_SERVER_HOST في إعدادات الاستضافة أولًا.' });
  if (!['java', 'bedrock'].includes(edition)) return res.status(400).json({ error: 'اختر Java أو Bedrock.' });
  if (activeBot) return res.status(409).json({ error: 'البوت متصل بالفعل. افصله أولًا.' });
  try {
    if (edition === 'java') connectJava(); else connectBedrock();
    res.json({ ok: true, message: 'بدأت محاولة الاتصال.' });
  } catch (err) {
    setStatus('error', err.message, edition);
    res.status(500).json({ error: 'تعذر بدء الاتصال.' });
  }
});
app.post('/api/disconnect', authorized, (_req, res) => {
  disconnect();
  res.json({ ok: true });
});
app.listen(PORT, () => console.log(`Dashboard listening on ${PORT}`));
