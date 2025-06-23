document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsModal').style.display = 'block';
  fetch('/api/settings')
    .then(res => res.json())
    .then(data => {
      document.getElementById('savePathInput').value = data.savePath || '';
    });
});

document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  const savePath = document.getElementById('savePathInput').value;
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ savePath })
  }).then(() => {
    document.getElementById('settingsModal').style.display = 'none';
  });
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
  document.getElementById('settingsModal').style.display = 'none';
});

// Add this at the end to open modal from a button with id 'settingsBtn'
if (!document.getElementById('settingsBtn')) {
  const btn = document.createElement('button');
  btn.id = 'settingsBtn';
  btn.textContent = 'Settings';
  btn.style = 'position:fixed;top:10px;right:10px;z-index:2000;';
  document.body.appendChild(btn);
  btn.onclick = () => {
    document.getElementById('settingsModal').style.display = 'block';
    // Optionally trigger loading settings
    if (window.loadNotificationSettings) window.loadNotificationSettings();
  };
}
