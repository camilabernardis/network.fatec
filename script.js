(function () {
  'use strict';

  /* ---------- Dados ---------- */
  var KEY = 'bingo-network-v1';
  var MISSIONS = [
    { id: 'm0', tone: 'red',   needs: 3, semester: true,
      text: 'Conectei-me no LinkedIn com pelo menos 3 pessoas de semestres diferentes do meu',
      short: 'Conectar com 3 pessoas de outros semestres' },
    { id: 'm1', tone: 'dark',  needs: 1,
      text: 'Troquei ideias com alguém sobre como estruturar melhor o currículo para vagas de tecnologia',
      short: 'Ideias para estruturar o currículo de tecnologia' },
    { id: 'm2', tone: 'beige', needs: 1,
      text: 'Conversei com um aluno que trabalha na área para entender como ele gerencia o tempo entre a rotina de trabalho/estágio e as entregas da faculdade',
      short: 'Conversa com aluno que trabalha: gestão do tempo' },
    { id: 'm3', tone: 'red',   needs: 1,
      text: 'Troquei dicas com um colega sobre como melhorar minha apresentação pessoal no LinkedIn',
      short: 'Dicas para melhorar meu LinkedIn' },
    { id: 'm4', tone: 'dark',  needs: 1,
      text: 'Troquei contato (WhatsApp ou LinkedIn) com alguém que já faz estágio na minha área de interesse',
      short: 'Contato com quem já estagia na minha área' },
    { id: 'm5', tone: 'dark',  needs: 1,
      text: 'Troquei ideias sobre certificações ou cursos complementares que dão peso no currículo para quem quer atuar na nossa área',
      short: 'Certificações e cursos que dão peso' },
    { id: 'm6', tone: 'red',   needs: 1,
      text: 'Conversei com alguém sobre o processo seletivo (entrevistas, testes técnicos ou dinâmicas) da empresa onde a pessoa estagia ou trabalha',
      short: 'Processo seletivo da empresa de quem estagia' },
    { id: 'm7', tone: 'beige', needs: 1,
      text: 'Compartilhei o link do meu portfólio com um colega para receber feedback ou trocar ideias',
      short: 'Portfólio compartilhado para feedback' }
  ];
  // posição 4 (centro) é a casa livre
  var CELLS = [MISSIONS[0], MISSIONS[1], MISSIONS[2],
               MISSIONS[3], null, MISSIONS[4],
               MISSIONS[5], MISSIONS[6], MISSIONS[7]];
  var LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

  /* ---------- Estado ---------- */
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === 'object' && s.missions && typeof s.missions === 'object') {
        if (typeof s.celebrated !== 'number') s.celebrated = 0;
        if (s.mySemester == null) s.mySemester = '';
        return s;
      }
    } catch (e) {}
    return null;
  }
  var state = load() || { mySemester: '', celebrated: 0, missions: {} };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  function getM(id) {
    var d = state.missions[id] || (state.missions[id] = { people: [], note: '' });
    if (!Array.isArray(d.people)) d.people = [];
    if (typeof d.note !== 'string') d.note = '';
    return d;
  }
  function missionById(id) {
    for (var i = 0; i < MISSIONS.length; i++) if (MISSIONS[i].id === id) return MISSIONS[i];
    return null;
  }
  function isDone(m) { return getM(m.id).people.length >= m.needs; }
  function cellDone(c) { return c === null ? true : isDone(c); }
  function completedLines() {
    return LINES.filter(function (l) { return l.every(function (i) { return cellDone(CELLS[i]); }); });
  }

  /* ---------- Utilidades ---------- */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var toastTimer = 0;
  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function updateLock() {
    var any = document.querySelector('.overlay.open, #scanner.open, .celebrate.open');
    document.body.classList.toggle('lock', !!any);
  }

  function prettyName(slug) {
    var parts = slug.split('-').filter(Boolean);
    if (parts.length > 1) {
      var last = parts[parts.length - 1];
      if (/\d/.test(last) && /^[0-9a-z]{5,}$/i.test(last)) parts.pop();
    }
    return parts.map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); }).join(' ');
  }

  // Lê o texto de um QR (ou link colado) e devolve o contato ou null
  function parseContact(raw) {
    raw = (raw || '').trim();
    if (!raw) return null;
    var url;
    try { url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return null; }
    var host = url.hostname.replace(/^www\./, '').toLowerCase();
    var parts = url.pathname.split('/').filter(Boolean);

    if (host === 'linkedin.com' || host.slice(-13) === '.linkedin.com') {
      var i = parts.indexOf('in');
      if (i >= 0 && parts[i + 1]) {
        var slug = parts[i + 1];
        try { slug = decodeURIComponent(slug); } catch (e) {}
        return {
          key: 'li:' + slug.toLowerCase(),
          kind: 'LinkedIn',
          url: 'https://www.linkedin.com/in/' + encodeURIComponent(slug),
          name: prettyName(slug)
        };
      }
      return null;
    }
    if (host === 'lnkd.in' && parts.length) {
      return { key: 'li:short:' + parts.join('/').toLowerCase(), kind: 'LinkedIn',
               url: 'https://lnkd.in/' + parts.map(encodeURIComponent).join('/'), name: '' };
    }
    if (host === 'wa.me' && parts[0]) {
      var num = parts[0].replace(/\D/g, '');
      if (num.length >= 8) return { key: 'wa:' + num, kind: 'WhatsApp', url: 'https://wa.me/' + num, name: '' };
      return null;
    }
    if (host === 'api.whatsapp.com' || host === 'whatsapp.com') {
      var ph = (url.searchParams.get('phone') || '').replace(/\D/g, '');
      if (ph.length >= 8) return { key: 'wa:' + ph, kind: 'WhatsApp', url: 'https://wa.me/' + ph, name: '' };
      return null;
    }
    return null;
  }

  function findDuplicate(key) {
    for (var i = 0; i < MISSIONS.length; i++) {
      var d = getM(MISSIONS[i].id);
      for (var j = 0; j < d.people.length; j++) {
        if (d.people[j].key === key) return MISSIONS[i];
      }
    }
    return null;
  }

  /* ---------- Tabuleiro ---------- */
  var GLOBE = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="26"/><ellipse cx="32" cy="32" rx="11" ry="26"/>' +
    '<path d="M6 32h52M10 18h44M10 46h44"/></svg>';

  function renderBoard() {
    var inLine = {};
    completedLines().forEach(function (l) { l.forEach(function (i) { inLine[i] = true; }); });
    var html = '';
    CELLS.forEach(function (c, i) {
      if (c === null) {
        html += '<div class="tile free' + (inLine[i] ? ' bingo' : '') + '" aria-label="Casa livre">' + GLOBE + '</div>';
        return;
      }
      var done = isDone(c);
      var n = getM(c.id).people.length;
      html += '<button type="button" class="tile ' + c.tone + (done ? ' done' : '') + (inLine[i] ? ' bingo' : '') +
        '" data-id="' + c.id + '">' + esc(c.short) +
        (done ? '<span class="badge">&#10003;</span>' : '') +
        (!done && c.needs > 1 && n > 0 ? '<span class="count">' + n + '/' + c.needs + '</span>' : '') +
        '</button>';
    });
    $('board').innerHTML = html;

    var doneCount = MISSIONS.filter(isDone).length;
    $('progText').textContent = doneCount + ' de ' + MISSIONS.length + ' missões';
    $('barFill').style.width = (doneCount / MISSIONS.length * 100) + '%';
  }

  function renderNet() {
    var rows = [];
    MISSIONS.forEach(function (m) {
      getM(m.id).people.forEach(function (p) { rows.push({ m: m, p: p }); });
    });
    if (!rows.length) {
      $('netList').innerHTML = '<li class="empty" style="display:block;border:none;background:none">Nenhuma pessoa escaneada ainda.</li>';
      $('copyBtn').hidden = true;
      return;
    }
    $('copyBtn').hidden = false;
    $('netList').innerHTML = rows.map(function (r) {
      var safe = /^https:\/\//.test(r.p.url || '');
      return '<li><div><b>' + esc(r.p.name || 'Sem nome') + '</b><small>' + esc(r.p.kind) +
        (r.p.semester ? ' · ' + esc(r.p.semester) + 'º semestre' : '') + ' · ' + esc(r.m.short) + '</small></div>' +
        (safe ? '<a href="' + esc(r.p.url) + '" target="_blank" rel="noopener noreferrer">Abrir</a>' : '') + '</li>';
    }).join('');
  }

  function renderAll() { renderBoard(); renderNet(); }

  /* ---------- Bingo ---------- */
  function checkCelebrate() {
    var n = completedLines().length;
    var all = MISSIONS.every(isDone);
    if (n > state.celebrated) {
      state.celebrated = n;
      save();
      $('celTitle').textContent = all ? 'CARTELA CHEIA!' : 'BINGO!';
      $('celText').textContent = all
        ? 'Você completou todas as missões. Network em dia!'
        : 'Você completou ' + n + (n === 1 ? ' linha.' : ' linhas.') + ' Continue assim!';
      $('celebrate').classList.add('open');
      updateLock();
    } else if (n < state.celebrated) {
      state.celebrated = n;
      save();
    }
  }
  $('celOk').addEventListener('click', function () {
    $('celebrate').classList.remove('open');
    updateLock();
  });

  /* ---------- Folha da missão ---------- */
  var currentId = null;

  function openSheet(id) {
    currentId = id;
    renderSheet();
    $('sheet').classList.add('open');
    updateLock();
  }
  function closeSheet() {
    $('sheet').classList.remove('open');
    currentId = null;
    updateLock();
  }

  function renderSheet() {
    var m = missionById(currentId);
    if (!m) return;
    var d = getM(m.id);
    var done = isDone(m);
    var full = d.people.length >= m.needs;

    var status = done ? '&#10003; Missão cumprida'
      : (m.needs > 1 ? d.people.length + ' de ' + m.needs + ' pessoas' : 'Ainda não concluída');

    var people = d.people.map(function (p, i) {
      return '<li><div><b>' + esc(p.name || 'Sem nome') + '</b><small>' + esc(p.kind) +
        (p.semester ? ' · ' + esc(p.semester) + 'º semestre' : '') + '</small></div>' +
        '<button type="button" data-rm="' + i + '" aria-label="Remover pessoa">Remover</button></li>';
    }).join('');

    $('sheetBody').innerHTML =
      '<h2>' + esc(m.text) + '</h2>' +
      '<p class="status' + (done ? ' ok' : '') + '">' + status + '</p>' +
      (people ? '<ul class="list people">' + people + '</ul>' : '') +
      (!full
        ? '<button type="button" class="btn primary" id="scanBtn">&#128247; Escanear QR Code</button>' +
          '<div class="paste"><input type="text" id="pasteIn" placeholder="Ou cole o link do perfil" autocomplete="off" autocapitalize="off">' +
          '<button type="button" class="btn" id="pasteBtn">Usar</button></div>' +
          '<p class="err" id="sheetErr"></p>'
        : '') +
      '<label for="noteArea">Anotações (o que você aprendeu)</label>' +
      '<textarea id="noteArea" placeholder="Opcional">' + esc(d.note) + '</textarea>';

    var scanBtn = $('scanBtn');
    if (scanBtn) scanBtn.addEventListener('click', function () { startScan(m); });
    var pasteBtn = $('pasteBtn');
    if (pasteBtn) pasteBtn.addEventListener('click', function () { usePasted(m); });
    var pasteIn = $('pasteIn');
    if (pasteIn) pasteIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') usePasted(m); });

    $('noteArea').addEventListener('input', function (e) {
      getM(m.id).note = e.target.value;
      save();
    });
    Array.prototype.forEach.call($('sheetBody').querySelectorAll('[data-rm]'), function (b) {
      b.addEventListener('click', function () {
        var idx = parseInt(b.getAttribute('data-rm'), 10);
        var arr = getM(m.id).people;
        if (idx >= 0 && idx < arr.length && window.confirm('Remover ' + (arr[idx].name || 'esta pessoa') + ' desta missão?')) {
          arr.splice(idx, 1);
          save();
          renderSheet();
          renderAll();
          checkCelebrate();
        }
      });
    });
  }

  function sheetError(msg) {
    var e = $('sheetErr');
    if (e) e.textContent = msg || '';
  }

  function needsMySemester(m) {
    if (m.semester && !(parseInt(state.mySemester, 10) >= 1)) {
      var msg = 'Antes, informe o seu semestre no campo "Meu semestre" lá em cima.';
      sheetError(msg);
      toast(msg);
      return true;
    }
    return false;
  }

  function usePasted(m) {
    if (needsMySemester(m)) return;
    var c = parseContact($('pasteIn').value);
    if (!c) { sheetError('Link não reconhecido. Use o link do perfil do LinkedIn ou de um WhatsApp (wa.me).'); return; }
    var dup = findDuplicate(c.key);
    if (dup) { sheetError('Essa pessoa já foi usada na missão "' + dup.short + '".'); return; }
    sheetError('');
    openConfirm(m, c);
  }

  /* ---------- Scanner ---------- */
  var stream = null, raf = 0, scanning = false, scanToken = 0, scanMission = null, lastMsg = '';

  function setScanStatus(t) { $('scanStatus').textContent = t; }

  function stopCamera() {
    scanning = false;
    cancelAnimationFrame(raf);
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    var v = $('video');
    try { v.pause(); } catch (e) {}
    v.srcObject = null;
  }

  function closeScanner() {
    scanToken++;
    stopCamera();
    $('scanner').classList.remove('open');
    updateLock();
  }

  function startScan(m) {
    if (needsMySemester(m)) return;
    sheetError('');
    scanMission = m;
    lastMsg = '';
    var token = ++scanToken;
    $('scanner').classList.add('open');
    updateLock();
    setScanStatus('Abrindo a câmera…');

    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScanStatus('A câmera só funciona em site com HTTPS. Feche e cole o link do perfil.');
      return;
    } 
    if (typeof window.jsQR !== 'function') {
      setScanStatus('Leitor de QR não carregou (sem internet?). Feche e cole o link do perfil.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(function (s) {
        if (token !== scanToken) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = s;
        var v = $('video');
        v.srcObject = s;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
        scanning = true;
        setScanStatus('Aponte para o QR Code');
        raf = requestAnimationFrame(tick);
      })
      .catch(function (err) {
        console.error('Erro de câmera:', err);
        if (token !== scanToken) return;
        var name = err && err.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setScanStatus('Permissão da câmera negada. Libere nas configurações do navegador ou cole o link.');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setScanStatus('Nenhuma câmera encontrada. Feche e cole o link do perfil.');
        } else {
          setScanStatus('Não foi possível abrir a câmera. Feche e cole o link do perfil.');
        }
      });
  }

  function tick() {
    if (!scanning) return;
    var v = $('video');
    if (v.readyState >= 2 && v.videoWidth > 0) {
      var scale = Math.min(1, 640 / v.videoWidth);
      var w = Math.max(1, Math.round(v.videoWidth * scale));
      var h = Math.max(1, Math.round(v.videoHeight * scale));
      var cv = $('canvas');
      cv.width = w; cv.height = h;
      var ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(v, 0, 0, w, h);
      var img = ctx.getImageData(0, 0, w, h);
      var code = window.jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' });
      if (code && code.data && handleScan(code.data)) return;
    }
    raf = requestAnimationFrame(tick);
  }

  // true = aceitou e parou de escanear
  function handleScan(text) {
    var c = parseContact(text);
    if (!c) {
      if (lastMsg !== 'bad') { setScanStatus('Esse QR não é de um perfil do LinkedIn ou WhatsApp.'); lastMsg = 'bad'; }
      return false;
    }
    var dup = findDuplicate(c.key);
    if (dup) {
      var msg = 'Essa pessoa já foi usada na missão "' + dup.short + '".';
      if (lastMsg !== msg) { setScanStatus(msg); lastMsg = msg; }
      return false;
    }
    var m = scanMission;
    closeScanner();
    openConfirm(m, c);
    return true;
  }

  $('scanClose').addEventListener('click', closeScanner);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && $('scanner').classList.contains('open')) closeScanner();
  });

  /* ---------- Confirmar pessoa ---------- */
  var pending = null;

  function openConfirm(m, c) {
    pending = { m: m, c: c };
    $('confirmInfo').textContent = c.kind + ' · ' + (c.name || c.url.replace('https://', ''));
    $('cName').value = c.name || '';
    $('cSem').value = '';
    $('cSemWrap').hidden = !m.semester;
    $('cErr').textContent = '';
    $('confirm').classList.add('open');
    updateLock();
    setTimeout(function () {
      var el = (!c.name || !m.semester) ? $('cName') : $('cSem');
      if (!c.name) el.focus(); else if (m.semester) $('cSem').focus();
    }, 50);
  }
  function closeConfirm() {
    $('confirm').classList.remove('open');
    pending = null;
    updateLock();
  }

  function confirmPerson() {
    if (!pending) return;
    var m = pending.m, c = pending.c;
    var name = $('cName').value.trim();
    var err = '';
    var sem = null;

    if (!name) err = 'Informe o nome da pessoa.';
    if (!err && m.semester) {
      sem = parseInt($('cSem').value, 10);
      if (!(sem >= 1 && sem <= 12)) err = 'Informe o semestre (de 1 a 12).';
      else if (sem === parseInt(state.mySemester, 10)) err = 'Precisa ser de um semestre diferente do seu.';
      else if (getM(m.id).people.some(function (p) { return parseInt(p.semester, 10) === sem; }))
        err = 'Já há alguém desse semestre. Use semestres diferentes.';
    }
    if (!err) {
      var dup = findDuplicate(c.key);
      if (dup) err = 'Essa pessoa já foi usada na missão "' + dup.short + '".';
    }
    if (!err && getM(m.id).people.length >= m.needs) err = 'Essa missão já está completa.';
    if (err) { $('cErr').textContent = err; return; }

    getM(m.id).people.push({
      key: c.key, kind: c.kind, url: c.url, name: name,
      semester: m.semester ? sem : null, at: Date.now()
    });
    save();
    closeConfirm();
    if (currentId) renderSheet();
    renderAll();
    toast(isDone(m) ? 'Missão cumprida! \u2713' : 'Pessoa registrada \u2713');
    checkCelebrate();
  }

  $('cOk').addEventListener('click', confirmPerson);
  $('cCancel').addEventListener('click', closeConfirm);
  $('confirmClose').addEventListener('click', closeConfirm);
  $('cSem').addEventListener('keydown', function (e) { if (e.key === 'Enter') confirmPerson(); });
  $('cName').addEventListener('keydown', function (e) { if (e.key === 'Enter') confirmPerson(); });

  /* ---------- Eventos gerais ---------- */
  $('board').addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.tile[data-id]') : null;
    if (t) openSheet(t.getAttribute('data-id'));
  });
  $('sheetClose').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', function (e) { if (e.target === $('sheet')) closeSheet(); });
  $('confirm').addEventListener('click', function (e) { if (e.target === $('confirm')) closeConfirm(); });

  function showTab(board) {
    $('viewBoard').hidden = !board;
    $('viewNet').hidden = board;
    $('tabBoard').classList.toggle('on', board);
    $('tabNet').classList.toggle('on', !board);
    if (!board) renderNet();
  }
  $('tabBoard').addEventListener('click', function () { showTab(true); });
  $('tabNet').addEventListener('click', function () { showTab(false); });

  $('mySem').value = state.mySemester;
  $('mySem').addEventListener('input', function (e) {
    state.mySemester = e.target.value;
    save();
  });

  $('copyBtn').addEventListener('click', function () {
    var lines = [];
    MISSIONS.forEach(function (m) {
      getM(m.id).people.forEach(function (p) {
        lines.push((p.name || 'Sem nome') + ' — ' + p.kind + ' — ' + p.url + ' — ' + m.short);
      });
    });
    var text = lines.join('\n');
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      toast(ok ? 'Lista copiada' : 'Não foi possível copiar');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Lista copiada'); }, fallback);
    } else { fallback(); }
  });

  $('resetBtn').addEventListener('click', function () {
    if (window.confirm('Apagar todo o progresso e as pessoas registradas?')) {
      state = { mySemester: state.mySemester, celebrated: 0, missions: {} };
      save();
      closeSheet();
      renderAll();
      toast('Bingo reiniciado');
    }
  });

  renderAll();
  state.celebrated = Math.min(state.celebrated, completedLines().length);
  save();
})();
