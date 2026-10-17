/* Medication quiz mode for the Tools flashcards. Uses the existing OZ_MEDICINES study data.
   No doses. Nothing is saved: the score lives only in this page and resets when you leave. */
(function () {
  'use strict';
  var meds = (window.OZ_MEDICINES || []).map(function (m) {
    return { name: String(m.name).replace(/\*$/, ''), category: m.category, uses: m.uses, risks: m.risks, note: m.note || '', group: m.group };
  });
  var panel = document.getElementById('medQuiz');
  var quizBtn = document.getElementById('medQuizBtn');
  var section = panel && panel.closest('.flash-section');
  if (!panel || !quizBtn || !section || meds.length < 8) return;

  var ROUND = 10, round = [], qIndex = 0, score = 0, answered = false;

  function shuffle(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  // Friendlier wording for the class labels in the shared data.
  var LABELS = {
    'Beta1-selective blocker': 'Cardioselective (beta-1) beta blocker',
    'Non-dihydropyridine calcium blocker': 'Non-dihydropyridine calcium channel blocker',
    'Serotonin antagonist antiemetic': 'Serotonin (5-HT3) antagonist antiemetic',
    'Histamine H2 receptor antagonist': 'H2 receptor antagonist (acid reducer)',
    'NMDA antagonist / anaesthetic': 'Anaesthetic (NMDA antagonist)',
    'Antidote; glutathione precursor': 'Antidote (glutathione precursor)',
    'Antiseizure medicine; mood stabiliser': 'Antiseizure medicine and mood stabiliser',
    'NaSSA antidepressant': 'NaSSA antidepressant (noradrenergic and specific serotonergic)'
  };
  function label(cat) {
    if (LABELS[cat]) return LABELS[cat];
    return cat.replace(/ \+ /g, ' with ').replace(/ \/ /g, ' and ');
  }
  function isAcronym(word) { return /^[A-Z0-9-]{2,}$/.test(word) || /^[A-Z][a-z]?[A-Z]/.test(word); }
  function lowerStart(text) {
    var first = text.split(/[\s(]/)[0];
    if (isAcronym(first) || /^(Parkinson|Paracetamol|Gram)/.test(first)) return text;
    return text.charAt(0).toLowerCase() + text.slice(1);
  }
  function article(text) {
    var first = text.split(/[\s(]/)[0];
    if (/^(NSAID|SSRI|SNRI|SGLT2|NMDA|ACE|H2|5-HT3)$/.test(first)) return 'an';
    if (/^(NaSSA|GLP-1|P2Y12)$/.test(first)) return 'a';
    return /^[aeiou]/i.test(text) ? 'an' : 'a';
  }
  // e.g. 'is an ACE inhibitor', 'combines a dopamine precursor with an enzyme inhibitor', 'is both an antiplatelet and an NSAID'
  function classPhrase(cat) {
    var parts;
    if (cat.indexOf(' + ') > -1) {
      parts = cat.split(' + ').map(lowerStart);
      return 'combines ' + article(parts[0]) + ' ' + parts[0] + ' with ' + article(parts[1]) + ' ' + parts[1];
    }
    if (/^Penicillin \/ /.test(cat)) return 'combines a penicillin with a beta-lactamase inhibitor';
    if (cat.indexOf(' / ') > -1 && !LABELS[cat]) {
      parts = cat.split(' / ').map(lowerStart);
      return 'is both ' + article(parts[0]) + ' ' + parts[0] + ' and ' + article(parts[1]) + ' ' + parts[1];
    }
    var l = lowerStart(label(cat));
    return 'is ' + article(l) + ' ' + l;
  }
  // Avoid distractors that could also be right (e.g. warfarin and apixaban are both anticoagulants).
  var FAMILIES = ['anticoagulant', 'heparin', 'factor xa', 'nsaid', 'antiplatelet', 'analgesic', 'anaesthetic', 'antiarrhythmic',
    'antihistamine', 'corticosteroid', 'benzodiazepine', 'beta', 'calcium', 'diuretic', 'antidepressant', 'antipsychotic',
    'antiseizure', 'mood stabiliser', 'penicillin', 'cephalosporin', 'antimuscarinic', 'inotrope', 'vasopressor',
    'adrenergic', 'opioid', 'dopamine', 'antibiotic', 'antibacterial', 'antimicrobial'];
  function related(a, b) {
    a = a.toLowerCase(); b = b.toLowerCase();
    if (a === b || a.indexOf(b) > -1 || b.indexOf(a) > -1) return true;
    return FAMILIES.some(function (f) { return a.indexOf(f) > -1 && b.indexOf(f) > -1; });
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function buildQuestion(med) {
    var type = ['class', 'use', 'reverse'][Math.floor(Math.random() * 3)];
    var others = shuffle(meds.filter(function (m) { return m.name !== med.name; }));
    var options = [], seen = {};
    function add(text) { if (!seen[text]) { seen[text] = true; options.push(text); } }
    var prompt, correct;
    if (type === 'class') {
      prompt = 'Which drug class does ' + med.name + ' belong to?'; correct = label(med.category); add(correct);
      others.forEach(function (m) { if (options.length < 4 && !related(m.category, med.category)) add(label(m.category)); });
    } else if (type === 'use') {
      prompt = 'What is ' + med.name + ' commonly used for?'; correct = med.uses; add(correct);
      others.forEach(function (m) { if (options.length < 4 && m.group !== med.group && !related(m.category, med.category)) add(m.uses); });
    } else {
      prompt = 'Which of these medicines ' + classPhrase(med.category) + '?';
      correct = med.name; add(correct);
      others.forEach(function (m) { if (options.length < 4 && !related(m.category, med.category)) add(m.name); });
    }
    return { med: med, type: type, prompt: prompt, correct: correct, options: shuffle(options) };
  }

  // Bring the quiz card into view below the sticky site header, then move focus without a second jump.
  function scrollToQuiz(target) {
    var header = document.querySelector('.elegant-header');
    var offset = 12;
    if (header) {
      var pos = getComputedStyle(header).position;
      if (pos === 'sticky' || pos === 'fixed') offset += header.getBoundingClientRect().height;
    }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var top = panel.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    if (target) { try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); } }
  }
  function startRound() {
    round = shuffle(meds).slice(0, ROUND).map(buildQuestion);
    qIndex = 0; score = 0; showQuestion();
  }

  function showQuestion() {
    answered = false;
    var q = round[qIndex];
    panel.replaceChildren();
    var head = el('div', 'mq-head');
    head.appendChild(el('span', 'mq-count', 'Question ' + (qIndex + 1) + ' of ' + round.length));
    head.appendChild(el('span', 'mq-score', 'Score: ' + score + ' / ' + qIndex));
    panel.appendChild(head);
    var h = el('h3', 'mq-prompt', q.prompt); h.id = 'mqPrompt'; h.tabIndex = -1; panel.appendChild(h);
    var list = el('div', 'mq-options'); list.setAttribute('role', 'group'); list.setAttribute('aria-labelledby', 'mqPrompt');
    q.options.forEach(function (opt) {
      var b = el('button', 'mq-option', opt); b.type = 'button';
      b.addEventListener('click', function () { choose(q, opt, b, list); });
      list.appendChild(b);
    });
    panel.appendChild(list);
    var fb = el('div', 'mq-feedback'); fb.id = 'mqFeedback'; fb.setAttribute('aria-live', 'polite'); panel.appendChild(fb);
  }

  function choose(q, opt, button, list) {
    if (answered) return; answered = true;
    var right = opt === q.correct; if (right) score++;
    Array.prototype.forEach.call(list.children, function (b) {
      b.disabled = true;
      if (b.textContent === q.correct) b.classList.add('is-correct');
      else if (b === button) b.classList.add('is-wrong');
    });
    panel.querySelector('.mq-score').textContent = 'Score: ' + score + ' / ' + (qIndex + 1);
    var fb = document.getElementById('mqFeedback');
    fb.appendChild(el('p', 'mq-verdict ' + (right ? 'ok' : 'no'), right ? '✓ Correct' : '✗ Not quite. The answer is: ' + q.correct));
    var m = q.med;
    fb.appendChild(el('p', 'mq-explain', m.name + ' ' + classPhrase(m.category) + '. It is commonly used for ' + lowerStart(m.uses) + '. Key risks to watch for: ' + lowerStart(m.risks) + '.' + (m.note ? ' ' + m.note : '')));
    var last = qIndex === round.length - 1;
    var next = el('button', 'flash-btn primary mq-next', last ? 'See my score' : 'Next question →'); next.type = 'button';
    next.addEventListener('click', function () { if (last) showSummary(); else { qIndex++; showQuestion(); scrollToQuiz(document.getElementById('mqPrompt')); } });
    fb.appendChild(next);
    next.focus();
  }

  function showSummary() {
    panel.replaceChildren();
    var h = el('h3', 'mq-prompt', 'You scored ' + score + ' out of ' + round.length); h.tabIndex = -1; panel.appendChild(h);
    panel.appendChild(el('p', 'mq-explain', score >= 8 ? 'Strong work. Try another round to see different medicines.' : 'Keep going. Each round picks a new mix, and the explanations are a good place to revise.'));
    panel.appendChild(el('p', 'mq-small', 'Nothing is saved: your entries clear when you refresh or leave this page.'));
    var again = el('button', 'flash-btn primary', 'Start a new round'); again.type = 'button';
    again.addEventListener('click', function () { startRound(); scrollToQuiz(document.getElementById('mqPrompt')); });
    panel.appendChild(again); scrollToQuiz(h);
  }

  function cardParts() {
    return Array.prototype.filter.call(section.children, function (c) { return !c.classList.contains('topic-toggle') && c !== panel && c.id !== 'medQuizNotice'; });
  }
  function setQuiz(on) {
    cardParts().forEach(function (c) { c.hidden = on; });
    panel.hidden = !on;
    var n = document.getElementById('medQuizNotice'); if (n) n.hidden = !on;
    quizBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  quizBtn.addEventListener('click', function () {
    section.querySelectorAll('.topic-btn').forEach(function (b) { b.classList.remove('active'); });
    quizBtn.classList.add('active');
    setQuiz(true); startRound(); scrollToQuiz(null);
  });
  section.querySelectorAll('.topic-btn').forEach(function (b) {
    if (b !== quizBtn) b.addEventListener('click', function () { setQuiz(false); });
  });
})();
