/**
 * BGS Navbar Loader
 * -----------------
 * Fetches /components/navbar.html and injects it into
 * any element with id="bgs-navbar".
 *
 * HOW TO USE — add these 2 lines inside <body>, before your page content:
 *
 *   <div id="bgs-navbar"></div>
 *   <script src="/components/navbar-loader.js"></script>
 */

(function () {
  const placeholder = document.getElementById('bgs-navbar');
  if (!placeholder) {
    console.warn('[BGS] No element with id="bgs-navbar" found.');
    return;
  }

  fetch('/components/navbar.html')
    .then(function (res) {
      if (!res.ok) throw new Error('Could not load navbar: ' + res.status);
      return res.text();
    })
    .then(function (html) {
      placeholder.innerHTML = html;

      // Re-run any <script> tags inside the injected HTML
      placeholder.querySelectorAll('script').forEach(function (oldScript) {
        const newScript = document.createElement('script');
        newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        oldScript.remove();
      });
    })
    .catch(function (err) {
      console.error('[BGS Navbar Loader]', err);
    });
})();