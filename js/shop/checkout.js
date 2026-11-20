/* Checkout and payment (Senior Developer 3). */
(function () {
  'use strict';
  var S = window.Shop;
  var $ = function (id) { return document.getElementById(id); };
  var state = { coupon: 'best', gift: '', quote: null, busy: false };
  var quoteSeq = 0;

  function init() {
    var p = S.get('profile', {}) || {};
    $('co-name').value = p.name || '';
    $('co-email').value = p.email || '';
    $('co-coupon').addEventListener('change', function () { state.coupon = this.value; refresh(); });
    $('co-gift-apply').addEventListener('click', function () { applyGift($('co-gift').value); });
    $('co-gift').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyGift(this.value); } });
    $('co-form').addEventListener('submit', submit);
    renderWallet();

    var cancelled = S.param('cancelled');
    if (cancelled) {
      $('co-banner').textContent = 'Payment cancelled. Nothing was charged and your cart is kept.';
      S.api('orders/' + encodeURIComponent(cancelled) + '/cancel', {}).catch(function () {});
      history.replaceState(null, '', location.pathname);
    }
    refresh();
  }

  function renderWallet() {
    var codes = S.get('wallet', []) || [], host = $('co-wallet');
    host.innerHTML = '';
    codes.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'shop-chip';
      b.textContent = (c === state.gift ? '✓ ' : '') + 'Gift card ' + String(c).slice(-4);
      b.setAttribute('aria-pressed', c === state.gift ? 'true' : 'false');
      b.addEventListener('click', function () { applyGift(c === state.gift ? '' : c); });
      host.appendChild(b);
    });
  }

  function applyGift(code) {
    code = String(code || '').trim();
    $('co-gift-err').textContent = '';
    var prev = state.gift;
    state.gift = code;
    refresh().then(function (ok) {
      if (!ok) { state.gift = prev; $('co-gift-err').textContent = state.lastError || 'That gift card could not be used.'; refresh(); }
      else { if (code) $('co-gift').value = ''; renderWallet(); }
    });
  }

  function body() {
    var b = { items: S.cart(), customer: S.customerId() };
    if (state.coupon) b.coupon = state.coupon;
    if (state.gift) b.giftCard = state.gift;
    return b;
  }

  function refresh() {
    var cart = S.cart(), seq = ++quoteSeq;
    $('co-empty').hidden = cart.length > 0;
    $('co-grid').hidden = cart.length === 0;
    if (!cart.length) return Promise.resolve(true);
    $('co-pay').disabled = true;
    return S.api('quote', body()).then(function (q) {
      if (seq !== quoteSeq) return true;
      state.quote = q; $('co-error').textContent = ''; state.lastError = '';
      render(q); return true;
    }).catch(function (e) {
      if (seq !== quoteSeq) return false;
      state.lastError = e.message; $('co-error').textContent = e.message; return false;
    });
  }

  function render(q) {
    var cur = q.currency, m = function (c) { return S.money(c, cur); };
    $('co-lines').innerHTML = q.lines.map(function (l) {
      return '<li><span>' + S.esc(l.name) + ' × ' + l.qty + (l.summary ? '<small>' + S.esc(l.summary) + '</small>' : '') + '</span><span>' + m(l.total) + '</span></li>';
    }).join('');
    var rows = ['<div><dt>Subtotal</dt><dd>' + m(q.subtotal) + '</dd></div>'];
    if (q.discount) rows.push('<div class="is-saving"><dt>Coupon ' + S.esc(q.discount.code) + '</dt><dd>−' + m(q.discount.amount) + '</dd></div>');
    if (q.giftCard) rows.push('<div class="is-saving"><dt>Gift card ' + S.esc(q.giftCard.last4) + '</dt><dd>−' + m(q.giftCard.applied) + '</dd></div>');
    rows.push('<div class="is-total"><dt>Total</dt><dd>' + m(q.total) + '</dd></div>');
    $('co-totals').innerHTML = rows.join('');
    var sel = $('co-coupon'), usable = q.usable || [];
    sel.innerHTML = '<option value="best">Best coupon (automatic)</option><option value="">No coupon</option>' +
      usable.map(function (u) { return '<option value="' + S.esc(u.code) + '"' + (u.amount ? '' : ' disabled') + '>' + S.esc(u.code) + ' · ' + S.esc(u.name) + (u.amount ? ' (−' + m(u.amount) + ')' : '') + '</option>'; }).join('');
    sel.value = state.coupon;
    var hint = '';
    if (state.coupon === 'best') hint = q.discount ? 'Applied the best: ' + q.discount.name + '.' : 'No coupon applies to this order.';
    else if (state.coupon) { var u = usable.filter(function (x) { return x.code === state.coupon; })[0]; hint = u && u.why ? u.why : ''; }
    $('co-coupon-hint').textContent = hint;
    $('co-pay').textContent = q.total > 0 ? 'Pay ' + m(q.total) : 'Place order';
    $('co-pay').disabled = false;
  }

  function validate() {
    var ok = true, name = $('co-name').value.trim(), email = $('co-email').value.trim();
    $('co-name-err').textContent = name ? '' : 'Please enter your name.';
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    $('co-email-err').textContent = emailOk ? '' : 'Please enter a valid email address.';
    if (!name) { $('co-name').focus(); ok = false; }
    else if (!emailOk) { $('co-email').focus(); ok = false; }
    return ok;
  }

  function submit(e) {
    e.preventDefault();
    if (state.busy || !validate()) return;
    var name = $('co-name').value.trim(), email = $('co-email').value.trim(), note = $('co-note').value.trim();
    S.set('profile', Object.assign({}, S.get('profile', {}), { name: name, email: email }));
    var b = body();
    b.name = name;
    b.note = ('Email: ' + email + (note ? ' | ' + note : '')).slice(0, 300);
    b.email = email;
    S.catalog().then(function (c) {
      var st = S.get('store', null) || (c.stores && c.stores[0] && c.stores[0].id);
      if (st) b.store = st;
    }).catch(function () {}).then(function () {
      state.busy = true; $('co-pay').disabled = true; $('co-pay').textContent = 'Placing order…';
      return S.api('orders', b);
    }).then(function (r) {
      S.addOrder(r.order.token);
      if (r.pay && r.pay.url) { location.href = r.pay.url; }
      else { S.saveCart([]); location.href = S.url('pages/order.html?o=' + encodeURIComponent(r.order.token)); }
    }).catch(function (err) {
      state.busy = false; $('co-error').textContent = err.message; S.toast(err.message, 'error');
      if (state.quote) render(state.quote);
    });
  }

  window.addEventListener('shop:cart', function () { refresh(); });
  if (S) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init(); }
})();
