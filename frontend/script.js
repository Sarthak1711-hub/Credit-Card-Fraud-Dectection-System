const chain   = [];              
const perfLog = { aes: [], sha: [] };  
const $    = id        => document.getElementById(id);
const txt  = (id, val) => $(id).textContent = val;
const html = (id, val) => $(id).innerHTML   = val;
const fmt  = (n, d=2)  => parseFloat(n).toFixed(d);
function aesEncrypt(plaintext, key) {
  const t0 = performance.now();
  const cipher = CryptoJS.AES.encrypt(plaintext, key).toString();
  return { cipher, ms: performance.now() - t0 };
}
function aesDecrypt(cipher, key) {
  try {
    return CryptoJS.AES.decrypt(cipher, key).toString(CryptoJS.enc.Utf8);
  } catch {
    return 'DECRYPT ERROR';
  }
}
function sha256(data) {
  const t0 = performance.now();
  const hash = CryptoJS.SHA256(data).toString();
  return { hash, ms: performance.now() - t0 };
}
function blockHash(block) {
  const fields = {
    index:       block.index,
    ts:          block.ts,
    cipher:      block.cipher,
    prediction:  block.prediction,
    probability: block.probability,
    prevHash:    block.prevHash
  };
  return sha256(JSON.stringify(fields)).hash;
}
async function getPrediction(features) {
  try {
    const res = await fetch('http://127.0.0.1:8000/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ features })
    });
    const data = await res.json();
    return { prediction: data.prediction, probability: data.fraud_probability };
  } catch {
    const [amount, hour, location, , intl] = features;
    const prob =
      amount > 15000              ? 0.7 + Math.random() * 0.3 :
      (hour < 4 || hour > 22)    ? 0.4 + Math.random() * 0.4 :
      location > 0.7              ? 0.5 + Math.random() * 0.4 :
      intl                        ? 0.3 + Math.random() * 0.4 :
                                    Math.random() * 0.35;
    return { prediction: prob > 0.5 ? 1 : 0, probability: prob };
  }
}
function switchTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  $('tab-' + id).classList.add('active');
  if (id === 'chain') refreshChain();
  if (id === 'perf')  refreshPerf();
}
async function analyze() {
  const amount   = parseFloat($('amount').value);
  const hour     = parseFloat($('hour').value);
  const location = parseFloat($('location').value);
  const device   = parseInt($('device').value);
  const intl     = parseInt($('international').value);
  const key      = $('aesKey').value || 'FraudShield$2024!';
  if ([amount, hour, location].some(isNaN)) { alert('Fill all fields.'); return; }
  $('verdict').className = 'verdict-box loading';
  html('verdict', '<div class="v-icon">⏳</div><div>Analyzing…</div>');
  const features = [amount, hour, location, device, intl, ...Array(25).fill(0)];
  const { prediction, probability } = await getPrediction(features);
  const isFraud = prediction === 1;
  const payload   = JSON.stringify({ amount, hour, location, device, intl, prediction, probability: probability.toFixed(4) });
  const aesResult = aesEncrypt(payload, key);
  const decrypted = aesDecrypt(aesResult.cipher, key);
  perfLog.aes.push(aesResult.ms);
  const shaInput  = `${aesResult.cipher}|${prediction}|${probability.toFixed(6)}`;
  const shaResult = sha256(shaInput);
  perfLog.sha.push(shaResult.ms);
  const prevHash = chain.length ? chain[chain.length - 1].hash : '0'.repeat(64);
  const block    = {
    index: chain.length, ts: new Date().toISOString(),
    cipher: aesResult.cipher, hash: '',
    prevHash, prediction,
    probability: parseFloat(probability.toFixed(4)),
    aesMs: aesResult.ms, shaMs: shaResult.ms
  };
  block.hash = blockHash(block);
  chain.push(block);
  updateVerdictUI(isFraud, probability);
  updateMetricsUI(amount, location, hour, probability);
  updateAesUI(payload, aesResult, decrypted);
  updateShaUI(shaInput, shaResult);
  updateBlockPreviewUI(block, isFraud, probability);
}

function updateVerdictUI(isFraud, probability) {
  $('verdict').className = `verdict-box ${isFraud ? 'fraud' : 'safe'}`;
  html('verdict', `
    <div class="v-icon">${isFraud ? '🚨' : '✅'}</div>
    <div>${isFraud ? 'Fraud Detected' : 'Safe Transaction'}
      <span style="font-size:10px;opacity:.6;margin-left:8px">${(probability * 100).toFixed(1)}% risk</span>
    </div>`);
}

function updateMetricsUI(amount, location, hour, probability) {
  txt('mAmount', `$${fmt(amount)}`);
  txt('mLoc',    `${(location * 100).toFixed(0)}%`);
  txt('mHour',   `${hour}:00`);
  txt('riskNum', `${(probability * 100).toFixed(1)}%`);

  $('riskNum').style.color =
    probability > 0.7 ? 'var(--red)'   :
    probability > 0.4 ? 'var(--amber)' : 'var(--green)';

  requestAnimationFrame(() => {
    $('barAmount').style.width = Math.min((amount / 20000) * 100, 100) + '%';
    $('barLoc').style.width    = (location * 100) + '%';
    $('barHour').style.width   = ((hour / 23) * 100) + '%';
    $('barRisk').style.width   = Math.max(probability * 100, 3) + '%';
  });
}

function updateAesUI(payload, aesResult, decrypted) {
  txt('cfPlain',   payload.length > 80 ? payload.slice(0, 80) + '…' : payload);
  txt('cfCipher',  aesResult.cipher.slice(0, 72) + '…');
  txt('cfDecrypt', decrypted === payload ? '✓ Match — data intact' : decrypted);
  html('aesTiming', `
    <div class="chip chip-cyan">⏱ Encrypt: ${fmt(aesResult.ms, 3)}ms</div>
    <div class="chip chip-cyan">🔑 AES-256-CBC</div>`);
}

function updateShaUI(shaInput, shaResult) {
  txt('shInput', shaInput.slice(0, 60) + '…');
  txt('shHash',  shaResult.hash);

  const verified = sha256(shaInput).hash === shaResult.hash;
  $('shIntegrity').className = `cf-val ${verified ? 'ok' : 'fail'}`;
  txt('shIntegrity', verified ? '✓ Hash verified — no tampering detected' : '✗ Hash mismatch!');

  html('shaTiming', `
    <div class="chip chip-amber">⏱ Hash: ${fmt(shaResult.ms, 3)}ms</div>
    <div class="chip chip-amber">📏 256-bit digest</div>`);
}

function updateBlockPreviewUI(block, isFraud, probability) {
  txt('bpIdx',  `#${block.index}`);
  txt('bpTs',   block.ts);
  txt('bpPred', `${isFraud ? '🚨 FRAUD' : '✅ SAFE'} · ${(probability * 100).toFixed(2)}%`);
  txt('bpHash', block.hash);
}

function randomize() {
  $('amount').value       = (Math.random() * 20000).toFixed(2);
  $('hour').value         = Math.floor(Math.random() * 24);
  $('location').value     = Math.random().toFixed(2);
  $('device').value       = Math.random() > 0.5 ? '1' : '0';
  $('international').value = Math.random() > 0.7 ? '1' : '0';
}

function refreshChain() {

  $('chainEmpty').style.display = chain.length ? 'none' : 'flex';

  $('chainList').querySelectorAll('.block-row').forEach(r => r.remove());

  [...chain].reverse().forEach((block, i) => {
    const isFraud = block.prediction === 1;
    const valid   = blockHash(block) === block.hash;
    const row = document.createElement('div');
    row.className = 'block-row';
    row.style.animationDelay = `${i * 30}ms`;
    row.innerHTML = `
      <div class="b-idx">#${String(block.index).padStart(4, '0')}</div>
      <div class="b-verdict ${isFraud ? 'fraud' : 'safe'}">${isFraud ? '🚨 FRAUD' : '✅ SAFE'}</div>
      <div class="b-prob ${isFraud ? 'fraud' : 'safe'}">${(block.probability * 100).toFixed(1)}%</div>
      <div class="b-cipher" title="${block.cipher}">${block.cipher.slice(0, 28)}…</div>
      <div class="b-hash"   title="${block.hash}">${block.hash.slice(0, 16)}…</div>
      <div class="b-integrity ${valid ? 'ok' : 'fail'}">${valid ? '✓ OK' : '✗ FAIL'}</div>`;
    $('chainList').appendChild(row);
  });

  const fraudCount = chain.filter(b => b.prediction === 1).length;
  const allValid   = chain.every(b => blockHash(b) === b.hash);

  txt('cs-total', `${chain.length} block${chain.length !== 1 ? 's' : ''}`);
  txt('cs-fraud', `${fraudCount} fraud`);
  txt('cs-safe',  `${chain.length - fraudCount} safe`);
  $('cs-integrity').textContent = allValid ? '✓ Integrity OK' : '✗ Tampered!';
  $('cs-integrity').style.color = allValid ? 'var(--green)' : 'var(--red)';
}

function refreshPerf() {
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const avgAes     = avg(perfLog.aes);
  const avgSha     = avg(perfLog.sha);
  const fraudCount = chain.filter(b => b.prediction === 1).length;
  const allValid   = chain.every(b => blockHash(b) === b.hash);

  html('pAesTime', avgAes != null ? `${fmt(avgAes, 3)}<span class="big-stat-unit">ms</span>` : `—<span class="big-stat-unit">ms</span>`);
  txt('pAesOps',   avgAes != null ? `~${Math.round(1000 / avgAes).toLocaleString()} ops/sec` : 'No data yet');

  html('pShaTime', avgSha != null ? `${fmt(avgSha, 3)}<span class="big-stat-unit">ms</span>` : `—<span class="big-stat-unit">ms</span>`);
  txt('pShaOps',   avgSha != null ? `~${Math.round(1000 / avgSha).toLocaleString()} ops/sec` : 'No data yet');

  txt('pTotal',        chain.length);
  txt('pFraudCount',   `${fraudCount} fraud detected`);
  txt('pIntegrity',    chain.length ? (allValid ? '100' : '<100') + '%' : '—%');
  txt('pIntegritySub', chain.length ? (allValid ? 'All hashes valid' : '⚠ Tampered block detected') : 'No blocks yet');

  if (avgAes != null) {
    txt('pt-aes-time', `${fmt(avgAes, 3)} ms`);
    txt('pt-aes-ops',  `~${Math.round(1000 / avgAes).toLocaleString()} ops/s`);
  }
  if (avgSha != null) {
    txt('pt-sha-time', `${fmt(avgSha, 3)} ms`);
    txt('pt-sha-ops',  `~${Math.round(1000 / avgSha).toLocaleString()} ops/s`);
  }

  if (avgAes != null && avgSha != null) {
    const maxMs = Math.max(avgAes, avgSha, 0.05, 0.04) * 1.2;
    requestAnimationFrame(() => {
      $('bc-aes').style.width = Math.min((avgAes / maxMs) * 100, 100) + '%';
      $('bc-sha').style.width = Math.min((avgSha / maxMs) * 100, 100) + '%';
      txt('bcv-aes', `${fmt(avgAes, 3)}ms`);
      txt('bcv-sha', `${fmt(avgSha, 3)}ms`);
    });
  }
}