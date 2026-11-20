/* Shared shop helpers (Lead Developer). Exposes window.Shop. Loaded with defer on every shop page. */
(function () {
  'use strict';
  var script = document.currentScript;
  var ROOT = new URL('../../', script ? script.src : location.href).href;
  var API = ROOT + 'api/shop/';
  var SITE = (ROOT.match(/\/s\/([^\/]+)\/$/) || [])[1] || location.hostname.split('.')[0] || 'site';
  var PREFIX = 'shop:' + SITE + ':';
  var memory = {};

  function get(key, fallback) {
    try { var v = localStorage.getItem(PREFIX + key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return key in memory ? memory[key] : fallback; }
  }
  function set(key, value) {
    memory[key] = value;
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {}
    return value;
  }

  function customerId() {
    var id = get('customer', null);
    if (!id) {
      var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', out = '';
      var buf = new Uint8Array(24);
      (window.crypto || {}).getRandomValues ? crypto.getRandomValues(buf) : buf.forEach(function (_, i) { buf[i] = Math.random() * 256; });
      for (var i = 0; i < 24; i++) out += chars[buf[i] % chars.length];
      id = set('customer', out);
    }
    return id;
  }

  function api(path, body) {
    var opts = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    return fetch(API + path, opts).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok || data.error) throw new Error(data.error || 'Something went wrong. Please try again.');
        return data;
      });
    });
  }

  var catalogPromise;
  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetch(ROOT + 'shop/catalog.json', { cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('The service list could not be loaded.');
        return r.json();
      });
    }
    return catalogPromise;
  }

  var currency = 'EUR';
  function money(cents, cur) {
    cur = cur || currency;
    try { return new Intl.NumberFormat(document.documentElement.lang || 'en', { style: 'currency', currency: cur }).format(cents / 100); }
    catch (e) { return (cents / 100).toFixed(2) + ' ' + cur; }
  }
  loadCatalog().then(function (c) { if (c && c.currency) currency = c.currency; }).catch(function () {});

  // Cart: lines exactly as the service takes them.
  function cart() { return get('cart', []); }
  function saveCart(lines) { set('cart', lines); window.dispatchEvent(new Event('shop:cart')); return lines; }
  function sameLine(a, b) {
    return a.item === b.item && JSON.stringify(a.options || {}) === JSON.stringify(b.options || {}) && (a.note || '') === (b.note || '');
  }
  function addToCart(line) {
    var lines = cart(), n = { item: line.item, qty: line.qty || 1, options: line.options || {}, note: line.note || '' };
    for (var i = 0; i < lines.length; i++) if (sameLine(lines[i], n)) { lines[i].qty += n.qty; return saveCart(lines); }
    lines.push(n);
    return saveCart(lines);
  }
  function cartCount() { return cart().reduce(function (s, l) { return s + (l.qty || 0); }, 0); }

  function orders() { return get('orders', []); }
  function addOrder(token) { var o = orders().filter(function (t) { return t !== token; }); o.unshift(token); return set('orders', o.slice(0, 30)); }

  function toast(message, kind) {
    var host = document.getElementById('shop-toasts');
    if (!host) {
      host = document.createElement('div'); host.id = 'shop-toasts';
      host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite');
      document.body.appendChild(host);
    }
    var t = document.createElement('div');
    t.className = 'shop-toast' + (kind ? ' shop-toast--' + kind : '');
    t.textContent = message;
    host.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-in'); });
    setTimeout(function () { t.classList.remove('is-in'); setTimeout(function () { t.remove(); }, 400); }, 3600);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(path) { return new URL(path, ROOT).href; }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function download(filename, text) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  window.Shop = {
    ROOT: ROOT, API: API, SITE: SITE, PREFIX: PREFIX,
    get: get, set: set, customerId: customerId, api: api, url: url, param: param, esc: esc, download: download,
    catalog: loadCatalog, money: money, toast: toast,
    cart: cart, saveCart: saveCart, addToCart: addToCart, cartCount: cartCount,
    orders: orders, addOrder: addOrder,
    openCart: function () { window.dispatchEvent(new Event('shop:cart-open')); },
    TEST_LABEL: 'Demo shop: test payments only. No real money moves.'
  };
  document.documentElement.classList.add('has-shop');
})();
