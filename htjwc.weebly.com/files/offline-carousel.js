(function () {
  function initCarousel(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('.offline-carousel-slide'));
    if (!slides.length) return;

    var dotsWrap = root.querySelector('.offline-carousel-dots');
    var prevBtn = root.querySelector('.offline-carousel-prev');
    var nextBtn = root.querySelector('.offline-carousel-next');
    var intervalMs = parseInt(root.getAttribute('data-interval') || '5000', 10);
    var index = 0;
    var timer = null;

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (slide, n) {
        slide.classList.toggle('is-active', n === index);
      });
      if (dotsWrap) {
        Array.prototype.forEach.call(dotsWrap.children, function (dot, n) {
          dot.classList.toggle('is-active', n === index);
        });
      }
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function start() {
      stop();
      if (slides.length < 2) return;
      timer = setInterval(next, intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    if (dotsWrap && !dotsWrap.children.length) {
      slides.forEach(function (_, n) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'offline-carousel-dot' + (n === 0 ? ' is-active' : '');
        dot.setAttribute('aria-label', '第 ' + (n + 1) + ' 張');
        dot.addEventListener('click', function () {
          goTo(n);
          start();
        });
        dotsWrap.appendChild(dot);
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); start(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); start(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    goTo(0);
    start();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('.offline-carousel'), initCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
