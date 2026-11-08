(function () {
  var REGIONS = [
    { id: 'all', label: '全部' },
    { id: 'north', label: '北' },
    { id: 'central', label: '中' },
    { id: 'south', label: '南' },
    { id: 'east', label: '東' },
  ];

  var CATEGORY_LABELS = {
    dining: '餐飲相關特約店家',
    cafe: '咖啡 · 點心 · 甜品類',
    hotel: '旅館民宿特約店家',
    souvenir: '伴手禮/觀光工廠特約店家',
    leisure: '生活休閒類特約店家',
    shopping: '生活服務及購物',
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function nl2br(s) {
    return esc(s).replace(/\n/g, '<br />');
  }

  function storeImages(store) {
    if (Array.isArray(store.images) && store.images.length) return store.images;
    if (store.image_url) return [store.image_url];
    return [];
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function decodeName(s) {
    var raw = String(s == null ? '' : s);
    if (!raw) return '';
    try {
      if (/%[0-9a-fA-F]{2}/.test(raw)) return decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch (e) {}
    return raw;
  }

  function section(title, bodyHtml, extraClass) {
    if (!bodyHtml) return '';
    return (
      '<section class="store-block' +
      (extraClass ? ' ' + extraClass : '') +
      '">' +
      (title ? '<h4 class="store-block-title">' + esc(title) + '</h4>' : '') +
      '<div class="store-block-body">' +
      bodyHtml +
      '</div></section>'
    );
  }

  function metaRows(items) {
    var rows = items
      .filter(function (it) {
        return it.value;
      })
      .map(function (it) {
        return (
          '<div class="store-row">' +
          '<span class="store-row-label">' +
          esc(it.label) +
          '</span>' +
          '<span class="store-row-value">' +
          esc(it.value) +
          '</span></div>'
        );
      })
      .join('');
    return rows;
  }

  function buildStoreBlock(store, index) {
    var images = storeImages(store);

    var infoHtml = metaRows([
      { label: '地址', value: store.address },
      { label: '電話', value: store.phone },
      { label: '營業時間', value: store.hours },
      { label: '交通', value: store.transport },
      { label: '服務項目', value: store.services },
    ]);

    var descHtml = store.description ? '<p>' + nl2br(store.description) + '</p>' : '';
    var discountHtml = store.discount ? '<p>' + nl2br(store.discount) + '</p>' : '';
    var notesHtml = store.notes ? '<p>' + nl2br(store.notes) + '</p>' : '';

    var linkItems = [];
    if (store.website) {
      linkItems.push(
        '<a class="store-link store-link-web" href="' +
          esc(store.website) +
          '" target="_blank" rel="noopener">' +
          '<span class="store-link-label">網站</span>' +
          '<span class="store-link-text">' +
          esc(store.website.replace(/^https?:\/\//, '')) +
          '</span></a>'
      );
    }
    if (store.map_url) {
      linkItems.push(
        '<a class="store-link store-link-map" href="' +
          esc(store.map_url) +
          '" target="_blank" rel="noopener">' +
          '<span class="store-link-label">地圖</span>' +
          '<span class="store-link-text">Google Map</span></a>'
      );
    }
    if (store.pdf_url) {
      linkItems.push(
        '<a class="store-link store-link-pdf" href="' +
          esc(store.pdf_url) +
          '" target="_blank" rel="noopener">' +
          '<span class="store-link-label">PDF</span>' +
          '<span class="store-link-text">' +
          esc(decodeName(store.pdf_name) || '下載檔案') +
          '</span></a>'
      );
    }
    var linksHtml = linkItems.length
      ? '<div class="store-links">' + linkItems.join('') + '</div>'
      : '';

    var media = images
      .map(function (url) {
        return (
          '<img src="' +
          esc(url) +
          '" alt="' +
          esc(store.name) +
          '" loading="lazy" />'
        );
      })
      .join('');

    return (
      '<article class="store-item">' +
      '<div class="store-main">' +
      '<header class="store-header">' +
      '<span class="store-index">STORE ' +
      pad(index + 1) +
      '</span>' +
      '<h3 class="store-name">' +
      esc(store.name) +
      '</h3>' +
      '</header>' +
      section('基本資訊', infoHtml, 'store-block-info') +
      section('店家介紹', descHtml, 'store-block-desc') +
      section('優惠內容', discountHtml, 'store-block-discount') +
      section('備註', notesHtml, 'store-block-notes') +
      section('相關連結', linksHtml, 'store-block-links') +
      '</div>' +
      '<div class="store-side">' +
      '<div class="store-media">' +
      (media || '<div class="store-media-empty"></div>') +
      '</div>' +
      '</div>' +
      '</article>'
    );
  }

  function regionBar(active) {
    return (
      '<div class="region-filter" role="tablist" aria-label="地區">' +
      REGIONS.map(function (region) {
        var on = region.id === active;
        return (
          '<button type="button" class="region-filter-btn' +
          (on ? ' is-active' : '') +
          '" role="tab" data-region="' +
          region.id +
          '" aria-selected="' +
          (on ? 'true' : 'false') +
          '">' +
          region.label +
          '</button>'
        );
      }).join('') +
      '</div><div class="store-items"></div>'
    );
  }

  function storeMatches(store, region) {
    var value = store.region || 'all';
    if (region === 'all') return true;
    return value === region;
  }

  function render(container, stores, region) {
    var items = container.querySelector('.store-items');
    if (!items) return;
    var filtered = stores.filter(function (store) {
      return storeMatches(store, region);
    });
    if (!stores.length) {
      items.innerHTML = '<div class="store-empty">目前此分類尚無店家資料</div>';
      return;
    }
    if (!filtered.length) {
      items.innerHTML = '<div class="store-empty">此地區目前沒有店家</div>';
      return;
    }
    items.innerHTML = filtered
      .map(function (s, i) {
        return buildStoreBlock(s, i);
      })
      .join('');
    if (typeof window.htjwcObserveStores === 'function') window.htjwcObserveStores();
  }

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var el = document.getElementById('store-list');
    if (!el) return;
    var category = el.getAttribute('data-category');
    if (!category) {
      el.innerHTML = '<div class="store-error">缺少分類設定</div>';
      return;
    }
    var activeRegion = 'all';
    var loaded = [];
    el.innerHTML = regionBar(activeRegion);
    el.querySelector('.store-items').innerHTML = '<div class="store-loading">LOADING STORES…</div>';
    el.addEventListener('click', function (event) {
      var btn = event.target.closest('.region-filter-btn');
      if (!btn || !el.contains(btn)) return;
      activeRegion = btn.getAttribute('data-region') || 'all';
      el.querySelectorAll('.region-filter-btn').forEach(function (node) {
        var on = node === btn;
        node.classList.toggle('is-active', on);
        node.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      render(el, loaded, activeRegion);
    });
    var apiBase = el.getAttribute('data-api') || '/api/stores';
    if (apiBase !== '/api/promo-stores') apiBase = '/api/stores';
    var listUrl = apiBase + '?category=' + encodeURIComponent(category);
    if (el.getAttribute('data-promo') === '1') listUrl += '&promo=1';
    fetch(listUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('fail');
        return r.json();
      })
      .then(function (data) {
        loaded = data.stores || [];
        render(el, loaded, activeRegion);
      })
      .catch(function () {
        el.innerHTML =
          '<div class="store-error">店家資料載入失敗' +
          (CATEGORY_LABELS[category] ? ' — ' + CATEGORY_LABELS[category] : '') +
          '</div>';
      });
  });
})();
