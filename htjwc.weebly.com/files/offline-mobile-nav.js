(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    // Theme custom.js already wires the menu when jQuery loaded.
    if (window.jQuery) return;

    var hamburger = document.querySelector('.cento-header .hamburger');
    if (hamburger && !hamburger.getAttribute('data-offline-nav')) {
      hamburger.setAttribute('data-offline-nav', '1');
      hamburger.addEventListener('click', function (e) {
        e.preventDefault();
        document.body.classList.toggle('nav-open');
      });
    }

    document.querySelectorAll('.mobile-nav .wsite-menu-item-wrap').forEach(function (li) {
      var wrap = null;
      for (var i = 0; i < li.children.length; i++) {
        if (li.children[i].classList && li.children[i].classList.contains('wsite-menu-wrap')) {
          wrap = li.children[i];
          break;
        }
      }
      if (!wrap) return;
      li.classList.add('has-submenu');
      var caret = null;
      for (var j = 0; j < li.children.length; j++) {
        if (li.children[j].classList && li.children[j].classList.contains('icon-caret')) {
          caret = li.children[j];
          break;
        }
      }
      if (!caret) {
        caret = document.createElement('span');
        caret.className = 'icon-caret';
        var link = li.querySelector('a.wsite-menu-item, a.wsite-menu-subitem');
        if (link && link.nextSibling) li.insertBefore(caret, link.nextSibling);
        else li.appendChild(caret);
      }
      if (caret.getAttribute('data-offline-nav')) return;
      caret.setAttribute('data-offline-nav', '1');
      caret.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        wrap.classList.toggle('open');
      });
    });
  });
})();
