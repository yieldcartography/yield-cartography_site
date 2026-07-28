/*!
 * yieldcartography embed loader
 * Usage on a third-party page:
 *   <script src="https://yieldcartography.com/embed.js" data-chart="yield-curve"></script>
 * Supported data-chart values: yield-curve, term-premia, oracle.
 * The script replaces itself with a responsive, auto-sizing iframe of the
 * chosen chart. Framing is allowed only from origins whitelisted in the
 * site _headers (Content-Security-Policy: frame-ancestors).
 */
(function () {
  var ORIGIN = 'https://yieldcartography.com';
  var CHARTS = {
    'yield-curve': '/curves/',
    'term-premia': '/term-premia/',
    'oracle': '/oracle/'
  };

  var self = document.currentScript;
  if (!self) {
    // Fallback: last script tag on the page pointing at embed.js
    var all = document.getElementsByTagName('script');
    for (var i = all.length - 1; i >= 0; i--) {
      if ((all[i].src || '').indexOf('embed.js') !== -1) { self = all[i]; break; }
    }
  }
  if (!self) return;

  var key = (self.getAttribute('data-chart') || 'yield-curve').toLowerCase();
  var path = CHARTS[key] || CHARTS['yield-curve'];

  var iframe = document.createElement('iframe');
  iframe.src = ORIGIN + path + '?embed=1';
  iframe.title = 'yieldcartography: ' + key;
  iframe.loading = 'lazy';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('allowtransparency', 'true');
  iframe.style.cssText =
    'width:100%;border:0;display:block;overflow:hidden;' +
    'min-height:' + (key === 'oracle' ? '760px' : '560px') + ';';

  // Insert the iframe where the script tag sits.
  self.parentNode.insertBefore(iframe, self.nextSibling);

  // Auto-size to the content height reported by the embedded page.
  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return;
    var d = e.data;
    if (d && d.type === 'yc-embed-height' && d.height && e.source === iframe.contentWindow) {
      iframe.style.height = d.height + 'px';
    }
  });
})();
