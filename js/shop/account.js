/* My purchases (Senior Developer 4): pages/account.html. A demo gate in the browser, not real protection. */
(function () {
  'use strict';
  var root = document.getElementById('account-root');
  var esc = Shop.esc, cat = null;

  function itemOf(id) { return ((cat && cat.items) || []).filter(function (i) { return i.id === id; })[0] || {}; }
  function linkOf(it) { var l = it.guide || it.unlock || it.link || it.url || it.page || ''; if (!l && /^(guides|walkthroughs)$/.test(String(it.category || '').toLowerCase())) l = 'pages/guides/' + it.id + '.html'; return l; }
  function isDigital(it) { return !!linkOf(it) || /guide|walkthrough/.test(String(it.kind || it.type || it.category || '').toLowerCase()); }
  function paid(o) { return o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function date(iso) {
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return ''; }
  }

  function render(orders) {
    var good = orders.filter(paid);
    if (!good.length) {
      root.innerHTML = '<div class="ord__card ord__empty"><h2>Nothing here yet</h2><p class="ord__muted" style="margin-inline:auto">Orders you pay for in this browser appear here, with every guide and walkthrough unlocked.</p>' +
        '<div class="ord__actions" style="justify-content:center"><a class="btn" href="services.html">See services and guides</a></div></div>';
      return;
    }
    var unlocked = {}, order = [];
    good.forEach(function (o) {
      (o.lines || []).forEach(function (l) {
        var it = itemOf(l.item);
        if (isDigital(it) && !unlocked[l.item]) { unlocked[l.item] = { name: l.name, link: linkOf(it), number: o.number }; order.push(l.item); }
      });
    });
    var h = '<section class="ord__card" aria-labelledby="acc-guides"><h2 id="acc-guides">Unlocked guides and walkthroughs</h2>';
    if (order.length) {
      h += '<ul class="ord__list">' + order.map(function (id) {
        var u = unlocked[id];
        return '<li><span class="ord__unlock"><span class="ord__badge">Unlocked</span> ' + esc(u.name) + '</span>' +
          (u.link ? '<a class="btn" href="' + esc(Shop.url(u.link)) + '">Open</a>' : '<span class="ord__muted">Order ' + esc(u.number) + '</span>') + '</li>';
      }).join('') + '</ul>';
    } else {
      h += '<p class="ord__muted">Your orders so far are services, not guides. Guides you buy will unlock here.</p>' +
        '<div class="ord__actions"><a class="btn btn--ghost" href="services.html">Browse guides</a></div>';
    }
    h += '</section><section class="ord__card ord__orders" aria-labelledby="acc-orders"><h2 id="acc-orders">Your orders</h2><ul class="ord__list">' +
      good.map(function (o) {
        return '<li><span><strong>Order ' + esc(o.number) + '</strong> · ' + esc(date(o.placedAt)) + '<br><span class="ord__muted">' +
          (o.lines || []).map(function (l) { return esc(l.qty + ' × ' + l.name); }).join(', ') + '</span></span>' +
          '<span>' + Shop.money(o.total, o.currency) + ' · <a href="order.html?o=' + encodeURIComponent(o.token) + '">View order</a></span></li>';
      }).join('') + '</ul></section>';
    root.innerHTML = h;
  }

  var tokens = Shop.orders();
  Shop.catalog().then(function (c) { cat = c; }, function () {}).then(function () {
    if (!tokens.length) return render([]);
    return Shop.api('orders/lookup', { tokens: tokens.slice(0, 30) }).then(function (r) { render(r.orders || []); },
      function (e) { root.innerHTML = '<div class="ord__error" role="alert">' + esc(e.message) + '</div>'; });
  });
})();
