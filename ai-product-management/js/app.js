/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- Tabs ---------- */
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.setAttribute('aria-selected', b === btn));
    ['prio','fb','story'].forEach(id => $(id).hidden = id !== btn.dataset.tab);
  });
});

/* ---------- 1. Backlog prioritization (RICE) ---------- */
let features = [];
try { features = JSON.parse(localStorage.getItem('pm-features') || '[]'); } catch (e) {}

const rice = f => (f.reach * f.impact * (f.conf / 100)) / f.effort;
const save = () => { try { localStorage.setItem('pm-features', JSON.stringify(features)); } catch (e) {} };

function renderBacklog(){
  const ranked = [...features].sort((a, b) => rice(b) - rice(a));
  $('rank-body').innerHTML = ranked.map((f, i) => `
    <tr><td>${i + 1}</td><td>${esc(f.name)}</td><td>${f.reach}</td><td>${f.impact}</td>
    <td>${f.conf}%</td><td>${f.effort}w</td><td class="score">${rice(f).toFixed(0)}</td></tr>`).join('');
  $('rank-empty').hidden = ranked.length > 0;
  $('ai-pick').textContent = ranked.length
    ? `Suggested next build: "${ranked[0].name}". It delivers the most value per week of effort.` : '';
}

$('add-feature').onclick = () => {
  const name = $('f-name').value.trim();
  if (!name) { $('f-name').focus(); return; }
  features.push({
    name,
    reach: +$('f-reach').value || 0,
    impact: +$('f-impact').value || 1,
    conf: Math.min(100, +$('f-conf').value || 50),
    effort: Math.max(0.5, +$('f-effort').value || 1)
  });
  $('f-name').value = '';
  save(); renderBacklog();
};
$('load-sample').onclick = () => {
  features = [
    {name:'Smart search suggestions', reach:5000, impact:2,    conf:80, effort:6},
    {name:'Dark mode',               reach:3000, impact:0.5,  conf:100, effort:2},
    {name:'AI report summaries',     reach:2500, impact:3,    conf:60, effort:8},
    {name:'Single sign-on',          reach:800,  impact:2,    conf:90, effort:5}
  ];
  save(); renderBacklog();
};
$('clear-features').onclick = () => { features = []; save(); renderBacklog(); };

/* ---------- 2. Feedback analysis ---------- */
/* Rule-based sentiment + theme tagging. Swap analyzeComment() for an LLM call
   (see askAI() below) to get real AI-powered analysis. */
const POS = ['love','great','good','excellent','easy','fast','helpful','amazing','nice','smooth','perfect','intuitive'];
const NEG = ['slow','bad','confusing','expensive','bug','crash','hard','broken','difficult','annoying','missing','hate','error','fail'];
const THEMES = {
  Performance: ['slow','fast','lag','crash','loading','speed'],
  Pricing:     ['price','pricing','expensive','cost','cheap','plan'],
  Usability:   ['confusing','easy','hard','intuitive','design','navigate','difficult'],
  Features:    ['feature','missing','add','wish','integration','export'],
  Support:     ['support','help','response','service','team']
};

function analyzeComment(text){
  const t = text.toLowerCase();
  let score = 0;
  POS.forEach(w => { if (t.includes(w)) score++; });
  NEG.forEach(w => { if (t.includes(w)) score--; });
  const sentiment = score > 0 ? 'pos' : score < 0 ? 'neg' : 'neu';
  const themes = Object.keys(THEMES).filter(k => THEMES[k].some(w => t.includes(w)));
  return { text, sentiment, themes: themes.length ? themes : ['General'] };
}

$('sample-fb').onclick = () => {
  $('fb-input').value = [
    'The app is too slow when loading reports',
    'Love the new dashboard design, so intuitive!',
    'Pricing is confusing and expensive for small teams',
    'Support team was very helpful and fast',
    'I wish there was an export feature, it is missing',
    'Crashed twice this week, really annoying'
  ].join('\n');
};

$('run-fb').onclick = () => {
  const lines = $('fb-input').value.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) { $('fb-out').innerHTML = '<p class="empty">Paste at least one comment to analyze.</p>'; return; }
  const res = lines.map(analyzeComment);
  const n = { pos:0, neg:0, neu:0 };
  const themeCount = {};
  res.forEach(r => { n[r.sentiment]++; r.themes.forEach(t => themeCount[t] = (themeCount[t] || 0) + 1); });
  const pct = k => (n[k] / res.length * 100).toFixed(0);
  const topTheme = Object.entries(themeCount).sort((a, b) => b[1] - a[1])[0];

  $('fb-out').innerHTML = `
    <div class="panel">
      <strong>${res.length} comments:</strong>
      <span class="pos">${pct('pos')}% positive</span>, <span class="neg">${pct('neg')}% negative</span>, <span class="neu">${pct('neu')}% neutral</span>
      <div class="bar" aria-hidden="true">
        <i style="width:${pct('pos')}%;background:var(--pos)"></i>
        <i style="width:${pct('neu')}%;background:var(--neu)"></i>
        <i style="width:${pct('neg')}%;background:var(--neg)"></i>
      </div>
      <p style="margin:0">Most mentioned theme: <strong>${esc(topTheme[0])}</strong> (${topTheme[1]} comments).</p>
    </div>
    <div class="panel scroll"><table>
      <thead><tr><th>Comment</th><th>Sentiment</th><th>Themes</th></tr></thead>
      <tbody>${res.map(r => `<tr><td>${esc(r.text)}</td>
        <td class="${r.sentiment}">${{pos:'Positive',neg:'Negative',neu:'Neutral'}[r.sentiment]}</td>
        <td>${r.themes.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</td></tr>`).join('')}
      </tbody></table></div>`;
};

/* ---------- 3. User story generator ---------- */
$('run-story').onclick = () => {
  const role = $('s-role').value.trim() || 'user';
  const goal = $('s-goal').value.trim();
  const why  = $('s-why').value.trim() || 'I can get my work done faster';
  if (!goal) { $('s-goal').focus(); return; }
  const text =
`User story
As a ${role}, I want to ${goal}, so that ${why}.

Acceptance criteria
1. Given I am signed in, when I choose to ${goal}, then the action completes in under 3 seconds.
2. Given the action fails, when I retry, then I see a clear error message explaining what went wrong.
3. Given I finish the action, then I see a confirmation and can undo it.
4. The feature works on desktop and mobile screens.

Success metric
Percentage of ${role}s who ${goal} within their first week.`;
  $('story-text').textContent = text;
  $('story-out').hidden = false;
};
$('copy-story').onclick = () => {
  navigator.clipboard && navigator.clipboard.writeText($('story-text').textContent);
  $('copy-story').textContent = 'Copied';
  setTimeout(() => $('copy-story').textContent = 'Copy story', 1500);
};

/* ---------- Plug in a real LLM here ----------
   Call your own backend (never put an API key in browser code):
   async function askAI(prompt){
     const r = await fetch('/api/ai', {method:'POST',
       headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt})});
     return (await r.json()).text;
   }
   Then use askAI() inside analyzeComment() or the story generator. */

renderBacklog();
