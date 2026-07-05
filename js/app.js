// O.R.C.A Platform Global App Controller

document.addEventListener('DOMContentLoaded', () => {
  // Ensure DB is loaded
  if (!window.ORCADB) {
    console.error('CRITICAL: ORCADB not loaded.');
    return;
  }

  const db = window.ORCADB;

  // 1. Initialize Global Search
  initGlobalSearch(db);

  // 2. Initialize Operational Modules
  initCommandOverview(db);
  initCrimeAnalytics(db);
  initFIRVault(db);
});

/* =========================================
   GLOBAL SEARCH ENGINE
   ========================================= */
function initGlobalSearch(db) {
  const searchInput = document.querySelector('.search-bar input');
  if (!searchInput) return;

  // Create a dropdown container for results
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'search-results';
  resultsContainer.style.cssText = `
    position: absolute;
    top: 100%;
    left: 12px;
    right: 12px;
    background: white;
    border-radius: 4px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-light);
    max-height: 400px;
    overflow-y: auto;
    display: none;
    z-index: 1000;
    margin-top: 4px;
  `;
  searchInput.parentElement.appendChild(resultsContainer);

  let debounceTimer;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    const query = e.target.value.trim();
    
    if (query.length < 2) {
      resultsContainer.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(() => {
      const results = db.searchAll(query);
      renderSearchResults(results, resultsContainer);
    }, 300);
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!searchInput.parentElement.contains(e.target)) {
      resultsContainer.style.display = 'none';
    }
  });
}

function renderSearchResults(results, container) {
  if (results.length === 0) {
    container.innerHTML = `<div style="padding: 16px; font-size: 13px; color: var(--text-muted); text-align: center;">No matches found across intelligence databases.</div>`;
  } else {
    container.innerHTML = results.map(r => `
      <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-light); cursor: pointer;" onmouseover="this.style.background='rgba(0,0,0,0.02)'" onmouseout="this.style.background='white'">
        <div style="font-size: 10px; font-weight: 700; color: var(--gold); text-transform: uppercase; margin-bottom: 4px;">${r.type} MATCH</div>
        <div style="font-size: 14px; font-weight: 600; color: var(--navy);">${r.title}</div>
        <div style="font-size: 12px; color: var(--text-gray); margin-top: 2px;">${r.sub}</div>
      </div>
    `).join('');
  }
  container.style.display = 'block';
}

/* =========================================
   COMMAND OVERVIEW MODULE
   ========================================= */
function initCommandOverview(db) {
  // Load initial telemetry
  const telemetry = db.getTelemetry();
  document.getElementById('stat-threat-index').textContent = telemetry.threatIndex.toFixed(2);
  document.getElementById('stat-pings').textContent = telemetry.activeCellsTracked.toLocaleString();
  document.getElementById('stat-warrants').textContent = telemetry.responseCoverage + '%';
  document.getElementById('stat-calibration').textContent = telemetry.ocrIntegrity + '%';

  // Load initial logs
  renderLogs(db.getLogs(), 'container-intercept-logs');
  renderBulletins(db.getBulletins(), 'container-bulletins');
  renderActivity(db.getActivityStream(), 'container-activity');

  // Simulate Live Telemetry Updates
  setInterval(() => {
    // Fluctuate threat index slightly
    const newThreat = (parseFloat(db.getTelemetry().threatIndex) + (Math.random() * 0.1 - 0.05)).toFixed(2);
    document.getElementById('stat-threat-index').textContent = newThreat;
    
    const currentPings = parseInt(document.getElementById('stat-pings').textContent.replace(',', ''));
    document.getElementById('stat-pings').textContent = (currentPings + Math.floor(Math.random() * 5 - 2)).toLocaleString();
  }, 3000);

  // Simulate Live Incident generation every 15 seconds
  setInterval(() => {
    const sectors = ['MYS-CYB', 'HQ-INTELL', 'ISD-BORDER', 'BLR-TRAFFIC'];
    const msgs = ['DEVICE ANOMALY TOWER PING REGISTERED', 'ENCRYPTED HANDSHAKE DETECTED', 'UNAUTHORIZED BORDER ACCESS FLAGGED'];
    const newLog = {
      id: `LOG-${sectors[Math.floor(Math.random()*sectors.length)]}-${Math.floor(Math.random()*99)}`,
      time: new Date().toLocaleTimeString('en-US', {hour12: false}) + ' IST',
      message: msgs[Math.floor(Math.random()*msgs.length)],
      severity: Math.random() > 0.8 ? 'alert' : 'info'
    };
    db.addLog(newLog);
    renderLogs(db.getLogs(), 'container-intercept-logs');
  }, 15000);
}

function renderLogs(logs, containerId) {
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = logs.map(l => `
    <div class="log-entry" style="animation: fadeIn 0.3s ease;">
      <div class="log-meta"><span>LOG-ID: ${l.id}</span><span>${l.time}</span></div>
      <div class="log-msg ${l.severity === 'alert' || l.severity === 'critical' ? 'alert' : ''}">${l.message}</div>
    </div>
  `).join('');
}

function renderBulletins(bulletins, containerId) {
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = bulletins.map(b => `
    <div class="log-entry" style="border-left: 3px solid ${b.type==='secure'?'var(--accent-green)':'var(--accent-red)'}; padding-left: 12px; margin-bottom: 16px;">
      <div class="log-meta"><span style="font-weight:700; color:var(--text-dark);">${b.title}</span><span style="color: ${b.type==='secure'?'var(--accent-green)':'var(--accent-red)'}; text-transform:uppercase;">${b.type}</span></div>
      <div style="font-size: 13px; color: var(--text-gray); margin-top: 8px;">${b.desc}</div>
    </div>
  `).join('');
}

function renderActivity(stream, containerId) {
  const container = document.getElementById(containerId);
  if(!container) return;
  container.innerHTML = stream.map(s => `
    <div class="log-entry" style="animation: fadeIn 0.3s ease;">
      <div class="log-meta">[${s.time}]</div>
      <div class="log-msg" style="font-weight: 500;">${s.message}</div>
    </div>
  `).join('');
}

/* =========================================
   CRIME ANALYTICS MODULE
   ========================================= */
function initCrimeAnalytics(db) {
  const tableBody = document.getElementById('analytics-table-body');
  if(!tableBody) return;
  
  const analyticsData = db.getAnalytics();
  
  function renderTable(data) {
    tableBody.innerHTML = data.districts.map(d => {
      let threatBadge = 'badge-critical';
      let threatText = d.threatScore + ' Critical';
      if(d.threatScore < 6) { threatBadge = 'badge-optimal'; threatText = d.threatScore + ' Nominal'; }
      else if(d.threatScore < 8) { threatBadge = 'badge-warning'; threatText = d.threatScore + ' High'; }

      let dispatchClass = 'badge-optimal';
      if(d.dispatchRate < 85) dispatchClass = 'badge-warning';
      
      return `
      <tr>
        <td style="font-weight: 600;">${d.name}</td>
        <td>${d.severeCrimes} Cases</td>
        <td>${d.financialCrimes} Cases</td>
        <td class="${dispatchClass}">${d.dispatchRate}%</td>
        <td>${d.avgResolution} Hours</td>
        <td><span class="${threatBadge}" ${threatBadge==='badge-optimal'?'style="background:transparent;"':''}>${threatText}</span></td>
      </tr>
      `;
    }).join('');
  }
  
  renderTable(analyticsData);
}

/* =========================================
   FIR EVIDENCE VAULT MODULE
   ========================================= */
function initFIRVault(db) {
  // Render active warrants list
  const warrantsList = document.getElementById('active-warrants-list');
  if(warrantsList) {
    warrantsList.innerHTML = db.getWarrants().map(w => {
      let badgeColor = 'var(--accent-red)';
      if(w.level === 'HIGH') badgeColor = 'var(--accent-orange)';
      if(w.level === 'MODERATE') badgeColor = 'var(--navy-light)';
      
      return `
      <div style="padding: 16px; border-bottom: 1px solid var(--border-light); border-left: 3px solid ${badgeColor}; background: rgba(0,0,0,0.02); cursor:pointer;" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.02)'">
        <div style="font-family: var(--font-mono); font-size: 11px; font-weight:600; margin-bottom:4px;">${w.id}</div>
        <div style="font-size: 13px; font-weight: 500; color:var(--text-dark);">${w.title}</div>
        <div style="display:flex; justify-content:space-between; margin-top:8px; font-size: 10px; text-transform:uppercase; color:var(--text-muted);">
          <span>${w.district}</span>
          <span style="color:${badgeColor}; font-weight:700;">${w.level}</span>
        </div>
      </div>
      `;
    }).join('');
  }

  // File Drop Zone interaction
  const dropZone = document.getElementById('vault-dropzone');
  if(dropZone) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.background = 'rgba(16, 185, 129, 0.1)'; dropZone.style.borderColor = 'var(--accent-green)'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.background = 'transparent'; dropZone.style.borderColor = 'var(--border-light)'; });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.background = 'transparent'; 
      dropZone.style.borderColor = 'var(--border-light)';
      
      dropZone.innerHTML = `
        <div style="color:var(--navy); font-weight:700; margin-bottom:8px;">PROCESSING PACKET...</div>
        <div style="width: 100%; height: 4px; background: var(--border-light); border-radius: 2px; overflow: hidden;">
          <div style="width: 100%; height: 100%; background: var(--gold); animation: loadBar 2s ease-out forwards;"></div>
        </div>
        <style>@keyframes loadBar { from { width: 0%; } to { width: 100%; } }</style>
      `;
      
      setTimeout(() => {
        dropZone.innerHTML = `
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2" style="margin-bottom: 8px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          <div style="font-weight: 600; font-size: 14px; color: var(--accent-green);">OCR Calibration Complete</div>
          <div style="font-size: 11px; color: var(--text-muted);">Hash signature appended to chain of custody</div>
        `;
        db.addActivity({ time: new Date().toLocaleTimeString('en-US', {hour12: false}), message: 'NEW SECURE PACKET INGESTED TO VAULT', officerId: 'OP-001' });
        alert('File successfully ingested. Extracting intelligence matrix...');
      }, 2000);
    });
  }
}
