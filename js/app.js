/* Home page (Full-Stack): live services from the catalog, a help finder, a saved checklist. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  var KEY = 'shop:home:checklist';

  function store(v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(KEY) || '{}'); localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { return {}; } }

  // Services from shop/catalog.json (prices only from there)
  function items(c) {
    var list = c.items || c.products || c.services || [];
    if (!Array.isArray(list) && c.categories) list = [].concat.apply([], c.categories.map(function (k) { return k.items || []; }));
    return list;
  }
  function priceOf(it) { return it.price_cents != null ? it.price_cents : it.price != null ? it.price : it.priceCents; }
  function renderServices() {
    var box = $('service-cards'); if (!box) return;
    if (!window.Shop || !Shop.catalog) { return; }
    Shop.catalog().then(function (c) {
      var list = items(c).filter(function (i) { return !i.hidden && i.active !== false; }).slice(0, 6);
      if (!list.length) return;
      box.innerHTML = list.map(function (i) {
        var p = priceOf(i), t = i.name || i.title || i.id;
        var money = p != null && Shop.money ? Shop.money(p) : '';
        return '<li class="card" data-reveal><h3>' + esc(t) + '</h3><p>' + esc(i.desc || i.description || '') + '</p>' +
          (money ? '<div class="price">' + esc(money) + (i.options && i.options.length ? ' <small style="font-size:.9rem;font-weight:400">from</small>' : '') + '</div>' : '') +
          '<a href="pages/services.html#' + encodeURIComponent(i.id || '') + '">Details and options</a></li>';
      }).join('');
      box.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('is-in'); });
    }).catch(function () {
      box.innerHTML = '<li class="card"><h3>Our services</h3><p>See every service, option and price on the services page.</p><a href="pages/services.html">Open services</a></li>';
    });
  }

  // Help finder
  var finder = $('finder');
  if (finder) finder.addEventListener('submit', function (e) {
    e.preventDefault();
    var need = finder.need.value, style = finder.style.value, out = $('finder-out'), msg;
    if (need === 'unsure') msg = 'Start with a visa check guide to learn what applies to your passport and trip.';
    else if (need === 'docs') msg = 'A documents guide will give you the list and how to present it.';
    else msg = 'A form walkthrough shows each screen, so you apply with confidence.';
    msg += style === 'help' ? ' Add a human check of your application on the services page.' : ' The guides are made to be followed on your own.';
    out.innerHTML = esc(msg) + ' <a href="pages/services.html">See services</a>';
  });

  // Checklist
  var CL = ['Passport is in hand and I know its expiry date', 'Travel dates and arrival and departure points are decided', 'Accommodation booking details are saved', 'Return or onward travel details are saved', 'I have found the official source for my passport\'s rules', 'Digital copies of my documents are in one folder'];
  function renderChecklist() {
    var box = $('cl-items'); if (!box) return;
    var saved = store();
    box.innerHTML = CL.map(function (t, i) { return '<label><input type="checkbox" data-i="' + i + '"' + (saved[i] ? ' checked' : '') + '> ' + esc(t) + '</label>'; }).join('');
    function update() {
      var n = box.querySelectorAll('input:checked').length;
      $('cl-bar').style.width = (n / CL.length * 100) + '%';
      $('cl-text').textContent = n === CL.length ? 'All done. You are ready to start the application.' : n + ' of ' + CL.length + ' ready';
    }
    box.addEventListener('change', function (e) { var s = store(); s[e.target.dataset.i] = e.target.checked; store(s); update(); });
    update();
  }

  function init() { renderServices(); renderChecklist(); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
