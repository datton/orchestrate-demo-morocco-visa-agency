/* Order confirmation (Senior Developer 4): pages/order.html?o=<token> */
(function () {
  'use strict';
  var root = document.getElementById('order-root');
  var token = Shop.param('o');
  var cat = null, timer = null, tick = null, lastOrder = null;
  var esc = Shop.esc;

  function listOf(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }
  function meta(line) {
    var item = ((cat && cat.items) || []).filter(function (i) { return i.id === line.item; })[0] || {};
    var link = item.guide || item.unlock || item.link || item.url || item.page || '';
    var kind = String(item.kind || item.type || item.category || '').toLowerCase();
    var digital = !!link || /guide|walkthrough/.test(kind);
    var next = listOf(item.next || item.afterBuying || item.whatNext || item.after);
    var prep = listOf(item.prepare || item.bring || item.toPrepare);
    return { link: link, digital: digital, next: next, prep: prep };
  }
  function fmtDate(iso) {
    try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return iso || ''; }
  }
  function paid(o) { return o && o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }

  function receipt(o) {
    var t = ['RECEIPT (demo shop: test payment, no real money moved)', '', (cat && cat.brand && cat.brand.name) || Shop.SITE,
      'Order number: ' + o.number, 'Placed: ' + fmtDate(o.placedAt), 'Name: ' + (o.name || ''), ''];
    (o.lines || []).forEach(function (l) {
      t.push(l.qty + ' x ' + l.name + (l.summary ? ' (' + l.summary + ')' : '') + '  ' + Shop.money(l.total, o.currency));
    });
    t.push('');
    t.push('Subtotal: ' + Shop.money(o.subtotal, o.currency));
    if (o.discount) t.push('Discount ' + o.discount.code + ': -' + Shop.money(o.discount.amount, o.currency));
    if (o.giftCard) t.push('Gift card: -' + Shop.money(o.giftCard.applied, o.currency));
    t.push('Total paid: ' + Shop.money(o.total, o.currency));
    if (o.payment && o.payment.card) t.push('Payment: ' + o.payment.card);
    t.push('', 'Status: ' + (o.statusLabel || o.status));
    return t.join('\n');
  }

  function render(o) {
    lastOrder = o;
    var ok = paid(o);
    var h = '<p class="ord__eyebrow">Order confirmation</p>';
    if (o.status === 'cancelled' || o.status === 'refunded') {
      h += '<h1 class="ord__title">Order ' + esc(o.status === 'refunded' ? 'refunded' : 'cancelled') + '</h1>' +
        '<p class="ord__muted">This order was ' + esc(o.status) + (o.status === 'refunded' ? ' and the test payment returned' : '') + '. Nothing is owed.</p>' +
        '<div class="ord__actions"><a class="btn" href="services.html">Back to services</a></div>';
    } else if (!ok) {
      h += '<h1 class="ord__title">Waiting for your payment…</h1><p class="ord__muted">This page updates by itself once the test payment goes through.</p>';
    } else {
      h += '<h1 class="ord__title">Thank you' + (o.firstName ? ', ' + esc(o.firstName) : '') + '. You are all set.</h1>' +
        '<div class="ord__number"><small>Order number</small><strong>' + esc(o.number) + '</strong></div>';
    }
    if (ok) {
      var steps = (o.steps || []).map(function (s) { return '<li class="' + (s.at ? 'is-done' : '') + '">' + esc(s.label) + (s.at ? ' &#10003;' : '') + '</li>'; }).join('');
      var metas = (o.lines || []).map(meta);
      h += '<section class="ord__card" aria-labelledby="ord-bought"><h2 id="ord-bought">What you bought</h2><ul class="ord__lines">' +
        (o.lines || []).map(function (l) {
          return '<li><span>' + esc(l.qty) + ' × ' + esc(l.name) + (l.summary ? '<small>' + esc(l.summary) + '</small>' : '') + '</span><span>' + Shop.money(l.total, o.currency) + '</span></li>';
        }).join('') + '</ul>' +
        '<div class="ord__sub"><span>Subtotal</span><span>' + Shop.money(o.subtotal, o.currency) + '</span></div>' +
        (o.discount ? '<div class="ord__sub"><span>' + esc(o.discount.name || o.discount.code) + '</span><span>−' + Shop.money(o.discount.amount, o.currency) + '</span></div>' : '') +
        (o.giftCard ? '<div class="ord__sub"><span>Gift card</span><span>−' + Shop.money(o.giftCard.applied, o.currency) + '</span></div>' : '') +
        '<div class="ord__sum"><span>Total paid</span><span>' + Shop.money(o.total, o.currency) + '</span></div>' +
        (o.payment && o.payment.card ? '<p class="ord__muted">Paid with ' + esc(o.payment.card) + ' (test card)</p>' : '') + '</section>';

      h += '<section class="ord__card" aria-labelledby="ord-next"><h2 id="ord-next">What happens next</h2>' +
        (steps ? '<ol class="ord__steps">' + steps + '</ol>' : '') +
        (o.lines || []).map(function (l, i) {
          var m = metas[i], b = '<div class="ord__next"><h3>' + esc(l.name) + '</h3>';
          if (m.digital) {
            b += '<p>Unlocked now. Open it any time from <a href="account.html">My purchases</a>' + (m.link ? ' or straight away: <a href="' + esc(Shop.url(m.link)) + '">open it</a>' : '') + '.</p>';
          } else {
            b += '<p>We will use the name and details from checkout to start. Your order number is ' + esc(o.number) + '; keep it handy.</p>';
          }
          m.next.forEach(function (n) { b += '<p>' + esc(n) + '</p>'; });
          if (m.prep.length) b += '<p><strong>Have ready:</strong> ' + m.prep.map(esc).join(', ') + '.</p>';
          return b + '</div>';
        }).join('') + '<p class="ord__muted">This is a demo: no email or message is really sent.</p></section>';

      h += '<div class="ord__actions"><button class="btn" type="button" id="ord-receipt">Download receipt</button>' +
        '<a class="btn btn--ghost" href="account.html">My purchases</a>' +
        '<a class="btn btn--ghost" href="services.html">More services</a>' +
        (o.cancellable ? '<button class="btn btn--ghost" type="button" id="ord-cancel">Cancel (<span id="ord-count"></span>)</button>' : '') + '</div>';
    }
    root.innerHTML = h;
    var r = document.getElementById('ord-receipt');
    if (r) r.addEventListener('click', function () { Shop.download('receipt-' + o.number + '.txt', receipt(o)); });
    var c = document.getElementById('ord-cancel');
    if (c) c.addEventListener('click', function () {
      c.disabled = true;
      Shop.api('orders/' + encodeURIComponent(token) + '/cancel', {}).then(render, function (e) { Shop.toast(e.message, 'error'); c.disabled = false; });
    });
    clearInterval(tick);
    var cnt = document.getElementById('ord-count');
    if (cnt && o.cancellableUntil) {
      var upd = function () { var s = Math.max(0, Math.round((new Date(o.cancellableUntil) - Date.now()) / 1000)); cnt.textContent = s + ' s'; if (!s) { clearInterval(tick); } };
      upd(); tick = setInterval(upd, 1000);
    }
  }

  function fail(msg) {
    root.innerHTML = '<p class="ord__eyebrow">Order confirmation</p><h1 class="ord__title">We could not open this order</h1>' +
      '<div class="ord__error" role="alert">' + esc(msg) + '</div><div class="ord__actions"><a class="btn" href="account.html">My purchases</a><a class="btn btn--ghost" href="services.html">Services</a></div>';
  }

  function poll() {
    Shop.api('orders/' + encodeURIComponent(token)).then(function (res) {
      var o = res.order || res;
      if (lastOrder && JSON.stringify(lastOrder) === JSON.stringify(o)) { schedule(o); return; }
      render(o); schedule(o);
    }, function (e) { if (!lastOrder) fail(e.message); else schedule(lastOrder); });
  }
  function schedule(o) {
    clearTimeout(timer);
    var done = o && (o.status === 'collected' || o.status === 'cancelled' || o.status === 'refunded');
    if (!done) timer = setTimeout(poll, 3000);
  }

  if (!token) { fail('There is no order number in this link. Open an order from My purchases.'); return; }
  Shop.addOrder(token);
  Shop.catalog().then(function (c) { cat = c; }, function () {}).then(poll);
})();
