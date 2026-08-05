(function () {
  var CATEGORY_LABELS = {
    dining: '餐飲相關特約店家',
    cafe: '咖啡 · 點心 · 甜品類',
    hotel: '旅館民宿特約店家',
    souvenir: '伴手禮/觀光工廠特約店家',
    leisure: '生活休閒類特約店家',
    shopping: '生活服務及購物',
  };

  function esc(s) {
    return String(s == null ? ''
      : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function nl2br(s) {
    return esc(s).replace(/\n/g, '<br />');
  }

  function buildTextHtml(store) {
    var parts = [];
    parts.push(
      '<strong style="color:rgb(48, 48, 48)">特約商家店名：' +
        esc(store.name) +
        '</strong>'
    );
    if (store.address) {
      parts.push(
        '<span style="color:rgb(48, 48, 48)">地址：</span>' + esc(store.address)
      );
    }
    var mid = [];
    if (store.phone) mid.push('電話：' + esc(store.phone));
    if (store.hours) mid.push('營業時間：' + esc(store.hours));
    if (store.transport) mid.push('交通：' + esc(store.transport));
    if (mid.length) {
      parts.push('<font color="#2a2a2a">' + mid.join('<br />') + '</font>');
    }
    if (store.services) {
      parts.push(
        '<span style="color:rgb(48, 48, 48)">服務項目：</span>' + esc(store.services)
      );
    }
    if (store.description) {
      parts.push(nl2br(store.description));
    }
    if (store.notes) {
      parts.push('備註：' + esc(store.notes));
    }
    if (store.discount) {
      parts.push(
        '<font color="#5040ae"><strong>優惠內容：' +
          esc(store.discount) +
          '</strong></font>'
      );
    }
    return '<div class="paragraph">' + parts.join('<br />') + '</div>';
  }

  function storeImages(store) {
    if (Array.isArray(store.images) && store.images.length) return store.images;
    if (store.image_url) return [store.image_url];
    return [];
  }

  function buildImageHtml(store) {
    var images = storeImages(store);
    if (!images.length && !store.website) {
      return '<div></div>';
    }

    var imgs = images
      .map(function (url, idx) {
        var tag =
          '<img src="' +
          esc(url) +
          '" alt="' +
          esc(store.name) +
          (images.length > 1 ? ' (' + (idx + 1) + ')' : '') +
          '" style="width:auto;max-width:100%;margin-bottom:' +
          (idx < images.length - 1 ? '10px' : '0') +
          ';" />';
        if (store.website && idx === 0) {
          return (
            '<a href="' +
            esc(store.website) +
            '" target="_blank" rel="noopener">' +
            tag +
            '</a>'
          );
        }
        return tag;
      })
      .join('');

    if (!imgs && store.website) {
      imgs =
        '<a href="' +
        esc(store.website) +
        '" target="_blank" rel="noopener">' +
        esc(store.website) +
        '</a>';
    }

    return (
      '<div><div class="wsite-image wsite-image-border-none " style="padding-top:10px;padding-bottom:10px;margin-left:0px;margin-right:0px;text-align:center">' +
      imgs +
      '<div style="display:block;font-size:90%"></div></div></div>'
    );
  }

  function buildPdfHtml(store) {
    if (!store.pdf_url) return '';
    var title = store.pdf_name || '下載檔案';
    return (
      '<div><div style="margin: 10px 0 0 -10px">' +
      '<a title="下載檔案：' +
      esc(title) +
      '" href="' +
      esc(store.pdf_url) +
      '">' +
      '<img src="../www.weebly.com/weebly/images/file_icons/pdf.png" width="36" height="36" style="float: left; position: relative; left: 0px; top: 0px; margin: 0 15px 15px 0; border: 0;" onerror="this.style.display=\'none\'" />' +
      '</a>' +
      '<div style="float: left; text-align: left; position: relative;">' +
      '<table style="font-size: 12px; font-family: tahoma; line-height: .9;"><tr><td colspan="2"><b> ' +
      esc(title) +
      '</b></td></tr></table>' +
      '<a title="下載檔案：' +
      esc(title) +
      '" href="' +
      esc(store.pdf_url) +
      '" style="font-weight: bold;">Download File</a></div></div>' +
      '<hr style="clear: both; width: 100%; visibility: hidden"></hr></div>'
    );
  }

  function buildStoreBlock(store) {
    var spacer =
      '<div><div style="height: 20px; overflow: hidden; width: 100%;"></div>' +
      '<hr class="styled-hr" style="width:100%;"></hr>' +
      '<div style="height: 20px; overflow: hidden; width: 100%;"></div></div>';

    var left = buildTextHtml(store) + buildPdfHtml(store);
    var right = buildImageHtml(store);

    return (
      spacer +
      '<div><div class="wsite-multicol"><div class="wsite-multicol-table-wrap" style="margin:0 -15px;">' +
      '<table class="wsite-multicol-table"><tbody class="wsite-multicol-tbody">' +
      '<tr class="wsite-multicol-tr">' +
      '<td class="wsite-multicol-col" style="width:50%; padding:0 15px;">' +
      left +
      '</td>' +
      '<td class="wsite-multicol-col" style="width:50%; padding:0 15px;">' +
      right +
      '</td>' +
      '</tr></tbody></table></div></div></div>'
    );
  }

  function render(container, stores) {
    if (!stores.length) {
      container.innerHTML =
        '<div class="paragraph" style="padding:20px 0;">目前此分類尚無店家資料。</div>';
      return;
    }
    container.innerHTML = stores.map(buildStoreBlock).join('');
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
      el.innerHTML = '<div class="paragraph">缺少分類設定</div>';
      return;
    }
    el.innerHTML =
      '<div class="paragraph" style="padding:20px 0;">載入店家資料中…</div>';

    var url = '/api/stores?category=' + encodeURIComponent(category);
    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('load failed');
        return r.json();
      })
      .then(function (data) {
        render(el, data.stores || []);
      })
      .catch(function () {
        el.innerHTML =
          '<div class="paragraph" style="padding:20px 0;color:#a00;">店家資料載入失敗，請稍後再試。' +
          (CATEGORY_LABELS[category] ? '（' + CATEGORY_LABELS[category] + '）' : '') +
          '</div>';
      });
  });
})();
