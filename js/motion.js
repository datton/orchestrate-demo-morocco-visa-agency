/* Motion (UI/UX): data-reveal, data-words, data-count, data-marquee, data-fill, data-sticky-steps, data-parallax. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  document.documentElement.classList.add('js');
  if (reduce) document.documentElement.classList.add('reduce-motion');

  function io(cb, opts) {
    if (!('IntersectionObserver' in window)) return null;
    return new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { cb(e.target); o.unobserve(e.target); } }); }, opts || { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  }

  function words(el) {
    if (el.dataset.split) return; el.dataset.split = '1';
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', label);
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
            var s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++); w.appendChild(s); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  }

  function count(el) {
    var txt = el.textContent, m = txt.match(/[\d.,]+/); if (!m) return;
    var target = parseFloat(el.dataset.count || m[0].replace(/,/g, '')), dec = (m[0].split('.')[1] || '').length;
    var pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length), dur = 1400, t0 = null;
    function fmt(v) { return v.toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
    function step(t) {
      if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(target * e) + post; if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
    }
    el.style.minWidth = el.offsetWidth + 'px';
    requestAnimationFrame(step);
  }

  function fill(el) {
    if (el.dataset.split) return; el.dataset.split = '1';
    var parts = el.textContent.replace(/\s+/g, ' ').trim().split(' ');
    el.setAttribute('aria-label', parts.join(' '));
    el.innerHTML = parts.map(function (w) { return '<span class="fw" aria-hidden="true">' + w.replace(/</g, '&lt;') + '</span>'; }).join(' ');
    var spans = $$('.fw', el);
    function upd() {
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35); p = Math.max(0, Math.min(1, p));
      var n = p * spans.length;
      spans.forEach(function (s, i) { s.style.opacity = Math.max(0.18, Math.min(1, 0.18 + (n - i))); });
    }
    if (reduce) { spans.forEach(function (s) { s.style.opacity = 1; }); return; }
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
  }

  function marquee(el) {
    if (el.dataset.split) return; el.dataset.split = '1';
    var items = el.innerHTML;
    el.setAttribute('role', 'presentation');
    var track = document.createElement('div'); track.className = 'marquee__track'; track.setAttribute('aria-hidden', 'true');
    track.innerHTML = '<div class="marquee__row">' + items + '</div><div class="marquee__row">' + items + '</div>';
    el.innerHTML = ''; el.appendChild(track);
    var sr = document.createElement('span'); sr.className = 'visually-hidden'; sr.textContent = track.firstChild.textContent.replace(/\s+/g, ' ').trim(); el.appendChild(sr);
  }

  function sticky(el) {
    var steps = $$('[data-step]', el); if (!steps.length) return;
    var out = el.querySelector('[data-step-word]');
    if (!out) { out = document.createElement('div'); out.className = 'steps__word'; out.setAttribute('data-step-word', ''); out.setAttribute('aria-hidden', 'true'); el.insertBefore(out, el.firstChild); }
    function set(s) {
      steps.forEach(function (x) { x.classList.toggle('is-active', x === s); });
      var w = s.getAttribute('data-step') || s.dataset.word || ''; if (out.textContent !== w) { out.textContent = w; out.classList.remove('swap'); void out.offsetWidth; out.classList.add('swap'); }
    }
    set(steps[0]);
    if (!('IntersectionObserver' in window)) return;
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) set(e.target); }); }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { o.observe(s); });
  }

  function parallax() {
    var els = $$('[data-parallax]'); if (!els.length || reduce) return;
    var t = false;
    function upd() { t = false; els.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return; var k = parseFloat(el.dataset.parallax) || 0.12; el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - innerHeight / 2) * -k).toFixed(1) + 'px,0)'; }); }
    addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }

  function kinetic() { // data-rotate="a|b|c": a rotating word
    $$('[data-rotate]').forEach(function (el) {
      var list = el.dataset.rotate.split('|'); if (list.length < 2 || reduce) return; var i = 0;
      setInterval(function () { el.classList.add('is-out'); setTimeout(function () { i = (i + 1) % list.length; el.textContent = list[i]; el.classList.remove('is-out'); }, 380); }, 2600);
    });
  }

  function init() {
    $$('[data-words]').forEach(words);
    $$('[data-marquee]').forEach(marquee);
    $$('[data-fill]').forEach(fill);
    $$('[data-sticky-steps]').forEach(sticky);
    parallax(); kinetic();
    if (reduce || !('IntersectionObserver' in window)) { $$('[data-reveal],[data-words]').forEach(function (e) { e.classList.add('is-in'); }); return; }
    var r = io(function (e) { e.classList.add('is-in'); });
    $$('[data-reveal],[data-words]').forEach(function (e) { r.observe(e); });
    var c = io(count, { threshold: 0.6 }); $$('[data-count]').forEach(function (e) { c.observe(e); });
    // hero words start straight away
    requestAnimationFrame(function () { $$('[data-words]').forEach(function (e) { var b = e.getBoundingClientRect(); if (b.top < innerHeight) e.classList.add('is-in'); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
