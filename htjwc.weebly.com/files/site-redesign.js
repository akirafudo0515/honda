(function () {
  var NAV = [
    { href: 'index.html', label: '使用說明' },
    { href: '293053200421830242152099839006.html', label: '商店分類' },
    { href: '2930532004242152347823560236602796321205.html', label: '專屬活動' },
    { href: '229142030925104288582148828771264123000029305320042421523478.html', label: '成為特約店家' },
    { href: 'contact.html', label: 'CONTACT' },
  ];

  var CATS = [
    { href: '39184391543900629305320042421523478.html', name: '餐飲相關特約店家' },
    { href: '2165421857-middot-4067024515-middot-299802169739006.html', name: '咖啡 · 點心 · 甜品類' },
    { href: '260533920827665234873900629305320042183024215.html', name: '旅館民宿特約店家' },
    { href: '202762516331150352642080924037242883678633674.html', name: '伴手禮／觀光工廠特約店家' },
    { href: '299832796320241382903900629305320042421523478.html', name: '生活休閒類特約店家' },
    { href: '29983279632638121209214503609229289.html', name: '生活服務及購物' },
  ];

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  function fileName() {
    var p = location.pathname.split('/').pop() || 'index.html';
    return p === '' ? 'index.html' : p;
  }

  function isActive(href, current) {
    if (href === 'index.html') {
      return current === 'index.html' || current === '';
    }
    return current === href || current.indexOf(href.replace('.html', '')) === 0;
  }

  function sanitizeColors(root) {
    if (!root) return;
    root.querySelectorAll('[style], font[color]').forEach(function (el) {
      if (el.hasAttribute('color')) el.removeAttribute('color');
      if (el.style) {
        el.style.color = '';
        el.style.backgroundColor = '';
      }
    });
  }

  function buildHeader() {
    if (document.querySelector('.honda-header')) return;

    var current = fileName();
    var top = document.createElement('div');
    top.className = 'honda-topbar';

    var header = document.createElement('header');
    header.className = 'honda-header';
    header.innerHTML =
      '<div class="honda-header-inner">' +
      '<a class="honda-brand" href="index.html">' +
      '<span class="honda-brand-mark">HONDA</span>' +
      '<span class="honda-brand-text">' +
      '<strong>台灣本田聯合福委會</strong>' +
      '<span>特約商店公佈欄</span>' +
      '</span></a>' +
      '<nav class="honda-nav" aria-label="主選單"></nav>' +
      '<button class="honda-menu-btn" type="button" aria-label="開啟選單" aria-expanded="false"><i></i><i></i><i></i></button>' +
      '</div>';

    var nav = header.querySelector('.honda-nav');
    NAV.forEach(function (item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      if (isActive(item.href, current)) a.className = 'is-active';
      nav.appendChild(a);
    });

    var drawer = document.createElement('div');
    drawer.className = 'honda-nav-drawer';
    drawer.innerHTML = '<p class="drawer-label">Menu</p>';
    NAV.forEach(function (item) {
      var a = document.createElement('a');
      a.href = item.href;
      a.textContent = item.label;
      if (isActive(item.href, current)) a.className = 'is-active';
      drawer.appendChild(a);
    });
    drawer.insertAdjacentHTML('beforeend', '<p class="drawer-label">Store Categories</p>');
    CATS.forEach(function (c) {
      var a = document.createElement('a');
      a.href = c.href;
      a.textContent = c.name;
      drawer.appendChild(a);
    });

    document.body.insertBefore(top, document.body.firstChild);
    document.body.insertBefore(header, top.nextSibling);
    document.body.appendChild(drawer);

    var menuBtn = header.querySelector('.honda-menu-btn');
    menuBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('honda-nav-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.body.classList.remove('honda-nav-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });

    window.addEventListener(
      'scroll',
      function () {
        header.classList.toggle('is-scrolled', window.scrollY > 8);
      },
      { passive: true }
    );
  }

  function rebuildHome() {
    if (!document.body.classList.contains('wsite-page-index')) return;
    var content = document.getElementById('wsite-content');
    if (!content || content.getAttribute('data-honda-home') === '1') return;

    var heroImg = content.querySelector('.wsite-background-3 img');
    var titleEl = content.querySelector('.wsite-background-4 .wsite-content-title');
    var figureImg = content.querySelector('.wsite-background-4 .wsite-section-elements > div .wsite-image img');
    var para = content.querySelector('.wsite-background-4 .paragraph');
    var line = content.querySelector('.wcustomhtml');
    var carousel = content.querySelector('.offline-carousel');
    var endImg = content.querySelector(
      '.wsite-background-4 .wsite-section-elements > div:last-child .wsite-image img'
    );

    var titleText = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    var reqs = [];
    var beforeHtml = '';
    var afterHtml = '';

    if (para) {
      var clone = para.cloneNode(true);
      sanitizeColors(clone);
      clone.querySelectorAll('li').forEach(function (li) {
        var t = li.textContent.trim();
        if (t) reqs.push(t);
      });
      var ol = clone.querySelector('ol');
      if (ol) {
        var rangeBefore = document.createDocumentFragment();
        var rangeAfter = document.createDocumentFragment();
        var node = clone.firstChild;
        var past = false;
        while (node) {
          var next = node.nextSibling;
          if (node === ol) {
            past = true;
          } else if (!past) {
            rangeBefore.appendChild(node);
          } else {
            rangeAfter.appendChild(node);
          }
          node = next;
        }
        var tmp = document.createElement('div');
        tmp.appendChild(rangeBefore);
        beforeHtml = tmp.innerHTML;
        tmp.innerHTML = '';
        tmp.appendChild(rangeAfter);
        afterHtml = tmp.innerHTML;
      } else {
        beforeHtml = clone.innerHTML;
      }
    }

    var heroSrc = heroImg ? heroImg.getAttribute('src') : '';
    var figureSrc = figureImg ? figureImg.getAttribute('src') : '';
    var endSrc =
      endImg && endImg !== figureImg ? endImg.getAttribute('src') : '';
    // Prefer known end mark if present
    var endMark = content.querySelector('img[src*="6-removebg"]');
    if (endMark) endSrc = endMark.getAttribute('src');

    var shell = document.createElement('div');
    shell.className = 'honda-home';
    shell.innerHTML =
      '<section class="home-hero reveal">' +
      (heroSrc
        ? '<img src="' +
          heroSrc +
          '" alt="台灣本田聯合福委會 特約商店公佈欄" />'
        : '') +
      '<div class="home-hero-overlay">' +
      '<div class="home-hero-inner">' +
      '<div class="eyebrow">Honda Taiwan Joint Welfare Committee</div>' +
      '<h1>台灣本田聯合福委會<br />特約商店公佈欄</h1>' +
      '<p class="hero-sub">Official Partner Store Directory</p>' +
      '</div></div></section>' +
      '<section class="home-shell">' +
      '<div class="home-kicker reveal">Official Notice</div>' +
      '<h2 class="home-lead-title reveal">' +
      (titleText || '擴大特約商店優惠適用範圍') +
      '</h2>' +
      (figureSrc
        ? '<figure class="home-lead-figure reveal"><img src="' +
          figureSrc +
          '" alt="" /></figure>'
        : '') +
      '<div class="home-body reveal">' +
      beforeHtml +
      '</div>' +
      (reqs.length
        ? '<div class="home-reqs-label reveal">適用身分證明文件</div><div class="home-reqs">' +
          reqs
            .map(function (r, i) {
              var text = r.replace(/^或/, '');
              return (
                '<div class="home-req reveal"><span class="num">0' +
                (i + 1) +
                '</span><p>' +
                text +
                '</p></div>'
              );
            })
            .join('') +
          '</div>'
        : '') +
      (afterHtml ? '<div class="home-body home-body-after reveal">' + afterHtml + '</div>' : '') +
      '<a class="home-happygo reveal" href="https://ai4.ysdt.com.tw/htwhappygo" target="_blank" rel="noopener" aria-label="前往本田開心購">' +
      '<img src="files/honda-happygo-banner.png" alt="台灣本田聯合福委會特約商店優惠平台 — 本田開心購" />' +
      '</a>' +
      (line
        ? '<div class="home-cta-band reveal"><div><span class="cta-kicker">Line Official</span><p>加入官方 Line@，掌握最新特約優惠資訊</p></div>' +
          line.innerHTML +
          '</div>'
        : '') +
      '</section>' +
      (carousel
        ? '<section class="home-gallery reveal"><div class="section-label"><strong>Partner Moments</strong><span>特約店家紀實</span></div></section>'
        : '') +
      (endSrc
        ? '<div class="home-end-mark reveal"><img src="' + endSrc + '" alt="" /></div>'
        : '');

    content.innerHTML = '';
    content.appendChild(shell);
    content.setAttribute('data-honda-home', '1');
    document.body.classList.add('honda-home-page');

    if (carousel) {
      var gallery = shell.querySelector('.home-gallery');
      if (gallery) gallery.appendChild(carousel);
    }
  }

  function rebuildCategoryHub() {
    var page = fileName();
    if (page.indexOf('293053200421830242152099839006') === -1) return;

    var host = document.querySelector('.wsite-background-17 .wsite-section-elements');
    if (!host || host.querySelector('.cat-grid')) return;

    var grid = document.createElement('div');
    grid.className = 'cat-grid';
    CATS.forEach(function (c, i) {
      var a = document.createElement('a');
      a.className = 'cat-card reveal';
      a.href = c.href;
      a.innerHTML =
        '<span class="idx">0' +
        (i + 1) +
        '</span><span class="name">' +
        c.name +
        '</span><span class="go">View stores →</span>';
      grid.appendChild(a);
    });
    host.appendChild(grid);
    document.body.classList.add('honda-cats-ready');
  }

  function setupEventsHero() {
    var bannerWrap = document.querySelector('.banner-wrap');
    if (bannerWrap && !bannerWrap.querySelector('.honda-page-hero')) {
      bannerWrap.innerHTML =
        '<div class="honda-page-hero">' +
        '<div class="honda-page-hero-inner">' +
        '<div class="page-eyebrow">Exclusive Offers</div>' +
        '<h1 class="honda-page-hero-title">特約店家專屬活動</h1>' +
        '<p class="honda-page-hero-sub">Honda Taiwan Joint Welfare Committee</p>' +
        '</div></div>';
    }
  }

  function escText(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderEventCards(listEl, items) {
    items.forEach(function (ev, i) {
      var n = i + 1;
      var mediaHtml = '';
      if (ev.image_url) {
        var mediaInner =
          '<img src="' + escText(ev.image_url) + '" alt="" loading="lazy" />';
        if (ev.link_url) {
          mediaHtml =
            '<a class="event-media" href="' +
            escText(ev.link_url) +
            '" target="_blank" rel="noopener">' +
            mediaInner +
            '</a>';
        } else {
          mediaHtml = '<div class="event-media">' + mediaInner + '</div>';
        }
      }

      var bodyHtml = escText(ev.body || '').replace(/\n/g, '<br />');
      var card = document.createElement('article');
      card.className = 'event-card reveal';
      card.innerHTML =
        '<div class="event-copy">' +
        '<span class="event-index">EVENT ' +
        (n < 10 ? '0' + n : n) +
        '</span>' +
        '<h2 class="event-title"></h2>' +
        '<div class="event-body">' +
        bodyHtml +
        '</div>' +
        (ev.link_url
          ? '<a class="event-more" href="' +
            escText(ev.link_url) +
            '" target="_blank" rel="noopener">了解更多 →</a>'
          : '') +
        '</div>' +
        mediaHtml;
      card.querySelector('.event-title').textContent = ev.title || '';
      listEl.appendChild(card);
    });
  }

  function rebuildEventsFromWeebly(content, list) {
    var blocks = Array.prototype.slice.call(content.querySelectorAll('.wsite-multicol'));
    blocks.forEach(function (block, i) {
      var para = block.querySelector('.paragraph');
      var img = block.querySelector('.wsite-image img');
      var imgLink = block.querySelector('.wsite-image a[href]');
      if (!para && !img) return;

      var titleText = '';
      var bodyNode = para ? para.cloneNode(true) : null;
      if (bodyNode) {
        sanitizeColors(bodyNode);
        var strong = bodyNode.querySelector('strong, b');
        if (strong) {
          titleText = strong.textContent.replace(/\s+/g, ' ').trim();
          if (strong.parentNode) strong.parentNode.removeChild(strong);
          while (
            bodyNode.firstChild &&
            ((bodyNode.firstChild.nodeType === 1 && bodyNode.firstChild.tagName === 'BR') ||
              (bodyNode.firstChild.nodeType === 3 && !bodyNode.firstChild.textContent.trim()))
          ) {
            bodyNode.removeChild(bodyNode.firstChild);
          }
        }
        if (!titleText) {
          titleText = (para.textContent || '').trim().split(/\n|。/)[0].slice(0, 48);
        }
      }

      var mediaHtml = '';
      if (img) {
        var src = img.getAttribute('src') || '';
        var mediaInner = '<img src="' + src + '" alt="" loading="lazy" />';
        if (imgLink && imgLink.getAttribute('href')) {
          mediaHtml =
            '<a class="event-media" href="' +
            imgLink.getAttribute('href') +
            '" target="_blank" rel="noopener">' +
            mediaInner +
            '</a>';
        } else {
          mediaHtml = '<div class="event-media">' + mediaInner + '</div>';
        }
      }

      var card = document.createElement('article');
      card.className = 'event-card reveal';
      card.innerHTML =
        '<div class="event-copy">' +
        '<span class="event-index">EVENT ' +
        (i + 1 < 10 ? '0' + (i + 1) : i + 1) +
        '</span>' +
        (titleText ? '<h2 class="event-title"></h2>' : '') +
        '<div class="event-body">' +
        (bodyNode ? bodyNode.innerHTML : '') +
        '</div></div>' +
        mediaHtml;
      var titleEl = card.querySelector('.event-title');
      if (titleEl) titleEl.textContent = titleText;
      list.appendChild(card);
    });
  }

  function rebuildEventsPage() {
    var page = fileName();
    if (page.indexOf('2930532004242152347823560236602796321205') === -1) return;
    if (document.body.getAttribute('data-honda-events') === '1') return;
    document.body.setAttribute('data-honda-events', '1');
    document.body.classList.add('honda-events-page');
    setupEventsHero();

    var content = document.getElementById('wsite-content');
    if (!content) return;

    var list = document.createElement('div');
    list.className = 'event-list';
    list.innerHTML = '<div class="store-loading">LOADING EVENTS…</div>';

    content.querySelectorAll('.wsite-section-wrap').forEach(function (wrap) {
      wrap.style.display = 'none';
    });
    content.appendChild(list);

    fetch('/api/events')
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        var items = (data && data.events) || [];
        list.innerHTML = '';
        if (items.length) {
          renderEventCards(list, items);
        } else {
          rebuildEventsFromWeebly(content, list);
          if (!list.children.length) {
            list.innerHTML =
              '<div class="store-empty">目前尚無專屬活動，請至後台新增</div>';
          }
        }
        observe();
      })
      .catch(function () {
        list.innerHTML = '';
        rebuildEventsFromWeebly(content, list);
        if (!list.children.length) {
          list.innerHTML = '<div class="store-error">活動資料載入失敗</div>';
        }
        observe();
      });
  }

  function enhanceInteriorPages() {
    if (document.body.classList.contains('wsite-page-index')) return;
    if (document.body.classList.contains('honda-events-page')) return;

    var banner = document.querySelector('.wsite-header-section, .banner-wrap');
    if (banner) banner.classList.add('honda-page-banner');

    var title = document.querySelector(
      '.wsite-header-section .wsite-content-title, .banner .wsite-content-title'
    );
    if (title && !title.querySelector('.page-eyebrow')) {
      var eye = document.createElement('div');
      eye.className = 'page-eyebrow';
      eye.textContent = 'Honda Taiwan · Partner Stores';
      title.parentNode.insertBefore(eye, title);
    }

    sanitizeColors(document.getElementById('wsite-content'));
  }

  function observe() {
    var nodes = document.querySelectorAll('.reveal:not(.is-in), .store-item:not(.is-in)');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (n) {
        n.classList.add('is-in');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  window.htjwcObserveStores = observe;

  ready(function () {
    document.documentElement.classList.add('htjwc-honda');
    document.body.classList.add('htjwc-honda');
    buildHeader();
    rebuildHome();
    rebuildCategoryHub();
    rebuildEventsPage();
    enhanceInteriorPages();
    observe();
    setTimeout(observe, 700);
    setTimeout(observe, 1800);
  });
})();
