// EQUALITY TRAINING — APP.JS

// ---- Tab Switching ----
function switchTab(name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
  document.getElementById('panel-' + name).classList.add('active');
  const btn = document.getElementById('tab-' + name);
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected','true'); }
  // When switching to events, always show selector
  if (name === 'events') closeEvent();
  if (name === 'roster') { renderRoster(); updateAnalytics(); }
  if (name === 'templates') renderTemplates();
  if (name === 'routine') renderRoutine();
}

// ---- Toast ----
let _toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-text').textContent = msg || 'Copied!';
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
}

// ---- Copy ----
async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }
  showToast('Copied to clipboard!');
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = btn.classList.contains('copy-btn') ? '✓ Copied!' : '✓';
  btn.classList.add('copied');
  setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1800);
}

function copyLine(btn) {
  const content = btn.closest('.line-item').querySelector('.line-content');
  copyText((content.innerText || content.textContent).trim(), btn);
}

// ---- Event System ----
const EVENTS = {

  ffa: {
    icon: '⚔️', name: 'FFA', full: 'Free For All',
    desc: 'All attendees go into the pit and fight. Last person standing wins and stands beside the trainer. Run up to 2 FFAs to get 2 team captains for Gladiators or TDM.',
    config: [
      { id: 'ffa-round', label: 'Rounds', type: 'select', options: ['1 Round','2 Rounds'] },
      { id: 'ffa-winner', label: 'Round 1 Winner', type: 'text', placeholder: 'e.g. PlayerName' },
    ],
    buildLines: () => {
      const r2 = document.getElementById('ffa-round')?.value === '2 Rounds';
      const w = document.getElementById('ffa-winner')?.value.trim() || '[Winner]';
      const tpl = (getTemplate('ffa') || '').split('\n').filter(l => l.trim().length > 0);
      
      const lines = [];
      // Use template for initial lines
      tpl.forEach((line, i) => lines.push({ n: (i+1).toString(), text: line, cls: '' }));

      if (r2) {
        lines.push({ n:'—', text:'── Round 1 End (Custom) ──', cls:'divider' });
        lines.push({ n:'W', text: winnerHTML(w) + ' stand beside me.', cls:'winner-line' });
      } else {
        lines.push({ n:'—', text:'── FFA End (Custom) ──', cls:'divider' });
        lines.push({ n:'W', text: winnerHTML(w) + ' you are the winner!', cls:'winner-line' });
      }
      return lines;
    },
    fullScript: () => getTemplate('ffa')
  },

  glads: {
    icon: '🛡️', name: 'Gladiators', full: 'Gladiators (Glads)',
    desc: '2 captains pick teams and set an order. Players from each team go into the pit one at a time. The winner stays down and keeps fighting. The next player from the losing side enters. FT2 or FT3.',
    config: [
      { id: 'glads-ft', label: 'Format', type: 'select', options: ['FT2','FT3'] },
      { id: 'glads-cap1', label: 'Captain 1', type: 'text', placeholder: 'e.g. PlayerA' },
      { id: 'glads-cap2', label: 'Captain 2', type: 'text', placeholder: 'e.g. PlayerB' },
      { id: 'glads-order', label: 'Team Orders', type: 'textarea', placeholder: 'e.g. Team 1: P1, P2\nTeam 2: P3, P4' },
    ],
    buildLines: () => {
      const ft  = document.getElementById('glads-ft')?.value || 'FT2';
      const c1  = document.getElementById('glads-cap1')?.value.trim() || '[Captain 1]';
      const c2  = document.getElementById('glads-cap2')?.value.trim() || '[Captain 2]';
      const tpl = (getTemplate('glads') || '')
        .replace(/\[Captain 1\]/g, c1).replace(/\[Captain 2\]/g, c2).replace(/\[Format\]/g, ft)
        .split('\n').filter(l => l.trim().length > 0);
      
      const lines = [];
      tpl.forEach((line, i) => lines.push({ n: (i+1).toString(), text: line, cls: '' }));
      return lines;
    },
    fullScript: () => getTemplate('glads')
  },

  tdm: {
    icon: '💥', name: 'TDM', full: 'Team Deathmatch',
    desc: '2 captains pick teams. Both teams ally up and go to their respective sides. The team with the last players standing scores a point. FT2 or FT3.',
    config: [
      { id: 'tdm-ft', label: 'Format', type: 'select', options: ['FT2','FT3'] },
      { id: 'tdm-cap1', label: 'Captain 1', type: 'text', placeholder: 'e.g. PlayerA' },
      { id: 'tdm-cap2', label: 'Captain 2', type: 'text', placeholder: 'e.g. PlayerB' },
      { id: 'tdm-score', label: 'Live Score', type: 'custom', render: () => `
        <div class="score-tracker">
          <div class="score-team">
            <span class="score-val" id="score-1">0</span>
            <div class="score-btns">
              <button class="icon-btn" onclick="updateScore(1, 1)">+</button>
              <button class="icon-btn" onclick="updateScore(1, -1)">-</button>
            </div>
          </div>
          <div class="score-vs">VS</div>
          <div class="score-team">
            <span class="score-val" id="score-2">0</span>
            <div class="score-btns">
              <button class="icon-btn" onclick="updateScore(2, 1)">+</button>
              <button class="icon-btn" onclick="updateScore(2, -1)">-</button>
            </div>
          </div>
          <button class="btn-reset" onclick="updateScore(0, 0)" title="Reset Score">↺</button>
        </div>` }
    ],
    buildLines: () => {
      const ft  = document.getElementById('tdm-ft')?.value || 'FT2';
      const c1  = document.getElementById('tdm-cap1')?.value.trim() || '[Captain 1]';
      const c2  = document.getElementById('tdm-cap2')?.value.trim() || '[Captain 2]';
      const s1  = document.getElementById('score-1')?.textContent || '0';
      const s2  = document.getElementById('score-2')?.textContent || '0';
      const tpl = (getTemplate('tdm') || '')
        .replace(/\[Captain 1\]/g, c1).replace(/\[Captain 2\]/g, c2).replace(/\[Format\]/g, ft)
        .split('\n').filter(l => l.trim().length > 0);
      
      const lines = [];
      tpl.forEach((line, i) => lines.push({ n: (i+1).toString(), text: line, cls: '' }));

      if (s1 !== '0' || s2 !== '0') {
        lines.push({ n:'—', text:'── Live Score Update ──', cls:'divider' });
        lines.push({ n:'📈', text: `The current score is ${s1} - ${s2}.`, cls:'info-line' });
      }
      return lines;
    },
    fullScript: () => getTemplate('tdm')
  },

  tournament: {
    icon: '🏆', name: 'Tournament', full: 'Tournament (Bracket Mode)',
    desc: 'Generate a professional 1v1 bracket (4, 8, or 16 players). Click on a player\'s name in the visualizer to advance them to the next round!',
    config: [
      { id: 'tourn-players', label: 'Participants', type: 'textarea', placeholder: 'Paste player names here (one per line)...' },
      { id: 'tourn-gen', label: 'Actions', type: 'custom', render: () => `
        <div style="display:flex; gap:10px;">
          <button class="btn-primary" onclick="initTournament()" style="flex:2">🎲 Generate Visual Bracket</button>
          <button class="btn-reset" onclick="resetTournament()" title="Clear Bracket">↺</button>
        </div>` },
      { id: 'tourn-visual', label: 'Bracket View', type: 'custom', render: () => `<div id="bracket-view" class="bracket-view"></div>` }
    ],
    state: { rounds: [], currentMatch: { r:0, m:0 } },
    buildLines: () => {
      const rounds = EVENTS.tournament.state.rounds || [];
      const lines = [
        { n:'1', text:'We will now be doing a Tournament.', cls:'' },
        { n:'📜', text:'Rules: STS in safezone upon death. No attacking in safezone.', cls:'info-line' },
      ];

      if (rounds.length > 0) {
        let champion = null;
        const lastRound = rounds[rounds.length - 1];
        if (lastRound && lastRound[0] && lastRound[0][0]) champion = lastRound[0][0];

        if (champion) {
          lines.push({ n:'🏆', text: `Congratulations to ${winnerHTML(champion)} for winning the tournament!`, cls:'winner-line' });
        } else {
          lines.push({ n:'—', text:'── ACTIVE MATCHES ──', cls:'divider' });
          
          let foundActive = false;
          // Loop through rounds to find the first round that has "playable" matches
          for (let rIdx = 0; rIdx < rounds.length; rIdx++) {
            const matches = rounds[rIdx];
            const playableInRound = [];
            
            for (let mIdx = 0; mIdx < matches.length; mIdx++) {
              const m = matches[mIdx];
              // Playable if both slots are filled and no winner is in the next round yet
              if (m[0] && m[1] && m[0] !== 'BYE' && m[1] !== 'BYE') {
                let alreadyAdvanced = false;
                if (rIdx + 1 < rounds.length) {
                  const nextMIdx = Math.floor(mIdx / 2);
                  const nextSIdx = mIdx % 2;
                  const nextVal = rounds[rIdx + 1][nextMIdx][nextSIdx];
                  if (nextVal === m[0] || nextVal === m[1]) alreadyAdvanced = true;
                }
                if (!alreadyAdvanced) playableInRound.push(m);
              }
            }

            if (playableInRound.length > 0) {
              playableInRound.forEach((m, i) => {
                lines.push({ n: (i+1).toString(), text: `${m[0]} VS ${m[1]}`, cls: 'match-line' });
                lines.push({ n: '⚡', text: '3... 2... 1... GO!', cls: 'small-line' });
              });
              foundActive = true;
              break; // Only show one round's matches at a time
            }
          }

          if (!foundActive) {
            lines.push({ n:'💡', text: 'Click on winners in the bracket above to advance!', cls:'info-line' });
          }
        }
      } else {
        lines.push({ n:'💡', text: 'Paste names and click "Generate" to see the visual bracket.', cls:'info-line' });
      }
      return lines;
    },
    fullScript: () => `We will now be doing a Tournament.\nWinner stands on the right side. Loser stands on the left side.\nRules: STS in safezone upon death.\n3... 2... 1... GO!`
  },

  koth: {
    icon: '👑', name: 'KOTH', full: 'King Of The Hill',
    desc: 'Players form a single file line (SFL) in the arena safe zone. The 2 players at the front fight in the pit. The winner stays down; the loser joins the back of the line. The player who stays in the pit the longest wins.',
    config: [],
    buildLines: () => [
      { n:'1', text:'We will now be doing KOTH (King Of The Hill).', cls:'' },
      { n:'2', text:'Please make a SFL (Single File Line) in the arena safe zone.', cls:'' },
      { n:'3', text:'The 2 players at the front of the line will go down into the pit and fight.', cls:'' },
      { n:'4', text:'The winner stays down and continues fighting. The loser joins the back of the line.', cls:'' },
      { n:'5', text:'The next person at the front of the line will then drop down into the pit. This will repeat.', cls:'' },
      { n:'6', text:'Whoever is in the pit for the longest time wins the overall round.', cls:'' },
      { n:'📜', text:'Rules: No attacking while in the safe zone. STS when waiting in line.', cls:'info-line' },
      { n:'7', text:'Is everyone ready? 3... 2... 1... GO!', cls:'' },
      { n:'—', text:'── Ongoing until trainer calls it ──', cls:'divider' },
      { n:'8', text:'KOTH is now over! Well done to everyone who participated.', cls:'' },
    ],
    fullScript: () => `We will now be doing KOTH (King Of The Hill).\nPlease make a SFL (Single File Line) in the arena safe zone.\nThe 2 players at the front of the line will go down into the pit and fight.\nThe winner stays down and continues fighting. The loser joins the back of the line.\nThe next person at the front will drop down. This repeats until I call it.\nWhoever is in the pit for the longest time wins.\nRules: No attacking while in the safe zone. STS when waiting in line.\n3... 2... 1... GO!`
  },

  jugg: {
    icon: '💀', name: 'Juggernaut', full: 'Juggernaut (Jugg)',
    desc: '1 player is selected as the Juggernaut with 10 lives. If they die 10 times, participants win. If they wipe the server first, they win.',
    config: [
      { id: 'jugg-player', label: 'Juggernaut', type: 'text', placeholder: 'e.g. PlayerName' },
      { id: 'jugg-lives', label: 'Life Tracker', type: 'custom', render: () => `
        <div class="iq-tracker">
          <span class="iq-label">❤️ Lives:</span>
          <span class="iq-val" id="jugg-lives-val">10</span>
          <div class="score-btns">
            <button class="icon-btn" onclick="updateJuggLives(-1)">-</button>
            <button class="icon-btn" onclick="updateJuggLives(1)">+</button>
          </div>
          <button class="btn-reset" onclick="updateJuggLives(10, true)" title="Reset Lives">↺</button>
        </div>` }
    ],
    buildLines: () => {
      const p = document.getElementById('jugg-player')?.value.trim() || '[Juggernaut]';
      const lv = document.getElementById('jugg-lives-val')?.textContent || '10';
      const lines = [
        { n:'1', text:'We will now be doing Juggernaut.', cls:'' },
        { n:'2', text: winnerHTML(p) + ' has been selected as the Juggernaut.', cls:'winner-line' },
        { n:'3', text:`The Juggernaut has 10 lives. Currently at: ${lv}/10.`, cls:'info-line' },
        { n:'📜', text:'Rules: STS in safezone upon death. No attacking in safezone.', cls:'info-line' },
        { n:'4', text:'3... 2... 1... GO!', cls:'' },
      ];
      if (lv === '0') {
        lines.push({ n:'—', text:'── Game Over ──', cls:'divider' });
        lines.push({ n:'🏆', text: 'The participants have defeated the Juggernaut!', cls:'winner-line' });
      }
      return lines;
    },
    fullScript: () => `We will now be doing Juggernaut.\n${p} has been selected as the Juggernaut.\nThe Juggernaut has 10 lives.\nRules: STS in safezone upon death.\n3... 2... 1... GO!`
  },

  hg: {
    icon: '🌿', name: 'Hunger Games', full: 'Hunger Games (HG)',
    desc: 'Players hide in Ghoul or CCG side for a grace period. Use the IQ Randomizer below to assign initial sides if you want.',
    config: [
      { id: 'hg-players', label: 'Participants', type: 'textarea', placeholder: 'Paste players to randomize sides...' },
      { id: 'hg-rand', label: 'Randomizer', type: 'custom', render: () => `<button class="btn-primary" onclick="randomizeHGSides()" style="width:100%">🎭 Assign Random Sides</button>` }
    ],
    state: { assignments: [] },
    buildLines: () => {
      const ass = EVENTS.hg.state.assignments || [];
      const lines = [
        { n:'1', text:'We will now be doing Hunger Games (HG).', cls:'' },
        { n:'2', text:'Please leave the arena and hide in the side of the map.', cls:'' },
        { n:'📜', text:'Rules: STS in safe-zone upon death. No attacking in safe-zone.', cls:'info-line' },
      ];

      if (ass.length > 0) {
        lines.push({ n:'—', text:'── SIDE ASSIGNMENTS ──', cls:'divider' });
        const ghouls = ass.filter(a => a.side === 'Ghoul').map(a => a.name).join(', ');
        const ccgs = ass.filter(a => a.side === 'CCG').map(a => a.name).join(', ');
        lines.push({ n:'👹', text: `Ghouls (Hide in Ghoul Area): ${ghouls}`, cls:'' });
        lines.push({ n:'⚔️', text: `CCGs (Hide in CCG Area): ${ccgs}`, cls:'' });
        lines.push({ n:'⚡', text: 'Go hide now! PVP ON in 5 minutes.', cls: 'small-line' });
      }
      return lines;
    },
    fullScript: () => `We will now be doing Hunger Games (HG).\nPlease leave the arena and hide.\nRules: STS in safe-zone upon death.\n3... 2... 1... GO!`
  }
};

// ---- Helpers ----
function winnerHTML(name) {
  const safe = escHTML(name);
  return `<span class="winner-hl">${safe}</span>`;
}
function escHTML(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s));
  return d.innerHTML;
}

// ---- Open/Close Event ----
let _currentEvent = null;

function openEvent(key) {
  _currentEvent = key;
  const ev = EVENTS[key];
  document.getElementById('event-selector').style.display = 'none';
  const ep = document.getElementById('event-panel');
  ep.classList.remove('hidden');

  // Build config HTML
  let configHTML = '';
  if (ev.config && ev.config.length > 0) {
    const rows = ev.config.map(c => {
      if (c.type === 'select') {
        const opts = c.options.map(o => `<option value="${o}">${o}</option>`).join('');
        return `<div class="config-row">
          <span class="config-label">${c.label}</span>
          <select id="${c.id}" class="field-select" onchange="refreshEventLines()">${opts}</select>
        </div>`;
      } else if (c.type === 'textarea') {
        return `<div class="config-row" style="align-items: flex-start;">
          <span class="config-label" style="margin-top: 8px;">${c.label}</span>
          <textarea id="${c.id}" class="field-input field-textarea" placeholder="${c.placeholder||''}" oninput="refreshEventLines()" aria-label="${c.label}" style="width:100%; min-height: 80px;"></textarea>
        </div>`;
      } else if (c.type === 'custom') {
        return `<div class="config-row">
          <span class="config-label">${c.label}</span>
          <div style="flex:1">${c.render()}</div>
        </div>`;
      } else {
        return `<div class="config-row">
          <span class="config-label">${c.label}</span>
          <input type="text" id="${c.id}" class="field-input" placeholder="${c.placeholder||''}" oninput="refreshEventLines()" aria-label="${c.label}" style="width:200px"/>
        </div>`;
      }
    }).join('');
    configHTML = `<div class="config-section">${rows}</div>`;
  }

  document.getElementById('event-content').innerHTML = `
    <div class="ev-header">
      <div class="ev-title">${ev.icon} ${ev.name} <span class="ev-badge">${ev.full}</span></div>
      <p class="ev-desc">${ev.desc}</p>
    </div>
    ${configHTML}
    <div class="copy-all-row">
      <button class="btn-primary" onclick="copyEventScript()">⚡ Copy Full Script</button>
    </div>
    <div class="lines-list" id="ev-lines"></div>
  `;
  refreshEventLines();
}

function closeEvent() {
  _currentEvent = null;
  document.getElementById('event-selector').style.display = '';
  document.getElementById('event-panel').classList.add('hidden');
}

function refreshEventLines() {
  if (!_currentEvent) return;
  const ev = EVENTS[_currentEvent];
  const lines = ev.buildLines();
  const container = document.getElementById('ev-lines');
  if (!container) return;
  container.innerHTML = lines.map(l => {
    if (l.cls === 'divider') {
      return `<div class="section-divider">${l.text}</div>`;
    }
    const copyVal = l.text.replace(/<[^>]+>/g,''); // strip html for clipboard
    return `<div class="line-item ${l.cls||''}">
      <div class="line-num">${l.n}</div>
      <div class="line-content">${l.text}</div>
      <button class="line-copy-btn" onclick="copyLineRaw(this,'${escHTML(copyVal).replace(/'/g,"&#39;")}')" title="Copy line">📋</button>
    </div>`;
  }).join('');
}

function copyLineRaw(btn, text) {
  // Decode HTML entities before copy
  const ta = document.createElement('textarea');
  ta.innerHTML = text;
  copyText(ta.value, btn);
}

function copyEventScript() {
  if (!_currentEvent) return;
  const ev = EVENTS[_currentEvent];
  copyText(ev.fullScript(), null);
}

// ---- IQ Features Helpers ----
function updateScore(team, delta) {
  if (team === 0) {
    document.getElementById('score-1').textContent = '0';
    document.getElementById('score-2').textContent = '0';
  } else {
    const el = document.getElementById('score-' + team);
    let val = parseInt(el.textContent) + delta;
    if (val < 0) val = 0;
    el.textContent = val;
  }
  refreshEventLines();
}

function initTournament() {
  const input = document.getElementById('tourn-players');
  if (!input) return;
  const names = input.value.replace(/,/g, '\n').split('\n').map(n => n.trim()).filter(n => n.length > 0);
  if (names.length < 2) { showToast('Need at least 2 players!'); return; }

  shuffleArray(names);
  
  // Calculate power of 2 bracket size
  const size = Math.pow(2, Math.ceil(Math.log2(names.length)));
  const roundsCount = Math.log2(size);
  
  const rounds = [];
  // Round 1
  const r1 = [];
  for (let i = 0; i < size; i += 2) {
    const p1 = names[i] || 'BYE';
    const p2 = names[i+1] || 'BYE';
    r1.push([p1, p2]);
  }
  rounds.push(r1);

  // Future Rounds (empty slots)
  for (let r = 1; r < roundsCount; r++) {
    const sub = [];
    const count = size / Math.pow(2, r + 1);
    for (let m = 0; m < count; m++) sub.push([null, null]);
    rounds.push(sub);
  }

  EVENTS.tournament.state.rounds = rounds;
  renderBracketView();
  refreshEventLines();
  showToast('Tournament tree generated!');
}

function resetTournament() {
  EVENTS.tournament.state.rounds = [];
  renderBracketView();
  refreshEventLines();
}

function renderBracketView() {
  const container = document.getElementById('bracket-view');
  if (!container) return;
  const rounds = EVENTS.tournament.state.rounds || [];
  if (rounds.length === 0) { container.innerHTML = ''; return; }

  container.innerHTML = rounds.map((r, rIdx) => {
    const matches = r.map((m, mIdx) => {
      // Slot 1
      const s1 = `<div class="br-slot ${m[0]?'filled':''}" onclick="advanceWinner(${rIdx}, ${mIdx}, 0)">${m[0]||'TBD'}</div>`;
      // Slot 2
      const s2 = `<div class="br-slot ${m[1]?'filled':''}" onclick="advanceWinner(${rIdx}, ${mIdx}, 1)">${m[1]||'TBD'}</div>`;
      return `<div class="br-match"><div class="br-label">Match ${mIdx+1}</div>${s1}${s2}</div>`;
    }).join('');
    
    return `<div class="br-round"><div class="br-round-title">Round ${rIdx+1}</div>${matches}</div>`;
  }).join('');
}

function advanceWinner(rIdx, mIdx, pIdx) {
  const rounds = EVENTS.tournament.state.rounds;
  const winner = rounds[rIdx][mIdx][pIdx];
  if (!winner || winner === 'BYE' || winner === 'TBD') return;

  // Is there a next round?
  if (rIdx + 1 < rounds.length) {
    const nextMatchIdx = Math.floor(mIdx / 2);
    const nextSlotIdx = mIdx % 2;
    rounds[rIdx+1][nextMatchIdx][nextSlotIdx] = winner;
    showToast(`${winner} advanced!`);
  } else {
    showToast(`${winner} IS THE CHAMPION!`);
  }

  renderBracketView();
  refreshEventLines();
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function updateJuggLives(delta, reset=false) {
  const el = document.getElementById('jugg-lives-val');
  if (reset) { el.textContent = delta; }
  else {
    let val = parseInt(el.textContent) + delta;
    if (val < 0) val = 0;
    el.textContent = val;
  }
  refreshEventLines();
}

function randomizeHGSides() {
  const input = document.getElementById('hg-players');
  if (!input) return;
  const names = input.value.replace(/,/g, '\n').split('\n').map(n => n.trim()).filter(n => n.length > 0);
  if (names.length === 0) return;
  
  shuffleArray(names);
  const assignments = names.map((name, i) => ({
    name,
    side: i < names.length / 2 ? 'Ghoul' : 'CCG'
  }));
  
  EVENTS.hg.state.assignments = assignments;
  refreshEventLines();
  showToast('Sides assigned evenly!');
}

// ---- Custom Messages ----
const STORE = 'equality-training-v1';
function loadMsgs() { try { return JSON.parse(localStorage.getItem(STORE)) || []; } catch { return []; } }
function saveMsgs(m) { localStorage.setItem(STORE, JSON.stringify(m)); }

function renderCustom() {
  const list  = document.getElementById('custom-list');
  const empty = document.getElementById('custom-empty');
  const msgs  = loadMsgs();
  list.querySelectorAll('.custom-card').forEach(e => e.remove());
  if (msgs.length === 0) { empty.style.display = ''; return; }
  empty.style.display = 'none';
  msgs.forEach((m, i) => {
    const c = document.createElement('div');
    c.className = 'custom-card';
    c.innerHTML = `
      <div class="custom-card-info">
        <div class="custom-card-label">${escHTML(m.label)}</div>
        <div class="custom-card-text">${escHTML(m.text)}</div>
      </div>
      <div class="custom-card-actions">
        <button class="icon-btn copy" title="Copy">📋</button>
        <button class="icon-btn del" title="Delete">🗑️</button>
      </div>`;
    c.querySelector('.copy').addEventListener('click', function(){ copyText(m.text, this); });
    c.querySelector('.del').addEventListener('click', () => { const a = loadMsgs(); a.splice(i,1); saveMsgs(a); renderCustom(); showToast('Deleted.'); });
    list.appendChild(c);
  });
}

function addCustomMessage() {
  const lbl  = document.getElementById('custom-label').value.trim();
  const text = document.getElementById('custom-text').value.trim();
  if (!text) {
    const ta = document.getElementById('custom-text');
    ta.style.borderColor = 'rgba(239,68,68,.6)';
    ta.focus();
    setTimeout(() => ta.style.borderColor = '', 1500);
    return;
  }
  const msgs = loadMsgs();
  msgs.push({ label: lbl || 'Custom Message', text });
  saveMsgs(msgs);
  document.getElementById('custom-label').value = '';
  document.getElementById('custom-text').value = '';
  renderCustom();
  showToast('Message saved!');
}

// ---- Keyboard Shortcuts ----
document.addEventListener('keydown', e => {
  if (e.target.matches('input,textarea,select')) return;
  if (e.key === '1') switchTab('abbr');
  else if (e.key === '2') switchTab('events');
  else if (e.key === '3') switchTab('routine');
  else if (e.key === '4') switchTab('roster');
  else if (e.key === '5') switchTab('templates');
  else if (e.key === '6') switchTab('custom');
  else if (e.key === 'Escape' && _currentEvent) closeEvent();
});

// Ctrl+Enter to save custom
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter' && document.getElementById('custom-text') === document.activeElement) addCustomMessage();
});

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  renderCustom();
  loadTheme();
  // Persistent timer check
  if (localStorage.getItem('timer_running') === 'true') toggleTimer();
});

// ---- Elite Pro: Timer ----
let _timerInt = null;
let _seconds = parseInt(localStorage.getItem('timer_seconds')) || 0;

function toggleTimer() {
  const btn = document.getElementById('timer-toggle');
  const status = document.getElementById('header-status');
  if (_timerInt) {
    clearInterval(_timerInt); _timerInt = null;
    btn.textContent = '▶';
    status.textContent = 'Training Paused';
    localStorage.setItem('timer_running', 'false');
  } else {
    _timerInt = setInterval(updateTimer, 1000);
    btn.textContent = '⏸';
    status.textContent = 'Training Live';
    localStorage.setItem('timer_running', 'true');
  }
}

function updateTimer() {
  _seconds++;
  localStorage.setItem('timer_seconds', _seconds);
  const h = Math.floor(_seconds / 3600).toString().padStart(2,'0');
  const m = Math.floor((_seconds % 3600) / 60).toString().padStart(2,'0');
  const s = (_seconds % 60).toString().padStart(2,'0');
  document.getElementById('timer-display').textContent = `${h}:${m}:${s}`;
}

function resetTimer() {
  if (_timerInt) toggleTimer();
  _seconds = 0;
  localStorage.setItem('timer_seconds', 0);
  document.getElementById('timer-display').textContent = '00:00:00';
}

// ---- Elite Pro: Quick Commands ----
function copyQuick(cmd) {
  copyText(cmd);
}

// ---- Elite Pro: Roster ----
let _roster = JSON.parse(localStorage.getItem('roster_data')) || [];

function initRoster() {
  const input = document.getElementById('roster-input');
  const raw = input.value.replace(/,/g, '\n').split('\n').map(n => n.trim()).filter(n => n.length > 0);
  if (raw.length === 0) return;
  
  _roster = raw.map(name => ({ name, status: 'active', strikes: 0 }));
  saveRoster();
  renderRoster();
  updateAnalytics();
  input.value = '';
  showToast(`Imported ${raw.length} players!`);
}

function saveRoster() { localStorage.setItem('roster_data', JSON.stringify(_roster)); }

function renderRoster() {
  const list = document.getElementById('roster-list');
  const empty = document.getElementById('roster-empty');
  list.querySelectorAll('.roster-item').forEach(e => e.remove());
  
  if (_roster.length === 0) { empty.style.display = ''; return; }
  empty.style.display = 'none';

  _roster.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'roster-item' + (p.strikes >= 2 ? ' at-risk' : '');
    item.innerHTML = `
      <div class="roster-name">${escHTML(p.name)}</div>
      <div class="strike-container">
        <button class="btn-strike ${p.strikes > 0 ? 'active' : ''}" onclick="addStrike(${i})">
          ⚠️ Strike <span class="strike-count">${p.strikes}/2</span>
        </button>
      </div>
      <div class="status-btns">
        <button class="btn-status ${p.status==='active'?'active-status':''}" onclick="setRosterStatus(${i},'active')">Active</button>
        <button class="btn-status ${p.status==='failed'?'failed-status':''}" onclick="setRosterStatus(${i},'failed')">Failed</button>
        <button class="btn-status ${p.status==='excused'?'excused-status':''}" onclick="setRosterStatus(${i},'excused')">Excused</button>
      </div>
    `;
    list.appendChild(item);
  });
}

function addStrike(idx) {
  const p = _roster[idx];
  p.strikes = (p.strikes + 1) % 3; // 0 -> 1 -> 2 -> 0

  saveRoster();
  renderRoster();

  if (p.strikes === 1) showToast(`${p.name} given Strike 1.`);
  if (p.strikes === 2) {
    showToast(`Strike 2! Removal triggered for ${p.name}.`);
    copyQuick(`!PSKICK ${p.name}`);
  }
}

function setRosterStatus(idx, status) {
  _roster[idx].status = status;
  saveRoster();
  renderRoster();
  updateAnalytics(); 
}

function generateTrainingReport() {
  if (_roster.length === 0) { showToast('Roster is empty!'); return; }
  const active = _roster.filter(p => p.status === 'active').map(p => p.name);
  const failed = _roster.filter(p => p.status === 'failed').map(p => p.name);
  const disciplined = _roster.filter(p => p.strikes > 0).map(p => `${p.name} (${p.strikes} Strikes)`);
  
  const h = Math.floor(_seconds / 3600);
  const m = Math.floor((_seconds % 3600) / 60);

  const report = [
    `📊 **EQUALITY TRAINING REPORT**`,
    `⏱ **Duration:** ${h}h ${m}m`,
    `✅ **Survivors (${active.length}):** ${active.join(', ') || 'None'}`,
    `❌ **Failed (${failed.length}):** ${failed.join(', ') || 'None'}`,
    `⚠️ **Disciplined (${disciplined.length}):** ${disciplined.join(', ') || 'None'}`,
    `🏆 **Congratulations to all survivors!**`
  ].join('\n');
  
  copyText(report);
  
  // Log to history
  logSessionSnapshot({
    date: new Date().toLocaleString(),
    duration: `${h}h ${m}m`,
    survivors: active.length,
    failed: failed.length,
    names: active.join(', ')
  });
}

// ---- Elite Pro: History ----
let _history = JSON.parse(localStorage.getItem('training_history')) || [];

function logSessionSnapshot(data) {
  _history.unshift(data);
  if (_history.length > 10) _history.pop(); // Keep last 10
  localStorage.setItem('training_history', JSON.stringify(_history));
  renderHistory();
}

function renderHistory() {
  const container = document.getElementById('history-list');
  if (!container) return;
  
  if (_history.length === 0) {
    container.innerHTML = `<div class="empty-state">No past sessions found. Try finishing a training!</div>`;
    return;
  }

  container.innerHTML = _history.map(h => `
    <div class="history-card">
      <div class="history-header">
        <span class="history-title">Training Session</span>
        <span class="history-date">${h.date}</span>
      </div>
      <div class="history-body">
        ⏱ Duration: ${h.duration}
        ✅ Survivors: ${h.survivors} (${h.names || 'N/A'})
        ❌ Failed: ${h.failed}
      </div>
    </div>
  `).join('');
}

// ---- Elite Pro: Templates ----
const DEFAULT_TEMPLATES = {
  ffa: "We will begin with FFA.\nPlease go down in the pit so we can begin the FFA.\nRules: STS in the safezone upon death.\n3... 2... 1... GO!",
  glads: "We will now be doing Gladiators.\nThe captains are: [Captain 1] and [Captain 2].\nThis will be a [Format] Gladiators session.\n[Captain 1], you move first. [Captain 2], you move second.\nBoth captains, announce your order.\nThe first players from each team go down.\nRules: Winner stays down. Loser is replaced. STS in safezone.\n3... 2... 1... GO!",
  tdm: "We will now be doing TDM.\nEveryone STS 1 tile in front of me.\nThis will be a [Format] TDM ONLY.\nThe captains are: [Captain 1] and [Captain 2].\nAlly your team and stand behind your captain.\nBoth teams go to your respective sides.\nRules: STS in safezone upon death.\n3... 2... 1... GO!"
};

let _templates = JSON.parse(localStorage.getItem('script_templates')) || DEFAULT_TEMPLATES;

function getTemplate(key) { return _templates[key] || DEFAULT_TEMPLATES[key]; }

function saveTemplate(key) {
  const val = document.getElementById('tpl-' + key).value;
  _templates[key] = val;
  localStorage.setItem('script_templates', JSON.stringify(_templates));
}

function renderTemplates() {
  Object.keys(_templates).forEach(k => {
    const el = document.getElementById('tpl-' + k);
    if (el) el.value = _templates[k];
  });
}

// ---- Elite Pro: Analytics ----
let _eventStats = JSON.parse(localStorage.getItem('event_stats')) || {};
let _currentEventStart = null;
let _activeEventId = null;

function updateAnalytics() {
  // Survival Rate
  const total = _roster.length;
  const active = _roster.filter(p => p.status === 'active').length;
  const rate = total > 0 ? Math.round((active / total) * 100) : 100;
  
  const headerVal = document.getElementById('stat-survival-header');
  const headerBar = document.getElementById('stat-survival-bar');
  const detailedVal = document.getElementById('stat-survival-detailed');
  
  if (headerVal) headerVal.textContent = rate + '%';
  if (headerBar) headerBar.style.width = rate + '%';
  if (detailedVal) detailedVal.textContent = rate + '%';

  // Efficiency (Based on 1 hour goal)
  const effVal = document.getElementById('stat-efficiency');
  if (effVal) {
    const goalSecs = 3600;
    const currentEff = Math.max(0, 100 - Math.round((_seconds / goalSecs) * 50)); 
    effVal.textContent = currentEff + '%';
    effVal.style.color = currentEff < 50 ? '#ef4444' : (currentEff < 80 ? '#f59e0b' : 'var(--text-primary)');
  }

  renderEventBars();
}

function startEventTimer(eventId) {
  stopEventTimer(); // Stop prev
  _activeEventId = eventId;
  _currentEventStart = Date.now();
  console.log(`Analytics: Tracking ${eventId}`);
}

function stopEventTimer() {
  if (_activeEventId && _currentEventStart) {
    const elapsed = Math.floor((Date.now() - _currentEventStart) / 1000);
    _eventStats[_activeEventId] = (_eventStats[_activeEventId] || 0) + elapsed;
    saveEventStats();
    _activeEventId = null;
    _currentEventStart = null;
    updateAnalytics();
  }
}

function saveEventStats() {
  localStorage.setItem('event_stats', JSON.stringify(_eventStats));
}

function renderEventBars() {
  const container = document.getElementById('event-bars-list');
  if (!container) return;
  
  const totalRecorded = Object.values(_eventStats).reduce((a, b) => a + b, 0) || 1;
  
  container.innerHTML = Object.entries(_eventStats).map(([id, secs]) => {
    const name = id.toUpperCase();
    const pct = Math.round((secs / totalRecorded) * 100);
    const mins = Math.max(1, Math.round(secs / 60));
    return `
      <div class="event-bar-row">
        <div class="eb-header">
          <span>${name}</span>
          <span>${mins}m (${pct}%)</span>
        </div>
        <div class="eb-track"><div class="eb-fill" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');
}

// Modify openEvent and closeEvent to hook into timers
const originalOpenEvent = openEvent;
openEvent = (id) => {
  startEventTimer(id);
  originalOpenEvent(id);
};

const originalCloseEvent = closeEvent;
closeEvent = () => {
  stopEventTimer();
  originalCloseEvent();
};

function setAccent(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme_accent', theme);
  document.querySelectorAll('.theme-dot').forEach(d => {
    d.classList.remove('active');
    if (d.classList.contains('dot-' + theme)) d.classList.add('active');
  });
  showToast('Theme set to ' + theme.toUpperCase());
}

function loadTheme() {
  const t = localStorage.getItem('theme_accent') || 'purple';
  setAccent(t);
}

document.addEventListener('DOMContentLoaded', () => {
  renderCustom();
  loadTheme();
  renderHistory();
  loadRoutine();
  updateAnalytics();
  initVoidCanvas();
  if (localStorage.getItem('timer_running') === 'true') toggleTimer();
});

// ---- Elite Pro: Void Particles ----
let _canvas, _ctx, _particles = [];
let _particleAnimationId;
let _stopParticles = false;

function initVoidCanvas() {
  _canvas = document.getElementById('void-canvas');
  if (!_canvas) return;
  _ctx = _canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  createParticles();
  animateParticles();
}

function resizeCanvas() {
  _canvas.width = window.innerWidth;
  _canvas.height = window.innerHeight;
}

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * _canvas.width;
    this.y = Math.random() * _canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.5 + 0.1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > _canvas.width || this.y < 0 || this.y > _canvas.height) {
      this.reset();
    }
  }
  draw() {
    const accent = getComputedStyle(document.body).getPropertyValue('--accent-p').trim();
    _ctx.fillStyle = accent;
    _ctx.globalAlpha = this.opacity;
    _ctx.beginPath();
    _ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    _ctx.fill();
  }
}

function createParticles() {
  _particles = [];
  const count = Math.floor((window.innerWidth * window.innerHeight) / 15000);
  for (let i = 0; i < count; i++) _particles.push(new Particle());
}

function animateParticles() {
  if (_stopParticles) return;
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  _particles.forEach(p => {
    p.update();
    p.draw();
  });
  _particleAnimationId = requestAnimationFrame(animateParticles);
}

function toggleParticles(checked) {
  _stopParticles = !checked;
  const label = document.querySelector('label[for="perf-toggle"]');
  if (label) label.textContent = _stopParticles ? 'STATIC MODE (ON)' : 'STATIC MODE (OFF)';
  
  if (!_stopParticles) animateParticles();
  else {
    cancelAnimationFrame(_particleAnimationId);
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  }
}

// ---- Elite Pro: Tactical Routine ----
let _routine = JSON.parse(localStorage.getItem('training_routine')) || [];
let _activeIndex = -1; // -1 means no active routine

function addToRoutine() {
  const sel = document.getElementById('routine-add-select');
  const eventId = sel.value;
  const eventName = sel.options[sel.selectedIndex].text;
  _routine.push({ id: eventId, name: eventName });
  saveRoutine();
  renderRoutine();
  showToast(`Added ${eventName} to routine!`);
}

function removeFromRoutine(idx) {
  _routine.splice(idx, 1);
  saveRoutine();
  renderRoutine();
}

function clearRoutine() {
  _routine = [];
  _activeIndex = -1;
  saveRoutine();
  renderRoutine();
  updatePhaseUI();
}

function saveRoutine() {
  localStorage.setItem('training_routine', JSON.stringify(_routine));
}

function loadRoutine() {
  _activeIndex = parseInt(localStorage.getItem('routine_active_idx')) || -1;
  renderRoutine();
  updatePhaseUI();
}

function renderRoutine() {
  const list = document.getElementById('routine-list');
  if (!list) return;
  list.innerHTML = '';
  
  if (_routine.length === 0) {
    list.innerHTML = '<div class="empty-state">No events in your routine yet. Add some above!</div>';
    return;
  }

  _routine.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'routine-item';
    if (i === _activeIndex) div.style.borderColor = 'var(--accent-p)';
    div.innerHTML = `
      <div class="routine-idx">${i + 1}</div>
      <div class="routine-name">${item.name}</div>
      <button class="routine-remove" onclick="removeFromRoutine(${i})">✖</button>
    `;
    list.appendChild(div);
  });
}

function startRoutine() {
  if (_routine.length === 0) { showToast('Routine is empty!'); return; }
  _activeIndex = 0;
  localStorage.setItem('routine_active_idx', _activeIndex);
  updatePhaseUI();
  executePhase();
}

function stopRoutine() {
  _activeIndex = -1;
  localStorage.setItem('routine_active_idx', _activeIndex);
  updatePhaseUI();
}

function nextPhase() {
  if (_activeIndex < _routine.length - 1) {
    _activeIndex++;
    localStorage.setItem('routine_active_idx', _activeIndex);
    updatePhaseUI();
    executePhase();
  } else {
    showToast('Routine complete!');
    stopRoutine();
  }
}

function prevPhase() {
  if (_activeIndex > 0) {
    _activeIndex--;
    localStorage.setItem('routine_active_idx', _activeIndex);
    updatePhaseUI();
    executePhase();
  }
}

function updatePhaseUI() {
  const nav = document.getElementById('phase-nav');
  if (_activeIndex === -1) {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
    const item = _routine[_activeIndex];
    document.getElementById('phase-current-name').textContent = item.name;
    document.getElementById('phase-step').textContent = `${_activeIndex + 1}/${_routine.length}`;
  }
  renderRoutine();
}

function executePhase() {
  const item = _routine[_activeIndex];
  if (['abbr', 'custom', 'roster', 'templates'].includes(item.id)) {
    switchTab(item.id);
  } else {
    switchTab('events');
    openEvent(item.id);
  }
  showToast(`Current Phase: ${item.name}`);
}
