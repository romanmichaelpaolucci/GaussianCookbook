(function () {
    var el = document.getElementById('footer-yt-sub-count');
    if (!el) return;
    var fallback = parseInt(el.getAttribute('data-fallback') || '73320', 10) || 73320;
    function show(n) {
        el.textContent = n.toLocaleString('en-US');
    }
    fetch('static/data/youtube-subs.json', { cache: 'no-store' })
        .then(function (r) {
            return r.ok ? r.json() : Promise.reject();
        })
        .then(function (d) {
            var n = parseInt(d.subscribers, 10);
            show(!isNaN(n) ? n : fallback);
        })
        .catch(function () {
            show(fallback);
        });
})();
