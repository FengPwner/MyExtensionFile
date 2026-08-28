const algoSelect   = document.getElementById('algoSelect');
const keySection   = document.getElementById('keySection');
const keyInput     = document.getElementById('keyInput');
const plainInput   = document.getElementById('plainInput');
const resultOutput = document.getElementById('resultOutput');
const encryptBtn   = document.getElementById('encryptBtn');
const copyBtn      = document.getElementById('copyBtn');
const clearBtn     = document.getElementById('clearBtn');
const statusMsg    = document.getElementById('statusMsg');

const KEY_ALGOS = ['aes-gcm', 'aes-cbc', 'hmac-sha256', 'hmac-sha512'];

algoSelect.addEventListener('change', () => {
  keySection.classList.toggle('hidden', !KEY_ALGOS.includes(algoSelect.value));
});

function showStatus(msg, err = false) {
  statusMsg.textContent = msg;
  statusMsg.className = err ? 'status error' : 'status';
  if (msg) setTimeout(() => statusMsg.textContent = '', 3000);
}

encryptBtn.addEventListener('click', async () => {
  const text = plainInput.value;
  if (!text) return showStatus('Please enter plain text', true);

  const algo = algoSelect.value;

  try {
    let result;
    switch (algo) {
      case 'base64':  result = b64Encode(text);          break;
      case 'hex':     result = toHex(text);              break;
      case 'rot13':   result = rot13(text);              break;
      case 'url':     result = encodeURIComponent(text); break;
      case 'sha-1':
      case 'sha-256':
      case 'sha-384':
      case 'sha-512':
        result = await digest(text, algo); break;
      case 'aes-gcm':
      case 'aes-cbc':
        result = await aesEncrypt(text, keyInput.value, algo); break;
      case 'hmac-sha256':
      case 'hmac-sha512':
        result = await hmac(text, keyInput.value, algo); break;
      default: return showStatus('Unknown algorithm', true);
    }
    resultOutput.value = result;
    showStatus('Conversion successful');
  } catch (e) {
    showStatus(e.message, true);
  }
});

function b64Encode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

function toHex(str) {
  return [...new TextEncoder().encode(str)]
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base + 13) % 26 + base);
  });
}

async function digest(text, algo) {
  const map = { 'sha-1':'SHA-1','sha-256':'SHA-256','sha-384':'SHA-384','sha-512':'SHA-512' };
  const buf = await crypto.subtle.digest(map[algo], new TextEncoder().encode(text));
  return bufToHex(buf);
}

async function aesEncrypt(text, password, mode) {
  if (!password) throw new Error('Key is required');

  const enc  = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(mode === 'aes-gcm' ? 12 : 16));

  const material = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name:'PBKDF2', salt, iterations:100000, hash:'SHA-256' },
    material,
    { name: mode==='aes-gcm'?'AES-GCM':'AES-CBC', length:256 },
    false, ['encrypt']
  );

  const ct = await crypto.subtle.encrypt(
    mode==='aes-gcm' ? {name:'AES-GCM',iv} : {name:'AES-CBC',iv},
    key, enc.encode(text)
  );

  const out = new Uint8Array(salt.length + iv.length + ct.byteLength);
  out.set(salt, 0);
  out.set(iv, salt.length);
  out.set(new Uint8Array(ct), salt.length + iv.length);
  return bufToB64(out.buffer);
}

async function hmac(text, password, algo) {
  if (!password) throw new Error('Key is required');
  const hash = algo === 'hmac-sha512' ? 'SHA-512' : 'SHA-256';
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    { name:'HMAC', hash }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return bufToHex(sig);
}

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function bufToB64(buf) {
  let s=''; new Uint8Array(buf).forEach(b=>s+=String.fromCharCode(b));
  return btoa(s);
}

copyBtn.addEventListener('click', () => {
  if (!resultOutput.value) return showStatus('Nothing to copy', true);
  navigator.clipboard.writeText(resultOutput.value)
    .then(() => showStatus('Copied to clipboard'))
    .catch(() => showStatus('Copy failed', true));
});

clearBtn.addEventListener('click', () => {
  plainInput.value = '';
  resultOutput.value = '';
  keyInput.value = '';
  showStatus('');
});
