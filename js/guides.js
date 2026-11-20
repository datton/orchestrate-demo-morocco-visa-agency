/* guides.js (Senior Dev 5): guides hub filter + passport-date checker. Shared by guide pages. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  // Hub: filter cards by text
  var f = $('#g-filter');
  if (f) {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.g-card'));
    var count = $('#g-count');
    f.addEventListener('input', function () {
      var q = f.value.trim().toLowerCase(), n = 0;
      cards.forEach(function (c) {
        var show = !q || c.textContent.toLowerCase().indexOf(q) > -1;
        c.hidden = !show; if (show) n++;
      });
      count.textContent = q ? n + (n === 1 ? ' guide' : ' guides') + ' found' : '';
    });
  }

  // Passport checker (confirmed UK rule only: expiry at least 3 months after arrival)
  var form = $('#visa-check');
  if (form) {
    var out = $('#vc-result');
    var fmt = function (d) {
      return ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear();
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = $('#vc-pass').value, a = $('#vc-arrive').value, x = $('#vc-expiry').value;
      var msg;
      if (!p || !a || !x) { msg = 'Please fill in all three fields.'; }
      else if (p !== 'uk') {
        msg = 'We have no confirmed rule for this passport. Check whether it needs a visa, and how much validity you need, with the Moroccan embassy or consulate.';
      } else {
        var arr = new Date(a + 'T00:00:00'), exp = new Date(x + 'T00:00:00');
        var min = new Date(arr); min.setMonth(min.getMonth() + 3);
        if (exp >= min) msg = 'Your passport expires on ' + fmt(exp) + ', at least 3 months after arrival (' + fmt(arr) + '; needed from ' + fmt(min) + '). This meets the UK government rule checked 20.11.2026. For tourism, UK passport holders can stay up to 90 days without a visa.';
        else msg = 'Your passport expires on ' + fmt(exp) + '. The UK government says it must expire at least 3 months after arrival, so on or after ' + fmt(min) + '. Consider renewing before you travel.';
      }
      out.textContent = msg;
    });
  }
})();
