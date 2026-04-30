const state = {
  leads: JSON.parse(localStorage.getItem('tf_leads') || '[]')
};

const fmtDate = (d = new Date()) => d.toISOString().slice(0, 10);

function save() {
  localStorage.setItem('tf_leads', JSON.stringify(state.leads));
}

function setView(tab) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === tab));
  const titles = {
    dashboard: ['Dashboard', 'Track daily growth and execution quality.'],
    leads: ['Leads', 'Capture and qualify opportunities.'],
    outreach: ['Outreach', 'Generate concise high-conversion first messages.'],
    followups: ['Follow-ups', 'Manage no-response lifecycle cleanly.'],
    content: ['Content Engine', 'Ship daily content that attracts real clients.']
  };
  document.getElementById('view-title').textContent = titles[tab][0];
  document.getElementById('view-subtitle').textContent = titles[tab][1];
}

function kpi() {
  const total = state.leads.length;
  const contacted = state.leads.filter(l => l.status === 'Contacted').length;
  const noResponse = state.leads.filter(l => l.status === 'No response').length;
  const replied = state.leads.filter(l => l.status === 'Replied').length;
  const closed = state.leads.filter(l => l.deal === 'Closed Won').length;
  return { total, contacted, noResponse, replied, closed };
}

function renderDashboard() {
  const { total, contacted, noResponse, replied, closed } = kpi();
  const cards = [
    ['Leads', total], ['Contacted', contacted], ['No response', noResponse], ['Replied', replied], ['Closed won', closed]
  ];
  document.getElementById('kpi-grid').innerHTML = cards.map(([k,v]) => `<div class="kpi glass"><span>${k}</span><strong>${v}</strong></div>`).join('');

  const focus = [
    'Outreach: Send first-touch to top 3 high-intent leads.',
    'Build: Improve one landing page CTA and mobile speed.',
    'Learn: Study 2 winning B2B service hooks and adapt one.'
  ];
  document.getElementById('today-focus').innerHTML = focus.map(i => `<li>${i}</li>`).join('');

  const pipeline = [
    `Open leads: ${total - closed}`,
    `Reply rate: ${total ? Math.round((replied/total)*100) : 0}%`,
    `Close rate: ${replied ? Math.round((closed/replied)*100) : 0}%`
  ];
  document.getElementById('pipeline-snapshot').innerHTML = pipeline.map(i => `<li>${i}</li>`).join('');
}

function renderLeads() {
  const wrap = document.getElementById('lead-list');
  if (!state.leads.length) {
    wrap.innerHTML = '<p class="muted">No leads yet.</p>';
    return;
  }
  wrap.innerHTML = state.leads.map((l, idx) => `
    <div class="list-item">
      <div>
        <strong>${l.business}</strong>
        <p>${l.industry} • ${l.location}</p>
        <small>${l.contact}</small>
      </div>
      <div>
        <span class="pill">${l.status}</span>
        <span class="pill">${l.deal}</span>
        <button class="btn-mini" onclick="markReplied(${idx})">Mark replied</button>
      </div>
    </div>`).join('');

  const select = document.getElementById('outreach-lead');
  select.innerHTML = '<option value="">Select lead</option>' + state.leads
    .filter(l => l.status === 'Not contacted')
    .map((l, i) => `<option value="${i}">${l.business} (${l.location})</option>`).join('');
}

window.markReplied = (idx) => {
  state.leads[idx].status = 'Replied';
  state.leads[idx].deal = 'Interested';
  save();
  renderAll();
};

function renderFollowups() {
  const due = state.leads.filter(l => (l.status === 'Contacted' || l.status === 'No response') && l.followups < 2 && l.deal !== 'Closed Won' && l.deal !== 'Closed Lost');
  const wrap = document.getElementById('followup-list');
  if (!due.length) {
    wrap.innerHTML = '<p class="muted">No follow-ups due.</p>';
    return;
  }
  wrap.innerHTML = due.map((l, idx) => `
    <div class="list-item">
      <div><strong>${l.business}</strong><p>${l.location}</p></div>
      <div>
        <small>Follow-ups: ${l.followups}/2</small>
        <button class="btn-mini" onclick="sendFollowup('${l.id}')">Send follow-up</button>
      </div>
    </div>`).join('');
}

window.sendFollowup = (id) => {
  const lead = state.leads.find(l => l.id === id);
  if (!lead) return;
  lead.followups += 1;
  lead.status = 'No response';
  if (lead.followups >= 2) {
    lead.deal = 'Closed Lost';
    lead.nextAction = 'Recycle in 60 days';
  } else {
    lead.deal = 'Follow Up Needed';
    lead.nextAction = 'Wait for reply';
  }
  save();
  renderAll();
};

function generateOutreach(lead, variant) {
  const problem = `Most ${lead.industry.toLowerCase()} businesses lose leads because their website does not convert visitors into inquiries.`;
  const observation = variant === 'B' ? `From your presence in ${lead.location}, it looks like there is strong demand but weak conversion flow.` : '';
  return `${problem} ${observation} I help teams fix this with focused UX and messaging changes that increase qualified inquiries. Open to a quick 10-minute look at your current flow?\n\nMoses, Founder of Digital Talisman\ndigitaltalisman.com`;
}

function setupForms() {
  document.getElementById('lead-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.leads.unshift({
      id: crypto.randomUUID(),
      business: fd.get('business'),
      industry: fd.get('industry'),
      location: fd.get('location'),
      contact: fd.get('contact'),
      priority: fd.get('priority'),
      status: 'Not contacted',
      deal: 'New Lead',
      followups: 0,
      nextAction: 'First outreach',
      createdAt: fmtDate()
    });
    e.target.reset();
    save();
    renderAll();
  });

  document.getElementById('outreach-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = document.getElementById('outreach-lead').value;
    const variant = document.getElementById('outreach-variant').value;
    if (idx === '') return;
    const lead = state.leads.filter(l => l.status === 'Not contacted')[idx];
    const msg = generateOutreach(lead, variant);
    document.getElementById('outreach-output').value = msg;
    lead.status = 'Contacted';
    lead.deal = 'Contacted';
    lead.nextAction = 'Wait for reply';
    save();
    renderAll();
  });

  document.getElementById('generate-content').addEventListener('click', () => {
    document.getElementById('linkedin-post').value =
`Most business websites do not have a traffic problem, they have a conversion problem.\n\nIf your homepage does not make the next step obvious, visitors leave even when they are interested.\n\nSimple fix: one clear offer, one clear CTA, one clear trust signal above the fold.\n\nSmall changes like this compound fast.`;

    document.getElementById('reddit-replies').value =
`1) You do not need a full redesign first. Start by fixing your headline and CTA so people instantly know what you do and what to do next. That usually lifts inquiries before bigger changes.\n\n2) If traffic is decent but leads are low, audit your contact path. Too many steps kills intent. Keep the form short and make response time clear.\n\n3) If you share your current page structure, I can point out where conversion is leaking. I do this kind of work a lot, happy to take a look if you want.`;

    document.getElementById('tiktok-idea').value =
`Hook: This site is losing money because the CTA is invisible.\nAngle: Screen-record a homepage critique in 30 seconds, highlight one conversion leak, then show the quick fix.`;
  });

  document.getElementById('seed-demo').addEventListener('click', seedDemo);
  document.getElementById('clear-data').addEventListener('click', () => {
    state.leads = [];
    save();
    renderAll();
  });
}

function seedDemo() {
  if (state.leads.length) return;
  state.leads = [
    { id: crypto.randomUUID(), business: 'Apex Movers', industry: 'Logistics', location: 'Kampala, Uganda', contact: '+2567xxxx', priority: 'High', status: 'Not contacted', deal: 'New Lead', followups: 0, nextAction: 'First outreach', createdAt: fmtDate() },
    { id: crypto.randomUUID(), business: 'Nile Skin Studio', industry: 'Beauty', location: 'Nairobi, Kenya', contact: 'owner@nileskin.co', priority: 'Medium', status: 'Contacted', deal: 'Contacted', followups: 1, nextAction: 'Wait for reply', createdAt: fmtDate() },
    { id: crypto.randomUUID(), business: 'Kikuubo Parts Hub', industry: 'Retail', location: 'Kampala, Uganda', contact: 'info@kikuuboparts.com', priority: 'High', status: 'No response', deal: 'Follow Up Needed', followups: 1, nextAction: 'Follow up due', createdAt: fmtDate() }
  ];
  save();
  renderAll();
}

function renderAll() {
  renderDashboard();
  renderLeads();
  renderFollowups();
}

function init() {
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.tab)));
  setupForms();
  renderAll();
}

init();
