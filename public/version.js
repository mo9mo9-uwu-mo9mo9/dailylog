// Append version info next to © DailyLog across pages
// Fetches /api/version with no-store and appends " · <commit> · <built_at(min)>"
(function () {
  function fmtBuiltAtMin(iso) {
    try {
      const s = new Date(iso).toISOString();
      return s.slice(0, 16) + 'Z'; // YYYY-MM-DDTHH:MMZ
    } catch (_) {
      return iso || '';
    }
  }
  async function run() {
    try {
      const res = await fetch('api/version', { cache: 'no-store' });
      if (!res.ok) return;
      const v = await res.json();
      const small = document.querySelector('footer small');
      if (!small) return;
      const parts = [];
      // develop 環境（/dailylog-dev 配下）のときは "Dev <hash>" と表示
      const isDev = (location.pathname || '').includes('/dailylog-dev');
      if (v?.commit && v.commit !== 'unknown') {
        const commitText = (isDev ? 'Dev ' : '') + String(v.commit);
        parts.push(commitText);
      }
      if (v?.built_at) parts.push(fmtBuiltAtMin(v.built_at));
      if (parts.length === 0) return;
      // Ensure delimiter prefix
      const text = ' · ' + parts.join(' · ');
      // Avoid duplicate injection if script runs twice
      if (!small.dataset.versionAppended) {
        small.insertAdjacentText('beforeend', text);
        small.dataset.versionAppended = '1';
      }
    } catch (_) {
      // ignore failures silently
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
