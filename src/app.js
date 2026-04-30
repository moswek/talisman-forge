const db = {
  rooms: JSON.parse(localStorage.getItem('tf_rooms') || '[]'),
  tasks: JSON.parse(localStorage.getItem('tf_tasks') || '[]'),
  terminals: JSON.parse(localStorage.getItem('tf_terminals') || '[]'),
  agents: JSON.parse(localStorage.getItem('tf_agents') || '[]'),
  contexts: JSON.parse(localStorage.getItem('tf_contexts') || '[]')
};

const roomSeeds = [
  { name: 'Command Room', sub: 'Coordinate tasks, terminals, and agent runs in one view.' },
  { name: 'Swarm Room', sub: 'Parallel workers for build, test, and review streams.' },
  { name: 'Review Room', sub: 'Merge outputs and decide what ships.' }
];

function save() {
  localStorage.setItem('tf_rooms', JSON.stringify(db.rooms));
  localStorage.setItem('tf_tasks', JSON.stringify(db.tasks));
  localStorage.setItem('tf_terminals', JSON.stringify(db.terminals));
  localStorage.setItem('tf_agents', JSON.stringify(db.agents));
  localStorage.setItem('tf_contexts', JSON.stringify(db.contexts));
}

function ensureSeeds() {
  if (!db.rooms.length) db.rooms = roomSeeds.map((r, i) => ({ id: crypto.randomUUID(), ...r, active: i === 0 }));
}

function activeRoom() {
  return db.rooms.find(r => r.active) || db.rooms[0];
}

function setActive(id) {
  db.rooms.forEach(r => (r.active = r.id === id));
  save();
  render();
}

function renderRooms() {
  const wrap = document.getElementById('room-list');
  wrap.innerHTML = db.rooms.map(r => `
    <button class="item" style="text-align:left; ${r.active ? 'outline:1px solid #65d6ff;' : ''}" onclick="setRoom('${r.id}')">
      <strong>${r.name}</strong>
      <small>${r.sub}</small>
    </button>`).join('');
  const ar = activeRoom();
  document.getElementById('room-title').textContent = ar.name;
  document.getElementById('room-sub').textContent = ar.sub;
}

function renderList(id, arr, type) {
  const wrap = document.getElementById(id);
  if (!arr.length) return (wrap.innerHTML = '<p class="muted">No items yet.</p>');
  wrap.innerHTML = arr.map(x => `
    <div class="item">
      <strong>${x.title}</strong>
      <small>${x.meta}</small>
      ${type ? `<div style="margin-top:6px;"><button onclick="doneItem('${type}','${x.id}')">Done</button></div>` : ''}
    </div>`).join('');
}

function renderStats() {
  const stats = [
    { k: 'Open tasks', v: db.tasks.length },
    { k: 'Active terminals', v: db.terminals.length },
    { k: 'Running agents', v: db.agents.length }
  ];
  document.getElementById('stats').innerHTML = stats.map(s => `<div class="stat"><span>${s.k}</span><strong>${s.v}</strong></div>`).join('');
}

window.doneItem = (type, id) => {
  db[type] = db[type].filter(x => x.id !== id);
  save();
  render();
};

window.setRoom = setActive;

function addForm(formId, inputId, target, mapper) {
  document.getElementById(formId).addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById(inputId);
    db[target].unshift(mapper(input.value.trim()));
    input.value = '';
    save();
    render();
  });
}

function addContextForm() {
  document.getElementById('context-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('context-title');
    const body = document.getElementById('context-body');
    db.contexts.unshift({ id: crypto.randomUUID(), title: title.value.trim(), meta: body.value.trim().slice(0, 180) + (body.value.length > 180 ? '…' : '') });
    title.value = '';
    body.value = '';
    save();
    render();
  });
}

function bindActions() {
  document.getElementById('new-room').addEventListener('click', () => {
    const n = db.rooms.length + 1;
    db.rooms.forEach(r => (r.active = false));
    db.rooms.unshift({ id: crypto.randomUUID(), name: `Focus Room ${n}`, sub: 'Custom workspace for a specific objective.', active: true });
    save();
    render();
  });

  addForm('task-form', 'task-input', 'tasks', (txt) => ({ id: crypto.randomUUID(), title: txt, meta: `Room: ${activeRoom().name} • status: pending` }));
  addForm('terminal-form', 'terminal-input', 'terminals', (txt) => ({ id: crypto.randomUUID(), title: txt, meta: `Queued in ${activeRoom().name}` }));
  addForm('agent-form', 'agent-input', 'agents', (txt) => ({ id: crypto.randomUUID(), title: txt, meta: `Worker spawned • ${activeRoom().name}` }));
  addContextForm();
}

function render() {
  renderRooms();
  renderList('task-list', db.tasks, 'tasks');
  renderList('terminal-list', db.terminals, 'terminals');
  renderList('agent-list', db.agents, 'agents');
  renderList('context-list', db.contexts, '');
  renderStats();
}

function init() {
  ensureSeeds();
  save();
  bindActions();
  render();
}

init();
