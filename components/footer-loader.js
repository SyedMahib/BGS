/**
 * BGS Footer Loader
 * -----------------
 * Fetches components/footer.html and injects it into
 * any element with id="bgs-footer".
 *
 * Works on both localhost (Live Server) and GitHub Pages / Netlify.
 *
 * HOW TO USE — add these 2 lines where the old <footer> used to be:
 *
 *   <div id="bgs-footer"></div>
 *   <script src="components/footer-loader.js"></script>
 */

(function () {
  const placeholder = document.getElementById('bgs-footer');
  if (!placeholder) {
    console.warn('[BGS] No element with id="bgs-footer" found.');
    return;
  }

  // Auto-detect base path from this script's own src attribute
  const scriptTag = document.querySelector('script[src*="footer-loader.js"]');
  const basePath = scriptTag
    ? scriptTag.src.replace('footer-loader.js', '')
    : 'components/';

  fetch(basePath + 'footer.html')
    .then(function (res) {
      if (!res.ok) throw new Error('Could not load footer: ' + res.status);
      return res.text();
    })
    .then(function (html) {
      // Strip <script> tags, collect their content
      const scriptContents = [];
      const htmlWithoutScripts = html.replace(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi, function (match, scriptContent) {
        scriptContents.push(scriptContent);
        return '';
      });

      placeholder.innerHTML = htmlWithoutScripts;

      // Set live copyright year
      const yearEl = placeholder.querySelector('#bgs-footer-year');
      if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
      }

      // Re-run any scripts after injection
      scriptContents.forEach(function (content) {
        const script = document.createElement('script');
        script.textContent = content;
        document.body.appendChild(script);
      });

      // Re-init AOS for the newly injected footer content, if AOS is loaded
      if (window.AOS && typeof window.AOS.refresh === 'function') {
        window.AOS.refresh();
      }
    })
    .catch(function (err) {
      console.error('[BGS Footer Loader]', err);
    });
})();