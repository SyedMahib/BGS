/**
 * BGS Navbar Loader
 * -----------------
 * Fetches /components/navbar.html and injects it into
 * any element with id="bgs-navbar".
 *
 * Works on both localhost (Live Server) and GitHub Pages (/BGS/).
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

  // Auto-detect base path: works for localhost AND GitHub Pages (/BGS/)
  const scriptTag = document.querySelector('script[src*="navbar-loader.js"]');
  const basePath = scriptTag
    ? scriptTag.src.replace('navbar-loader.js', '')
    : '/components/';

  fetch(basePath + 'navbar.html')
    .then(function (res) {
      if (!res.ok) throw new Error('Could not load navbar: ' + res.status);
      return res.text();
    })
    .then(function (html) {
      // Strip <script> tags from injected HTML, collect their content
      const scriptContents = [];
      const htmlWithoutScripts = html.replace(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi, function (match, scriptContent) {
        scriptContents.push(scriptContent);
        return '';
      });

      // Inject the HTML (no scripts)
      placeholder.innerHTML = htmlWithoutScripts;

      // Re-run each script by creating a new <script> element
      // This ensures the JS executes AFTER the HTML is in the DOM
      scriptContents.forEach(function (content) {
        const script = document.createElement('script');
        script.textContent = content;
        document.body.appendChild(script);
      });

      // Highlight active nav link based on current page
      const currentPath = window.location.pathname;
      document.querySelectorAll('#bgs-navbar .nav-link, #bgs-navbar .mobile-menu-links a').forEach(function (link) {
        try {
          const linkPath = new URL(link.href, window.location.origin).pathname;
          if (linkPath === currentPath) {
            link.style.color = '#D99E3F';
          }
        } catch (e) {}
      });
    })
    .catch(function (err) {
      console.error('[BGS Navbar Loader]', err);
    });
})();