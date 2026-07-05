// O.R.C.A Local Intelligence Database Simulation
// This serves as the realistic mock backend for the hackathon demonstration.

const initialData = {
  // --- COMMAND CENTER TELEMETRY & LOGS ---
  telemetry: {
    threatIndex: 9.23,
    activeCellsTracked: 1474,
    responseCoverage: 96.7,
    ocrIntegrity: 99.5
  },
  
  incidentLogs: [
    { id: 'LOG-HQ-INTELL-81', type: 'escalation', time: '14:07:24 IST', message: 'ESCALATION: BNS SECTION 111 (ORGANIZED CRIME) FLAG ASSIGNED', severity: 'high' },
    { id: 'LOG-ISD-BORDER-12', type: 'alert', time: '14:07:36 IST', message: 'INTERSTATE TRAFFICKING WATCH ACTIVATED', severity: 'critical' },
    { id: 'LOG-MYS-CYB-04', type: 'info', time: '14:07:42 IST', message: 'MYSURU SECTOR 04 CORRIDOR: DEVICE ANOMALY TOWER PING REGISTERED', severity: 'medium' },
    { id: 'LOG-ISD-BORDER-13', type: 'alert', time: '14:07:46 IST', message: 'INTERSTATE TRAFFICKING WATCH ACTIVATED', severity: 'critical' }
  ],

  bulletins: [
    { id: 'BULL-442', type: 'secure', title: 'INTERPOL NOTICE #442', desc: 'Biometric profiles synchronized for domestic maritime borders matching known antiquities smuggling cells entering Karnataka coastal boundaries.' },
    { id: 'BULL-982', type: 'vuln', title: 'CERT-IN ADVISORY', desc: 'Critical zero-day patch released for state government proxy firewalls. Mandating immediate validation of all active municipal terminal links.' }
  ],

  activityStream: [
    { time: '14:04', message: 'INSPECTOR R KUMAR ACCESSED NODE-41', officerId: 'OP-442' },
    { time: '14:07', message: 'CYBER CELL EXECUTED CELLULAR CELL CORRELATION MODEL', officerId: 'SYS-AUTO' },
    { time: '14:07', message: 'MANGALURU CYBER UNIT FLAGGED NEW DEVICE CLUSTER', officerId: 'OP-118' },
    { time: '14:07', message: 'DSP R. K. SHASTRY ACCESS GRANTED: EXPORTS VAULT NODE 09', officerId: 'OP-001' }
  ],

  // --- CRIME ANALYTICS DATA ---
  analytics: {
    districts: [
      { name: 'Bengaluru Urban', severeCrimes: 28, financialCrimes: 1104, dispatchRate: 96, avgResolution: 4.2, threatScore: 9.4 },
      { name: 'Mysuru', severeCrimes: 14, financialCrimes: 182, dispatchRate: 88, avgResolution: 8.6, threatScore: 6.8 },
      { name: 'Mangaluru (DK)', severeCrimes: 19, financialCrimes: 241, dispatchRate: 91, avgResolution: 6.1, threatScore: 7.2 },
      { name: 'Hubballi-Dharwad', severeCrimes: 11, financialCrimes: 94, dispatchRate: 82, avgResolution: 12.4, threatScore: 5.1 },
      { name: 'Belagavi', severeCrimes: 8, financialCrimes: 62, dispatchRate: 85, avgResolution: 14.1, threatScore: 4.8 },
      { name: 'Kalaburagi', severeCrimes: 16, financialCrimes: 45, dispatchRate: 74, avgResolution: 18.2, threatScore: 6.5 }
    ]
  },

  // --- EVIDENCE VAULT WARRANTS ---
  warrants: [
    { id: 'FIR/2026/BLR/104', title: 'Coordinated Cyber Ransomware & ATM Cash Out', district: 'Bengaluru Urban', level: 'SEVERE', active: true, date: '2026-05-20', class: 'CYBER & FINANCIAL' },
    { id: 'FIR/2026/MYS/089', title: 'Ancient Artifact Smuggling & Heritage Forgery', district: 'Mysuru', level: 'HIGH', active: true, date: '2026-06-12', class: 'SMUGGLING' },
    { id: 'FIR/2026/HUB/078', title: 'Petroleum Transit Hijacking & Adulteration Depot', district: 'Hubballi-Dharwad', level: 'MODERATE', active: true, date: '2026-06-18', class: 'ORGANIZED CRIME' }
  ],

  // --- SUSPECTS & NETWORK NODES ---
  suspects: [
    {
      id: 'S-104-VH',
      name: "Vikram 'Ghost' Hegde",
      aliases: ['Ghost', 'V-Net', 'NetSpook'],
      age: 34,
      role: 'Cyber Coordinator',
      tier: 1,
      syncMatch: 98,
      status: 'ACTIVE WARRANT',
      location: 'Whitefield, Bengaluru',
      linkedVehicles: ['KA-03-MM-8924'],
      linkedPhones: ['99450***12'],
      linkedAccounts: ['SBI ending 2041'],
      notes: 'Extremely tech-literate. Uses high-grade VPN setups. Coordinates with local transport rings for physical cash collection.',
      anomaly: 'Incoming escrow of 4.2 Crores from Monero digital mixer; split ATM withdrawals across 18 ORR nodes.'
    },
    {
      id: 'S-104-RG',
      name: "Ramesh 'Kolar' Gowda",
      aliases: ['Kolar'],
      age: 41,
      role: 'Field Logistics',
      tier: 2,
      syncMatch: 91,
      status: 'UNDER SURVEILLANCE',
      location: 'Koramangala, Bengaluru',
      linkedVehicles: ['KA-01-AB-1234'],
      linkedPhones: ['98801***45'],
      linkedAccounts: ['HDFC ending 4421'],
      notes: 'Manages ground mules for ATM withdrawals. Previous convictions for extortion (BNS 308).',
      anomaly: 'Spike in UPI micro-transactions across 50+ dormant accounts within 4 hours.'
    },
    {
      id: 'S-104-PS',
      name: "Priyanka Shenoy",
      aliases: ['Priya', 'Broker P'],
      age: 28,
      role: 'Account Broker',
      tier: 2,
      syncMatch: 88,
      status: 'WANTED',
      location: 'Indiranagar, Bengaluru',
      linkedVehicles: [],
      linkedPhones: ['97422***88'],
      linkedAccounts: ['SBI ending 2041', 'ICICI ending 9901'],
      notes: 'Provides cloned debit cards and shell bank accounts to the syndicate.',
      anomaly: 'Co-signer on 14 shell company accounts flagged by FIU-IND.'
    }
  ],

  // --- NETWORK RELATIONSHIPS (Nodes & Edges for Visualizer) ---
  network: {
    nodes: [
      { id: 'n1', label: 'Vikram Hegde', group: 'suspect_tier1' },
      { id: 'n2', label: 'Ramesh Gowda', group: 'suspect_tier2' },
      { id: 'n3', label: 'Priyanka Shenoy', group: 'suspect_tier2' },
      { id: 'n4', label: 'Burner Ph: 99450...', group: 'phone' },
      { id: 'n5', label: 'SBI ending 2041', group: 'bank' },
      { id: 'n6', label: 'KA-03-MM-8924', group: 'vehicle' },
      { id: 'n7', label: 'Guruswamy Patil', group: 'suspect_tier1' }
    ],
    edges: [
      { from: 'n1', to: 'n4', label: 'Device Registered' },
      { from: 'n1', to: 'n2', label: 'Direct Coordination' },
      { from: 'n1', to: 'n3', label: 'Digital Cash Routing' },
      { from: 'n3', to: 'n5', label: 'Account Signatory' },
      { from: 'n2', to: 'n6', label: 'Operates Vehicle' },
      { from: 'n7', to: 'n1', label: 'Infiltration Funding' },
      { from: 'n7', to: 'n2', label: 'Sponsors Network' }
    ]
  }
};

class DatabaseService {
  constructor() {
    this.storageKey = 'orca_intelligence_db';
    this.init();
  }

  init() {
    const existing = localStorage.getItem(this.storageKey);
    if (!existing) {
      console.log('Initializing Mock Database for O.R.C.A Platform...');
      this.data = JSON.parse(JSON.stringify(initialData));
      this.save();
    } else {
      console.log('O.R.C.A Mock Database loaded from LocalStorage.');
      this.data = JSON.parse(existing);
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialData));
    this.save();
    console.log('Database reset to default state.');
  }

  // Generic Getters
  getTelemetry() { return this.data.telemetry; }
  getLogs() { return this.data.incidentLogs; }
  getBulletins() { return this.data.bulletins; }
  getActivityStream() { return this.data.activityStream; }
  getAnalytics() { return this.data.analytics; }
  getWarrants() { return this.data.warrants; }
  getSuspects() { return this.data.suspects; }
  getNetwork() { return this.data.network; }

  // Generic Adders
  addLog(log) {
    this.data.incidentLogs.unshift(log); // Add to top
    if(this.data.incidentLogs.length > 50) this.data.incidentLogs.pop(); // Keep manageable
    this.save();
  }
  
  addActivity(activity) {
    this.data.activityStream.unshift(activity);
    if(this.data.activityStream.length > 50) this.data.activityStream.pop();
    this.save();
  }

  // Search Engine Function
  searchAll(query) {
    const q = query.toLowerCase();
    let results = [];
    
    // Search suspects
    this.data.suspects.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.aliases.some(a => a.toLowerCase().includes(q))) {
        results.push({ type: 'Suspect', title: s.name, sub: `Alias: ${s.aliases.join(', ')}` });
      }
      if (s.linkedVehicles.some(v => v.toLowerCase().includes(q))) {
        results.push({ type: 'Vehicle', title: s.linkedVehicles.find(v => v.toLowerCase().includes(q)), sub: `Linked to: ${s.name}` });
      }
      if (s.linkedPhones.some(p => p.toLowerCase().includes(q))) {
        results.push({ type: 'Phone', title: s.linkedPhones.find(p => p.toLowerCase().includes(q)), sub: `Linked to: ${s.name}` });
      }
    });

    // Search Warrants
    this.data.warrants.forEach(w => {
      if (w.id.toLowerCase().includes(q) || w.title.toLowerCase().includes(q)) {
        results.push({ type: 'Warrant/FIR', title: w.id, sub: w.title });
      }
    });

    return results;
  }
}

// Expose globally for the frontend to use
window.ORCADB = new DatabaseService();
