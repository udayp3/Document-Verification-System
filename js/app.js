
// Simple client-side DocuVerify demo
async function fileToHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

// Elements
const fileInput = document.getElementById('fileInput');
const registerResult = document.getElementById('registerResult');
const saveRecordBtn = document.getElementById('saveRecordBtn');
const clearRecordsBtn = document.getElementById('clearRecordsBtn');
const verifyFileInput = document.getElementById('verifyFileInput');
const hashInput = document.getElementById('hashInput');
const checkBtn = document.getElementById('checkBtn');
const verifyResult = document.getElementById('verifyResult');
const recordsList = document.getElementById('recordsList');

let lastComputed = null;

function loadRecords() {
  const raw = localStorage.getItem('docu_records') || '[]';
  try {
    return JSON.parse(raw);
  } catch(e) { return []; }
}

function saveRecords(records) {
  localStorage.setItem('docu_records', JSON.stringify(records));
}

function renderRecords() {
  const records = loadRecords();
  recordsList.innerHTML = '';
  if(!records.length) {
    recordsList.innerHTML = '<div class="result">No local records yet.</div>';
    return;
  }
  records.forEach(r => {
    const div = document.createElement('div');
    div.className = 'record';
    div.innerHTML = `<div><strong>${r.name}</strong><br><small>${new Date(r.time).toLocaleString()}</small></div>
                     <div style="text-align:right"><small>${r.hash.slice(0,12)}...${r.hash.slice(-8)}</small></div>`;
    recordsList.appendChild(div);
  });
}

// Register: compute hash when file selected
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if(!file) return;
  registerResult.textContent = 'Computing hash...';
  show(registerResult);
  const hash = await fileToHash(file);
  lastComputed = { name: file.name, hash };
  registerResult.textContent = `Hash: ${hash}`;
  saveRecordBtn.disabled = false;
});

saveRecordBtn.addEventListener('click', () => {
  if(!lastComputed) return;
  const records = loadRecords();
  records.unshift({ name: lastComputed.name, hash: lastComputed.hash, time: Date.now() });
  saveRecords(records);
  renderRecords();
  saveRecordBtn.disabled = true;
  registerResult.textContent = 'Saved locally ✅';
  lastComputed = null;
  fileInput.value = '';
});

clearRecordsBtn.addEventListener('click', () => {
  if(confirm('Clear all local records?')) {
    saveRecords([]);
    renderRecords();
  }
});

// Verify: either file or hash input
checkBtn.addEventListener('click', async () => {
  verifyResult.textContent = 'Checking...';
  show(verifyResult);
  let hashToCheck = '';
  if(verifyFileInput.files && verifyFileInput.files[0]) {
    hashToCheck = await fileToHash(verifyFileInput.files[0]);
  } else if (hashInput.value && hashInput.value.trim().length>0) {
    hashToCheck = hashInput.value.trim();
  } else {
    verifyResult.textContent = 'Please provide a file or paste a hash.';
    return;
  }

  const records = loadRecords();
  const found = records.find(r => r.hash === hashToCheck);
  if(found) {
    verifyResult.innerHTML = `<strong>Verified ✅</strong><br>File matches local record: <em>${found.name}</em><br><small>${new Date(found.time).toLocaleString()}</small>`;
  } else {
    verifyResult.innerHTML = `<strong>Not found ❌</strong><br>No matching record in local registry.`;
  }
  // reset inputs
  verifyFileInput.value = '';
  hashInput.value = '';
});

// Initialize
renderRecords();
