/* Hosted inside an artifact viewer (framed) vs on its own domain (e.g. GitHub Pages). */
var AP_FRAMED = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();

/* Case study pages always open at the top (browsers otherwise restore the old scroll position). */
(function () {
  var isCase = /(ssfl|ge|etv)\.html/.test(location.pathname);
  if (!isCase) return;
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  function top() { if (!location.hash || location.hash === '#top') window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }
  top();
  document.addEventListener('DOMContentLoaded', top);
  window.addEventListener('load', top);
  window.addEventListener('pageshow', function (e) { if (e.persisted) top(); });
})();
(function () {
  var root = document.documentElement;
  function get() { try { return localStorage.getItem('ap-theme'); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem('ap-theme', v); } catch (e) {} }
  function current() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function paint() {
    var c = current();
    document.querySelectorAll('.mode button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === c ? 'true' : 'false'); });
  }
  var saved = get(); if (saved) root.setAttribute('data-theme', saved);
  document.addEventListener('DOMContentLoaded', function () {
    paint();
    document.querySelectorAll('.mode button').forEach(function (b) {
      b.addEventListener('click', function () { root.setAttribute('data-theme', b.dataset.mode); set(b.dataset.mode); paint(); });
    });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', paint);

    // mobile menu
    var body = document.body;
    document.querySelectorAll('[data-menu]').forEach(function (b) { b.addEventListener('click', function () { body.classList.toggle('menu-open'); }); });
    var scrim = document.querySelector('.scrim'); if (scrim) scrim.addEventListener('click', function () { body.classList.remove('menu-open'); });
    document.querySelectorAll('.panel a').forEach(function (a) { a.addEventListener('click', function () { body.classList.remove('menu-open'); }); });

    // copy email
    document.querySelectorAll('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var text = b.getAttribute('data-copy'), label = b.textContent;
        function done(ok) { b.textContent = ok ? 'Copied' : 'Select'; setTimeout(function () { b.textContent = label; }, 1600); }
        try { navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); } catch (e) { done(false); }
      });
    });

    // scroll spy for panel links pointing at sections on this page
    window.apSpy = function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('.panel .p-nav a[href^="#"]'));
    if (links.length && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
      }, { rootMargin: '-35% 0px -55% 0px' });
      links.forEach(function (a) { var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) io.observe(s); });
    }
    };
    window.apSpy();

    // draggable floaters
    document.querySelectorAll('.fl').forEach(function (el) {
      var sx, sy, ox = 0, oy = 0, id = null;
      el.addEventListener('pointerdown', function (e) {
        id = e.pointerId; el.setPointerCapture(id); el.classList.add('dragging');
        var m = (el.style.transform || '').match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
        ox = m ? parseFloat(m[1]) : 0; oy = m ? parseFloat(m[2]) : 0; sx = e.clientX; sy = e.clientY;
      });
      el.addEventListener('pointermove', function (e) {
        if (e.pointerId !== id) return;
        el.style.transform = 'translate(' + (ox + e.clientX - sx) + 'px, ' + (oy + e.clientY - sy) + 'px)';
      });
      function end(e) { if (e.pointerId !== id) return; id = null; el.classList.remove('dragging'); }
      el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    });
  });
})();

/* In-page resume viewer: opening the PDF in a new tab is blocked inside the artifact frame. */
(function () {
  function build() {
    var m = document.createElement('div');
    m.className = 'rv'; m.hidden = true;
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', 'Resume');
    m.innerHTML = '<div class="rv-bar"><span class="rv-title">Abhinay Palle · Resume</span><div class="rv-act">' +
      '<button type="button" class="rv-dl" hidden><svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>Download PDF</button>' +
      '<button type="button" class="rv-x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>' +
      '<div class="rv-body"><img src="resume.jpg" alt="Resume of Abhinay Palle, UX / UI Design Lead"></div><p class="rv-msg" hidden></p>';
    document.body.appendChild(m);
    var last = null, dl = m.querySelector('.rv-dl'), msg = m.querySelector('.rv-msg');
    function close() { m.hidden = true; document.body.style.overflow = ''; if (last) last.focus(); }
    m.querySelector('.rv-x').addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m || e.target.classList.contains('rv-body')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) close(); });
    var downloads = null, asked = false;
    function resolveDl() {
      if (asked || !(window.claude && window.claude.use)) return;
      asked = true;
      window.claude.use('downloads').then(function (d) { downloads = d; dl.hidden = !d; }).catch(function () {});
    }
    if (!AP_FRAMED) dl.hidden = false; else resolveDl();
    dl.addEventListener('click', function () {
      if (!AP_FRAMED) { var x = document.createElement('a'); x.href = 'resume.pdf'; x.download = 'Abhinay_Palle_Resume.pdf'; document.body.appendChild(x); x.click(); x.remove(); return; }
      if (!downloads) return;
      msg.hidden = true;
      fetch('resume.pdf').then(function (r) { return r.blob(); }).then(function (b) {
        return downloads.save({ filename: 'Abhinay_Palle_Resume.pdf', data: b });
      }).catch(function (e) {
        var c = e && e.code;
        if (c === 'declined') return;
        msg.textContent = c === 'rate_limited' ? 'A download is already waiting for your confirmation.' : 'Download isn’t available here. You can still view the resume above.';
        msg.hidden = false;
        if (c === 'unavailable' || c === 'not_granted') dl.hidden = true;
      });
    });
    return { open: function (from) { if (AP_FRAMED) resolveDl(); last = from; m.hidden = false; document.body.style.overflow = 'hidden'; m.querySelector('.rv-x').focus(); } };
  }
  var viewer = null;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="resume.pdf"]');
    if (!a) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    if (!viewer) viewer = build();
    viewer.open(a);
  });
})();

/* Email: mailto can't open reliably from inside the hosted page (it navigates the frame and gets blocked).
   Intercept every mailto link and show a small dialog with the address and a Copy button instead. */
(function () {
  var box = null;
  function build() {
    box = document.createElement('div');
    box.className = 'em'; box.hidden = true;
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'em-t');
    box.innerHTML = '<div class="em-card"><button type="button" class="em-x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<span class="em-ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></span>' +
      '<h3 id="em-t">Couldn’t open your email app</h3>' +
      '<p>Email apps can’t be opened from this page. Copy my address and paste it into your email.</p>' +
      '<div class="em-row"><input class="em-addr" readonly aria-label="Email address"><button type="button" class="em-copy">Copy email</button></div>' +
      '<p class="em-ok" aria-live="polite"></p></div>';
    document.body.appendChild(box);
    var input = box.querySelector('.em-addr'), btn = box.querySelector('.em-copy'), ok = box.querySelector('.em-ok');
    function close() { box.hidden = true; ok.textContent = ''; btn.textContent = 'Copy email'; }
    box.querySelector('.em-x').addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
    btn.addEventListener('click', function () {
      function fallback() { input.focus(); input.select(); ok.textContent = 'Selected. Press Ctrl/Cmd + C to copy.'; }
      try {
        navigator.clipboard.writeText(input.value).then(function () { btn.textContent = 'Copied'; ok.textContent = 'Email address copied to your clipboard.'; }, fallback);
      } catch (e) { fallback(); }
    });
  }
  document.addEventListener('click', function (e) {
    if (!AP_FRAMED) return;
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a) return;
    e.preventDefault();
    document.body.classList.remove('menu-open');
    if (!box) build();
    box.querySelector('.em-addr').value = a.getAttribute('href').replace(/^mailto:/, '').split('?')[0];
    box.hidden = false;
    box.querySelector('.em-copy').focus();
  });
})();
