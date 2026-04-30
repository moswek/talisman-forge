const STORAGE_KEY = 'tf_project_v5';
const CMD_TEMPLATES = ['npm run dev', 'npm run build', 'npm test', 'git status', 'git log --oneline -n 8', 'node -v'];
const roomTemplates = [
  { name: 'Command Room', sub: 'Coordinate tasks, terminals, context, and AI workers in one place.' },
  { name: 'Swarm Room', sub: 'Run builders, reviewers, and scouts in parallel with visibility.' },
  { name: 'Review Room', sub: 'Merge outputs and decide what ships.' }
];
const state = { meta: { platform: 'desktop', version: '0.0.0', cwd: '' }, rooms: [], tasks: [], terminals: [], agents: [], contexts: [], timeline: [], reviewNotes: '', ui: { left: 280, right: 340, timelineFilter: 'all' } };
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const shortTime = (iso) => new Date(iso).toLocaleString();

function loadState() { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) Object.assign(state, JSON.parse(raw)); } catch {} }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function toast(message, isError=false) { const el = document.getElementById('toast'); el.textContent = message; el.classList.remove('hidden'); el.classList.toggle('error', isError); setTimeout(()=>el.classList.add('hidden'),2000); }
function pushTimeline(event, detail='') { state.timeline.unshift({ id: id(), event, detail, at: now() }); state.timeline = state.timeline.slice(0, 150); }
function activeRoom() { return state.rooms.find(r=>r.active) || state.rooms[0]; }
function ensureBase() { if (!state.rooms.length) { state.rooms = roomTemplates.map((r,i)=>({ id:id(), ...r, active:i===0, createdAt: now() })); pushTimeline('Room initialized','Base rooms ready'); } }

function setRoomActive(roomId){ state.rooms.forEach(r=>r.active=r.id===roomId); pushTimeline('Room switched', state.rooms.find(r=>r.id===roomId)?.name||roomId); saveState(); renderAll(); }
function createRoom(){ const n=state.rooms.length+1; state.rooms.forEach(r=>r.active=false); state.rooms.unshift({ id:id(), name:`Focus Room ${n}`, sub:'Custom workspace for a milestone.', active:true, createdAt: now()}); pushTimeline('Room created',`Focus Room ${n}`); saveState(); renderAll(); }

function seedDemo(){ if (state.tasks.length||state.terminals.length||state.agents.length||state.contexts.length){ toast('Demo skipped: data exists'); return; }
 const room=activeRoom();
 state.tasks=[{id:id(),roomId:room.id,title:'Define acceptance criteria for release candidate',status:'pending',createdAt:now()},{id:id(),roomId:room.id,title:'Run cross-platform build matrix',status:'in_progress',createdAt:now()}];
 state.agents=[{id:id(),roomId:room.id,title:'Audit keyboard and navigation flow',role:'reviewer',status:'running',createdAt:now()}];
 state.contexts=[{id:id(),title:'Scope',body:'Standalone sidequest app. no agency workflow coupling.',createdAt:now()}];
 pushTimeline('Demo seeded','Loaded tasks/agents/context'); saveState(); renderAll(); }

function addTask(title){ state.tasks.unshift({id:id(),roomId:activeRoom().id,title,status:'pending',createdAt:now()}); pushTimeline('Task added',title); saveState(); renderAll(); }
function cycleTask(taskId){ const t=state.tasks.find(x=>x.id===taskId); if(!t) return; const seq=['pending','in_progress','done']; t.status=seq[(seq.indexOf(t.status)+1)%seq.length]; pushTimeline('Task updated',`${t.title} → ${t.status}`); saveState(); renderAll(); }
function removeTask(taskId){ const t=state.tasks.find(x=>x.id===taskId); state.tasks=state.tasks.filter(x=>x.id!==taskId); pushTimeline('Task removed',t?.title||taskId); saveState(); renderAll(); }

async function startTerminal(item){ if(item.status==='running') return; item.status='starting'; saveState(); renderTerminals();
 const res = await window.forge.terminalStart({ sessionId:item.id, command:item.title, cwd: state.meta.cwd || undefined });
 if(!res?.ok){ item.status='error'; item.output=`${item.output||''}\n[error] ${res?.error||'Failed to start'}`; pushTimeline('Terminal failed',item.title); saveState(); renderAll(); return; }
 item.pid=res.pid; item.status='running'; pushTimeline('Terminal started',`${item.title} (pid ${res.pid})`); saveState(); renderAll(); }

function addTerminal(command){ const item={ id:id(), roomId:activeRoom().id, title:command, status:'queued', output:'', pid:null, createdAt:now() }; state.terminals.unshift(item); pushTimeline('Terminal queued',command); saveState(); renderAll(); startTerminal(item); }
async function stopTerminal(itemId){ const item=state.terminals.find(t=>t.id===itemId); if(!item||item.status!=='running') return; await window.forge.terminalStop({sessionId:itemId}); item.status='stopping'; pushTimeline('Terminal stop requested',item.title); saveState(); renderAll(); }
function removeTerminal(itemId){ const item=state.terminals.find(t=>t.id===itemId); state.terminals=state.terminals.filter(t=>t.id!==itemId); pushTimeline('Terminal removed',item?.title||itemId); saveState(); renderAll(); }
function rerunTerminal(itemId){ const item=state.terminals.find(t=>t.id===itemId); if(!item) return; item.output=''; item.status='queued'; item.pid=null; pushTimeline('Terminal rerun',item.title); saveState(); renderAll(); startTerminal(item); }
function clearTerminalOutput(itemId){ const item=state.terminals.find(t=>t.id===itemId); if(!item) return; item.output=''; saveState(); renderTerminals(); }
function exportTerminalLog(itemId){ const item=state.terminals.find(t=>t.id===itemId); if(!item) return; navigator.clipboard.writeText(item.output||'').then(()=>toast('Terminal log copied')).catch(()=>toast('Copy failed',true)); }

function addAgent(title,role){ state.agents.unshift({id:id(),roomId:activeRoom().id,title,role,status:'running',createdAt:now()}); pushTimeline('Agent spawned',`${role}: ${title}`); saveState(); renderAll(); }
function cycleAgent(itemId){ const a=state.agents.find(x=>x.id===itemId); if(!a) return; const seq=['running','blocked','done']; a.status=seq[(seq.indexOf(a.status)+1)%seq.length]; pushTimeline('Agent updated',`${a.title} → ${a.status}`); saveState(); renderAll(); }
function removeAgent(itemId){ const a=state.agents.find(x=>x.id===itemId); state.agents=state.agents.filter(x=>x.id!==itemId); pushTimeline('Agent removed',a?.title||itemId); saveState(); renderAll(); }

function addContext(title,body){ state.contexts.unshift({id:id(),title,body,createdAt:now()}); pushTimeline('Context added',title); saveState(); renderAll(); }
function removeContext(ctxId){ const c=state.contexts.find(x=>x.id===ctxId); state.contexts=state.contexts.filter(x=>x.id!==ctxId); pushTimeline('Context removed',c?.title||ctxId); saveState(); renderAll(); }
function saveReviewNotes(){ state.reviewNotes=document.getElementById('review-notes').value.trim(); pushTimeline('Review notes saved', state.reviewNotes?'updated':'empty'); saveState(); toast('Review notes saved'); }
function clearReviewNotes(){ state.reviewNotes=''; document.getElementById('review-notes').value=''; pushTimeline('Review notes cleared',''); saveState(); renderAll(); }

async function exportProject(){ const response=await window.forge.saveProject(state); if(response?.ok) toast(`Exported: ${response.filePath}`); }
async function importProject(){ try { const response=await window.forge.openProject(); if(!response?.ok) return; const data=response.data; if(!data||!Array.isArray(data.rooms)) return toast('Invalid project file',true); Object.assign(state,data); ensureBase(); pushTimeline('Project imported',response.filePath); saveState(); renderAll(); toast('Project imported'); } catch { toast('Import failed',true);} }

function renderCmdTemplates(){ const wrap=document.getElementById('cmd-templates'); wrap.innerHTML = CMD_TEMPLATES.map(c=>`<button class="tpl" data-cmd="${c.replace(/"/g,'&quot;')}">${c}</button>`).join(''); wrap.querySelectorAll('.tpl').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('terminal-input').value=btn.dataset.cmd;})); }

function renderRooms(){ const roomList=document.getElementById('room-list'); roomList.innerHTML=state.rooms.map(r=>`<button class="room ${r.active?'active':''}" data-room-id="${r.id}"><strong>${r.name}</strong><small>${r.sub}</small></button>`).join('');
 const room=activeRoom(); document.getElementById('room-title').textContent=room.name; document.getElementById('room-sub').textContent=room.sub;
 roomList.querySelectorAll('.room').forEach(btn=>btn.addEventListener('click',()=>setRoomActive(btn.dataset.roomId))); }

function renderTasks(){ const room=activeRoom(); const tasks=state.tasks.filter(t=>t.roomId===room.id); document.getElementById('task-open-count').textContent=`${tasks.filter(t=>t.status!=='done').length} open`; const wrap=document.getElementById('task-list'); if(!tasks.length) return wrap.innerHTML='<p class="muted">No tasks yet.</p>';
 wrap.innerHTML=tasks.map(t=>`<div class="item"><div><strong>${t.title}</strong><small>${t.status} • ${shortTime(t.createdAt)}</small></div><div class="item-actions"><button data-task-cycle="${t.id}">Next</button><button data-task-remove="${t.id}" class="danger ghost">X</button></div></div>`).join('');
 wrap.querySelectorAll('[data-task-cycle]').forEach(b=>b.addEventListener('click',()=>cycleTask(b.dataset.taskCycle))); wrap.querySelectorAll('[data-task-remove]').forEach(b=>b.addEventListener('click',()=>removeTask(b.dataset.taskRemove))); }

function terminalClass(status){ if(status==='running')return'running'; if(status==='done')return'done'; if(status==='error')return'error'; return''; }
function renderTerminals(){ const room=activeRoom(); const rows=state.terminals.filter(x=>x.roomId===room.id); const wrap=document.getElementById('terminal-list'); if(!rows.length) return wrap.innerHTML='<p class="muted">No terminal sessions queued.</p>';
 wrap.innerHTML=rows.map(x=>`<div class="item terminal ${terminalClass(x.status)}"><div><strong>${x.title}</strong><small>${x.status}${x.pid?` • pid ${x.pid}`:''} • ${shortTime(x.createdAt)}</small></div><pre class="term-output">${(x.output||'').slice(-2500).replace(/</g,'&lt;')}</pre><div class="item-actions"><button data-term-start="${x.id}">Run</button><button data-term-stop="${x.id}">Stop</button><button data-term-rerun="${x.id}">Rerun</button><button data-term-clear="${x.id}">Clear</button><button data-term-copy="${x.id}">Copy Log</button><button data-term-remove="${x.id}" class="danger ghost">X</button></div></div>`).join('');
 wrap.querySelectorAll('[data-term-start]').forEach(b=>b.addEventListener('click',()=>{const item=state.terminals.find(t=>t.id===b.dataset.termStart); if(item) startTerminal(item);}));
 wrap.querySelectorAll('[data-term-stop]').forEach(b=>b.addEventListener('click',()=>stopTerminal(b.dataset.termStop)));
 wrap.querySelectorAll('[data-term-rerun]').forEach(b=>b.addEventListener('click',()=>rerunTerminal(b.dataset.termRerun)));
 wrap.querySelectorAll('[data-term-clear]').forEach(b=>b.addEventListener('click',()=>clearTerminalOutput(b.dataset.termClear)));
 wrap.querySelectorAll('[data-term-copy]').forEach(b=>b.addEventListener('click',()=>exportTerminalLog(b.dataset.termCopy)));
 wrap.querySelectorAll('[data-term-remove]').forEach(b=>b.addEventListener('click',()=>removeTerminal(b.dataset.termRemove))); }

function renderAgents(){ const room=activeRoom(); const rows=state.agents.filter(x=>x.roomId===room.id); const wrap=document.getElementById('agent-list'); if(!rows.length) return wrap.innerHTML='<p class="muted">No active workers.</p>';
 wrap.innerHTML=rows.map(x=>`<div class="item"><div><strong>${x.title}</strong><small>${x.role} • ${x.status} • ${shortTime(x.createdAt)}</small></div><div class="item-actions"><button data-agent-cycle="${x.id}">Cycle</button><button data-agent-remove="${x.id}" class="danger ghost">X</button></div></div>`).join('');
 wrap.querySelectorAll('[data-agent-cycle]').forEach(b=>b.addEventListener('click',()=>cycleAgent(b.dataset.agentCycle))); wrap.querySelectorAll('[data-agent-remove]').forEach(b=>b.addEventListener('click',()=>removeAgent(b.dataset.agentRemove))); }

function renderContexts(){ const wrap=document.getElementById('context-list'); if(!state.contexts.length) return wrap.innerHTML='<p class="muted">No pinned context yet.</p>';
 wrap.innerHTML=state.contexts.map(c=>`<div class="item"><div><strong>${c.title}</strong><small>${c.body}</small></div><div class="item-actions"><button data-ctx-remove="${c.id}" class="danger ghost">X</button></div></div>`).join('');
 wrap.querySelectorAll('[data-ctx-remove]').forEach(b=>b.addEventListener('click',()=>removeContext(b.dataset.ctxRemove))); }

function renderTimeline(){ const wrap=document.getElementById('timeline-list'); const filter=state.ui.timelineFilter||'all'; let events=state.timeline; if(filter!=='all') events=events.filter(e=>e.event.startsWith(filter)); if(!events.length) return wrap.innerHTML='<p class="muted">No timeline events yet.</p>';
 wrap.innerHTML=events.slice(0,30).map(t=>`<div class="item timeline-item"><strong>${t.event}</strong><small>${t.detail||'-'}<br>${shortTime(t.at)}</small></div>`).join(''); }

function renderStats(){ const room=activeRoom(); const roomTasks=state.tasks.filter(t=>t.roomId===room.id); const roomTerminals=state.terminals.filter(t=>t.roomId===room.id); const roomAgents=state.agents.filter(t=>t.roomId===room.id);
 const stats=[['Open tasks',roomTasks.filter(t=>t.status!=='done').length],['Running terminals',roomTerminals.filter(t=>t.status==='running').length],['Agents running',roomAgents.filter(t=>t.status==='running').length],['Pinned context',state.contexts.length]];
 document.getElementById('stats').innerHTML=stats.map(([k,v])=>`<div class="stat"><span>${k}</span><strong>${v}</strong></div>`).join(''); }

function renderMeta(){ document.getElementById('meta-version').textContent=`v${state.meta.version}`; document.getElementById('meta-platform').textContent=state.meta.platform; document.getElementById('review-notes').value=state.reviewNotes||''; const layout=document.getElementById('layout'); layout.style.setProperty('--left-width', `${state.ui.left}px`); layout.style.setProperty('--right-width', `${state.ui.right}px`); document.getElementById('timeline-filter').value=state.ui.timelineFilter||'all'; }

function renderAll(){ renderMeta(); renderCmdTemplates(); renderRooms(); renderTasks(); renderTerminals(); renderAgents(); renderContexts(); renderTimeline(); renderStats(); }

function bindForms(){
 document.getElementById('task-form').addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('task-input');const v=input.value.trim(); if(!v) return; addTask(v); input.value='';});
 document.getElementById('terminal-form').addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('terminal-input');const v=input.value.trim(); if(!v) return; addTerminal(v); input.value='';});
 document.getElementById('agent-form').addEventListener('submit',e=>{e.preventDefault();const input=document.getElementById('agent-input');const role=document.getElementById('agent-role').value;const v=input.value.trim(); if(!v) return; addAgent(v,role); input.value='';});
 document.getElementById('context-form').addEventListener('submit',e=>{e.preventDefault();const title=document.getElementById('context-title');const body=document.getElementById('context-body'); if(!title.value.trim()||!body.value.trim()) return; addContext(title.value.trim(),body.value.trim()); title.value=''; body.value='';});
 document.getElementById('timeline-filter').addEventListener('change',e=>{ state.ui.timelineFilter=e.target.value; saveState(); renderTimeline(); });
}

function bindResizers(){
 const layout=document.getElementById('layout');
 const left=document.getElementById('left-rail');
 const right=document.getElementById('right-rail');
 const rzLeft=document.getElementById('resizer-left');
 const rzRight=document.getElementById('resizer-right');
 const start=(side,e)=>{
   e.preventDefault();
   const startX=e.clientX; const leftStart=left.getBoundingClientRect().width; const rightStart=right.getBoundingClientRect().width;
   const move=(ev)=>{ if(side==='left'){ state.ui.left=Math.min(420,Math.max(220,leftStart+(ev.clientX-startX))); } else { state.ui.right=Math.min(520,Math.max(260,rightStart-(ev.clientX-startX))); } layout.style.setProperty('--left-width',`${state.ui.left}px`); layout.style.setProperty('--right-width',`${state.ui.right}px`); };
   const up=()=>{ document.removeEventListener('mousemove',move); document.removeEventListener('mouseup',up); saveState(); };
   document.addEventListener('mousemove',move); document.addEventListener('mouseup',up);
 };
 rzLeft.addEventListener('mousedown',(e)=>start('left',e));
 rzRight.addEventListener('mousedown',(e)=>start('right',e));
}

function bindActions(){ document.getElementById('new-room').addEventListener('click',createRoom); document.getElementById('seed-demo').addEventListener('click',seedDemo); document.getElementById('save-review').addEventListener('click',saveReviewNotes); document.getElementById('clear-review').addEventListener('click',clearReviewNotes); document.getElementById('export-project').addEventListener('click',exportProject); document.getElementById('import-project').addEventListener('click',importProject);
 document.addEventListener('keydown',(e)=>{ const mod=e.metaKey||e.ctrlKey; if(mod&&e.key.toLowerCase()==='s'){e.preventDefault(); exportProject();} if(mod&&e.key.toLowerCase()==='o'){e.preventDefault(); importProject();} if(mod&&e.key.toLowerCase()==='k'){e.preventDefault(); document.getElementById('terminal-input').focus();} });
}

function bindTerminalEvents(){ if(!window.forge?.onTerminalEvent) return; window.forge.onTerminalEvent((evt)=>{ const item=state.terminals.find(t=>t.id===evt.sessionId); if(!item) return;
 if(evt.type==='start'){ item.status='running'; item.pid=evt.pid; }
 else if(evt.type==='stdout'||evt.type==='stderr'){ item.output=`${item.output||''}${evt.chunk}`; }
 else if(evt.type==='exit'){ item.status=evt.code===0?'done':'error'; item.output=`${item.output||''}\n[process exited ${evt.code}]`; item.pid=null; pushTimeline('Terminal finished',`${item.title} (code ${evt.code})`); }
 else if(evt.type==='error'){ item.status='error'; item.output=`${item.output||''}\n[error] ${evt.error}`; item.pid=null; pushTimeline('Terminal error',item.title); }
 saveState(); renderTerminals(); renderStats(); renderTimeline(); }); }

async function hydrateMeta(){ try { const meta=await window.forge.getMeta(); state.meta={ platform:meta.platform, version:meta.version, cwd:meta.cwd||'' }; } catch {} }

async function checkUpdates(){
  if (!window.forge?.checkForUpdates) return;
  try {
    const res = await window.forge.checkForUpdates();
    if (res?.ok && res.updateAvailable) {
      pushTimeline('Update available', `v${res.latestVersion}`);
      toast(`Update available: v${res.latestVersion}`);
    } else if (res?.ok) {
      pushTimeline('Update check', `up-to-date (${res.currentVersion})`);
    } else {
      pushTimeline('Update check failed', res?.error || 'unknown error');
    }
  } catch (e) {
    pushTimeline('Update check failed', e.message || 'unknown error');
  }
}

async function init(){ loadState(); ensureBase(); await hydrateMeta(); await checkUpdates(); bindForms(); bindActions(); bindResizers(); bindTerminalEvents(); saveState(); renderAll(); }

init();