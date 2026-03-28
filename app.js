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
      const lines = [
        { n:'1', text:'We will begin with FFA.', cls:'' },
        { n:'2', text:'Please go down in the pit so we can begin the FFA.', cls:'' },
        { n:'📜', text:'Rules: STS in the safezone upon death.', cls:'info-line' },
        { n:'3', text:'3... 2... 1... GO!', cls:'' },
      ];
      if (r2) {
        lines.push({ n:'—', text:'── Round 1 End ──', cls:'divider' });
        lines.push({ n:'4', text: winnerHTML(w) + ' stand beside me.', cls:'winner-line', winId:'ffa-w', suffix:' stand beside me.' });
        lines.push({ n:'5', text:'Everyone else go down in the pit so we can continue the second FFA.', cls:'' });
        lines.push({ n:'📜', text:'Rules: STS in the safezone upon death.', cls:'info-line' });
        lines.push({ n:'6', text:'3... 2... 1... GO!', cls:'' });
        lines.push({ n:'—', text:'── Round 2 End ──', cls:'divider' });
        lines.push({ n:'7', text:'Stand beside me.', cls:'' });
        lines.push({ n:'8', text:'That concludes our FFA session. Well done everyone!', cls:'' });
      } else {
        lines.push({ n:'—', text:'── FFA End ──', cls:'divider' });
        lines.push({ n:'4', text: winnerHTML(w) + ' you are the winner! Stand beside me.', cls:'winner-line', winId:'ffa-w', suffix:' you are the winner! Stand beside me.' });
        lines.push({ n:'5', text:'That concludes our FFA session. Well done everyone!', cls:'' });
      }
      return lines;
    },
    fullScript: () => `We will begin with FFA.\nPlease go down in the pit so we can begin the FFA.\nRules: STS in the safezone upon death.\n3... 2... 1... GO!`
  },

  glads: {
    icon: '🛡️', name: 'Gladiators', full: 'Gladiators (Glads)',
    desc: '2 captains pick teams and set an order. Players from each team go into the pit one at a time. The winner stays down and keeps fighting. The next player from the losing side enters. FT2 or FT3.',
    config: [
      { id: 'glads-ft', label: 'Format', type: 'select', options: ['FT2','FT3'] },
      { id: 'glads-cap1', label: 'Captain 1', type: 'text', placeholder: 'e.g. PlayerA' },
      { id: 'glads-cap2', label: 'Captain 2', type: 'text', placeholder: 'e.g. PlayerB' },
      { id: 'glads-order', label: 'Team Orders', type: 'textarea', placeholder: 'e.g. \nTeam 1: P1, P2, P3\nTeam 2: P4, P5, P6' },
      { id: 'glads-winner', label: 'Winning Team', type: 'text', placeholder: 'e.g. Team PlayerA' },
    ],
    buildLines: () => {
      const ft   = document.getElementById('glads-ft')?.value || 'FT2';
      const c1   = document.getElementById('glads-cap1')?.value.trim() || '[Captain 1]';
      const c2   = document.getElementById('glads-cap2')?.value.trim() || '[Captain 2]';
      const win  = document.getElementById('glads-winner')?.value.trim() || '[Winning Team]';
      return [
        { n:'1', text:'We will now be doing Gladiators.', cls:'' },
        { n:'2', text:`The captains are: ${c1} and ${c2}.`, cls:'' },
        { n:'3', text:`This will be a ${ft} Gladiators session.`, cls:'' },
        { n:'4', text:`${c1}, you have the first pick. ${c2}, you will pick second.`, cls:'' },
        { n:'5', text:'Once picks are done, please set your team order and DM it to me.', cls:'info-line' },
        { n:'6', text:'Both captains, please announce your order to your team.', cls:'' },
        { n:'7', text:'The first players from each team go down into the pit.', cls:'' },
        { n:'📜', text:'Rules: Winner stays down and continues fighting. Loser is replaced by the next on their team. STS in safezone upon death.', cls:'info-line' },
        { n:'8', text:'3... 2... 1... GO!', cls:'' },
        { n:'—', text:'── Ongoing: Replace players as they fall ──', cls:'divider' },
        { n:'9', text: winnerHTML(win) + ` wins the Gladiators! Congratulations!`, cls:'winner-line' },
      ];
    },
    fullScript: () => {
      const ft  = document.getElementById('glads-ft')?.value || 'FT2';
      const c1  = document.getElementById('glads-cap1')?.value.trim() || '[Captain 1]';
      const c2  = document.getElementById('glads-cap2')?.value.trim() || '[Captain 2]';
      return `We will now be doing Gladiators.\nThe captains are: ${c1} and ${c2}.\nThis will be a ${ft} Gladiators session.\n${c1}, you have the first pick. ${c2}, you will pick second.\nOnce picks are done, please set your team order and DM it to me.\nBoth captains, please announce your order to your team.\nThe first players from each team go down into the pit.\nRules: Winner stays down and continues fighting. Loser is replaced by the next on their team. STS in safezone upon death.\n3... 2... 1... GO!`;
    }
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
      
      const lines = [
        { n:'1', text:'We will now be doing TDM.', cls:'' },
        { n:'2', text:'Everyone STS 1 tile in front of me.', cls:'' },
        { n:'3', text:`This will be a ${ft} TDM ONLY.`, cls:'' },
        { n:'4', text:`The captains are: ${c1} and ${c2}.`, cls:'' },
        { n:'5', text:'Since we will be doing TDM make sure to ally your team and stand behind your captain once chosen.', cls:'' },
        { n:'6', text:'Say "Y" if you understood what I just said.', cls:'' },
        { n:'7', text:'PTS is OFF for Captains ONLY.', cls:'' },
        { n:'8', text:`${c1}, you may have the first pick.`, cls:'' },
        { n:'9', text:'(All picks done) I hope you have all allied your respective teams.', cls:'info-line' },
        { n:'10', text:'Both teams go to your respective sides.', cls:'' },
        { n:'📜', text:'Rules: STS in safezone upon death.', cls:'info-line' },
        { n:'11', text:'3... 2... 1... GO!', cls:'' },
      ];

      if (s1 !== '0' || s2 !== '0') {
        lines.push({ n:'—', text:'── Live Score Evolution ──', cls:'divider' });
        lines.push({ n:'📈', text: `The current score is ${s1} - ${s2}.`, cls:'info-line' });
        if (parseInt(s1) >= 2 || parseInt(s2) >= 2) {
          const winTeam = parseInt(s1) > parseInt(s2) ? c1 : c2;
          lines.push({ n:'🏆', text: `That concludes the TDM session. Team ${winTeam} is the Victor!`, cls:'winner-line' });
        }
      }
      return lines;
    },
    fullScript: () => `We will now be doing TDM.\nEveryone STS 1 tile in front of me.\nThis will be a ${ft} TDM ONLY.\nThe captains are: ${c1} and ${c2}.\nSince we will be doing TDM make sure to ally your team and stand behind your captain once chosen.\nSay "Y" if you understood what I just said.\nPTS is OFF for Captains ONLY.\nRules: STS in safezone upon death.\n3... 2... 1... GO!`
  },

  tournament: {
    icon: '🏆', name: 'Tournament', full: 'Tournament (IQ Mode)',
    desc: 'Input participants and generate random 1v1 or 2v2 brackets automatically.',
    config: [
      { id: 'tourn-mode', label: 'Mode', type: 'select', options: ['1v1','2v2'] },
      { id: 'tourn-players', label: 'Participants', type: 'textarea', placeholder: 'Paste player names here (one per line)...' },
      { id: 'tourn-gen', label: 'Actions', type: 'custom', render: () => `<button class="btn-primary" onclick="generateBrackets()" style="width:100%">🎲 Generate Random Matchups</button>` }
    ],
    state: { matchups: [] },
    buildLines: () => {
      const mode = document.getElementById('tourn-mode')?.value || '1v1';
      const matches = EVENTS.tournament.state.matchups || [];
      
      const lines = [
        { n:'1', text:`We will now be doing a ${mode} Tournament.`, cls:'' },
        { n:'2', text:'Winner stands on the right side. Loser stands on the left side.', cls:'' },
        { n:'3', text:'Wait for me to call the matches.', cls:'' },
        { n:'📜', text:'Rules: STS in safezone upon death. No attacking in safezone.', cls:'info-line' },
      ];

      if (matches.length > 0) {
        lines.push({ n:'—', text:'── Generated Matchups ──', cls:'divider' });
        matches.forEach((m, i) => {
          const vs = mode === '1v1' ? `${m[0]} VS ${m[1]}` : `(${m[0]}, ${m[1]}) VS (${m[2]}, ${m[3]})`;
          lines.push({ n: (i+1).toString(), text: vs, cls: 'match-line' });
          lines.push({ n: '⚡', text: '3... 2... 1... GO!', cls: 'small-line' });
        });
        lines.push({ n:'—', text:'── Finals ──', cls:'divider' });
        lines.push({ n:'🏆', text: 'Congratulations to our Tournament Champion!', cls:'winner-line' });
      } else {
        lines.push({ n:'💡', text: 'Paste names and click "Generate" above to see the bracket.', cls:'info-line' });
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

function generateBrackets() {
  const input = document.getElementById('tourn-players');
  const mode = document.getElementById('tourn-mode').value;
  if (!input) return;

  // Robust parsing for both newlines and commas
  const rawValue = input.value.replace(/,/g, '\n');
  const names = rawValue.split('\n')
    .map(n => n.trim())
    .filter(n => n.length > 0);

  if (names.length < 2) {
    showToast('Add at least 2 players!');
    return;
  }

  shuffleArray(names);
  const matchups = [];
  const step = mode === '1v1' ? 2 : 4;

  for (let i = 0; i < names.length; i += step) {
    const group = names.slice(i, i + step);
    if (group.length === step) {
      matchups.push(group);
    } else {
      // Handle remaining (Bye)
      const padded = [...group];
      while(padded.length < step) padded.push('BYE');
      matchups.push(padded);
    }
  }

  EVENTS.tournament.state.matchups = matchups;
  refreshEventLines();
  showToast(`Matchmaking complete: ${matchups.length} matchups.`);
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
  else if (e.key === '3') switchTab('custom');
  else if (e.key === 'Escape' && _currentEvent) closeEvent();
});

// Ctrl+Enter to save custom
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.key === 'Enter' && document.getElementById('custom-text') === document.activeElement) addCustomMessage();
});

// ---- Init ----
document.addEventListener('DOMContentLoaded', renderCustom);
