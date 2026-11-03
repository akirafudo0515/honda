(function () {
  var REGIONS = {
    all: '全部',
    north: '北',
    central: '中',
    south: '南',
    east: '東',
  };

  var CATEGORIES = {
    dining: '餐飲相關特約店家',
    cafe: '咖啡 · 點心 · 甜品類',
    hotel: '旅館民宿特約店家',
    souvenir: '伴手禮/觀光工廠特約店家',
    leisure: '生活休閒類特約店家',
    shopping: '生活服務及購物',
  };

  var stores = [];
  var editingId = null;

  var loginView = document.getElementById('login-view');
  var adminView = document.getElementById('admin-view');
  var loginForm = document.getElementById('login-form');
  var loginError = document.getElementById('login-error');
  var logoutBtn = document.getElementById('logout-btn');
  var filterCategory = document.getElementById('filter-category');
  var newBtn = document.getElementById('new-btn');
  var tbody = document.getElementById('store-tbody');
  var editor = document.getElementById('editor');
  var editorTitle = document.getElementById('editor-title');
  var statusEl = document.getElementById('status');
  var cancelBtn = document.getElementById('cancel-btn');
  var deleteBtn = document.getElementById('delete-btn');

  function showStatus(msg, isError) {
    statusEl.hidden = false;
    statusEl.textContent = msg;
    statusEl.className = 'status' + (isError ? ' error' : '');
    clearTimeout(showStatus._t);
    showStatus._t = setTimeout(function () {
      statusEl.hidden = true;
    }, 3500);
  }

  async function api(path, options) {
    options = options || {};
    options.credentials = 'same-origin';
    options.headers = options.headers || {};
    if (options.json) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.json);
      delete options.json;
    }
    var res = await fetch(path, options);
    var data = null;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
    if (!res.ok) {
      var err = new Error((data && data.error) || '請求失敗');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function field(id) {
    return document.getElementById(id);
  }

  function getImages() {
    try {
      var parsed = JSON.parse(field('f-image-urls').value || '[]');
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function setImages(urls) {
    var list = (urls || []).filter(Boolean).slice(0, 12);
    field('f-image-urls').value = JSON.stringify(list);
    renderImageGallery(list);
  }

  function renderImageGallery(urls) {
    var box = document.getElementById('image-preview');
    if (!urls || !urls.length) {
      box.innerHTML = '<span class="empty">尚未上傳圖片</span>';
      return;
    }
    box.innerHTML = urls
      .map(function (url, idx) {
        return (
          '<div class="image-thumb" data-idx="' +
          idx +
          '">' +
          '<img src="' +
          escapeHtml(url) +
          '" alt="" />' +
          '<button type="button" data-remove="' +
          idx +
          '">刪除</button>' +
          '</div>'
        );
      })
      .join('');
  }

  function setPreviewPdf(url, name) {
    var box = document.getElementById('pdf-preview');
    if (!url) {
      box.innerHTML = '尚未上傳 PDF';
      return;
    }
    box.innerHTML =
      '<a href="' + url + '" target="_blank">' + (name || '下載 PDF') + '</a>';
  }

  function resetEditor() {
    editingId = null;
    field('store-id').value = '';
    field('f-category').value = filterCategory.value || 'dining';
    field('f-region').value = 'all';
    field('f-name').value = '';
    field('f-address').value = '';
    field('f-phone').value = '';
    field('f-hours').value = '';
    field('f-transport').value = '';
    field('f-services').value = '';
    field('f-description').value = '';
    field('f-discount').value = '';
    field('f-notes').value = '';
    field('f-website').value = '';
    field('f-sort').value = '';
    field('f-visible').value = '1';
    setImages([]);
    field('f-pdf-url').value = '';
    field('f-pdf-name').value = '';
    field('f-image-file').value = '';
    field('f-pdf-file').value = '';
    setPreviewPdf('');
    editorTitle.textContent = '新增店家';
    deleteBtn.hidden = true;
  }

  function fillEditor(store) {
    editingId = store.id;
    field('store-id').value = store.id;
    field('f-category').value = store.category || 'dining';
    field('f-region').value = REGIONS[store.region] ? store.region : 'all';
    field('f-name').value = store.name || '';
    field('f-address').value = store.address || '';
    field('f-phone').value = store.phone || '';
    field('f-hours').value = store.hours || '';
    field('f-transport').value = store.transport || '';
    field('f-services').value = store.services || '';
    field('f-description').value = store.description || '';
    field('f-discount').value = store.discount || '';
    field('f-notes').value = store.notes || '';
    field('f-website').value = store.website || '';
    field('f-sort').value = store.sort_order != null ? store.sort_order : '';
    field('f-visible').value = store.visible ? '1' : '0';
    setImages(
      Array.isArray(store.images) && store.images.length
        ? store.images
        : store.image_url
          ? [store.image_url]
          : []
    );
    field('f-pdf-url').value = store.pdf_url || '';
    field('f-pdf-name').value = store.pdf_name || '';
    setPreviewPdf(store.pdf_url || '', store.pdf_name || '');
    editorTitle.textContent = '編輯店家';
    deleteBtn.hidden = false;
    editor.hidden = false;
  }

  function collectPayload() {
    var images = getImages();
    var sortRaw = field('f-sort').value;
    var payload = {
      category: field('f-category').value,
      region: field('f-region').value || 'all',
      name: field('f-name').value.trim(),
      address: field('f-address').value.trim(),
      phone: field('f-phone').value.trim(),
      hours: field('f-hours').value.trim(),
      transport: field('f-transport').value.trim(),
      services: field('f-services').value.trim(),
      description: field('f-description').value.trim(),
      discount: field('f-discount').value.trim(),
      notes: field('f-notes').value.trim(),
      website: field('f-website').value.trim(),
      images: images,
      image_url: images[0] || '',
      pdf_url: field('f-pdf-url').value.trim(),
      pdf_name: field('f-pdf-name').value.trim(),
      visible: field('f-visible').value === '1' ? 1 : 0,
    };
    if (sortRaw !== '' && sortRaw != null) {
      payload.sort_order = Number(sortRaw);
    }
    return payload;
  }

  function renderTable() {
    var cat = filterCategory.value;
    var list = stores.filter(function (s) {
      return !cat || s.category === cat;
    });
    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="color:#6b7280;padding:20px;">尚無店家</td></tr>';
      return;
    }
    list.forEach(function (s) {
      var tr = document.createElement('tr');
      if (editingId === s.id) tr.className = 'active';
      tr.innerHTML =
        '<td>' +
        s.sort_order +
        '</td><td>' +
        escapeHtml(s.name) +
        '</td><td>' +
        escapeHtml(CATEGORIES[s.category] || s.category) +
        '</td><td>' +
        escapeHtml(REGIONS[s.region] || '全部') +
        '</td><td><button type="button" class="badge ' +
        (s.visible ? 'on' : 'off') +
        '" data-visible-toggle="store" data-id="' +
        s.id +
        '">' +
        (s.visible ? '顯示' : '不顯示') +
        '</button></td><td>編輯</td>';
      tr.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-visible-toggle') === 'store') return;
        fillEditor(s);
        renderTable();
      });
      var badge = tr.querySelector('[data-visible-toggle="store"]');
      if (badge) {
        badge.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleStoreVisible(s.id);
        });
      }
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadStores() {
    var data = await api('/api/stores?all=1');
    stores = data.stores || [];
    renderTable();
  }

  async function toggleStoreVisible(id) {
    var store = stores.find(function (s) {
      return s.id === id;
    });
    if (!store) return;
    var nextVisible = store.visible ? 0 : 1;
    try {
      await api('/api/stores/' + id, {
        method: 'PUT',
        json: { visible: nextVisible },
      });
      showStatus(nextVisible ? '已設為顯示' : '已設為不顯示');
      await loadStores();
      if (editingId === id) {
        var updated = stores.find(function (s) {
          return s.id === id;
        });
        if (updated) fillEditor(updated);
      }
    } catch (err) {
      showStatus(err.message, true);
    }
  }

  async function uploadOne(file) {
    var fd = new FormData();
    fd.append('file', file);
    var res = await fetch('/api/upload', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    var data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(data.error || '上傳失敗');
    return data;
  }

  async function uploadImages(fileInput) {
    var files = fileInput.files ? Array.prototype.slice.call(fileInput.files) : [];
    if (!files.length) return;
    var current = getImages();
    var remain = 12 - current.length;
    if (remain <= 0) throw new Error('最多只能上傳 12 張圖片');
    files = files.slice(0, remain);
    for (var i = 0; i < files.length; i++) {
      var data = await uploadOne(files[i]);
      current.push(data.url);
    }
    setImages(current);
  }

  async function uploadPdf(fileInput) {
    var file = fileInput.files && fileInput.files[0];
    if (!file) return;
    var data = await uploadOne(file);
    field('f-pdf-url').value = data.url;
    field('f-pdf-name').value = data.name || file.name;
    setPreviewPdf(data.url, data.name || file.name);
  }

  function showAdmin() {
    loginView.hidden = true;
    adminView.hidden = false;
  }

  function showLogin() {
    adminView.hidden = true;
    loginView.hidden = false;
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    loginError.hidden = true;
    try {
      await api('/api/login', {
        method: 'POST',
        json: { password: document.getElementById('password').value },
      });
      showAdmin();
      await loadStores();
      showStatus('登入成功');
    } catch (err) {
      loginError.textContent = err.message || '登入失敗';
      loginError.hidden = false;
    }
  });

  logoutBtn.addEventListener('click', async function () {
    try {
      await api('/api/logout', { method: 'POST' });
    } catch (e) {}
    showLogin();
  });

  filterCategory.addEventListener('change', renderTable);

  newBtn.addEventListener('click', function () {
    resetEditor();
    editor.hidden = false;
    renderTable();
  });

  cancelBtn.addEventListener('click', function () {
    editor.hidden = true;
    resetEditor();
    renderTable();
  });

  document.getElementById('image-preview').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    var idx = Number(btn.getAttribute('data-remove'));
    var list = getImages();
    list.splice(idx, 1);
    setImages(list);
  });

  field('f-image-file').addEventListener('change', async function () {
    try {
      await uploadImages(field('f-image-file'));
      field('f-image-file').value = '';
      showStatus('圖片已上傳');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  field('f-pdf-file').addEventListener('change', async function () {
    try {
      await uploadPdf(field('f-pdf-file'));
      showStatus('PDF 已上傳');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  editor.addEventListener('submit', async function (e) {
    e.preventDefault();
    var payload = collectPayload();
    if (!payload.name) {
      showStatus('請填寫店名', true);
      return;
    }
    try {
      if (editingId) {
        await api('/api/stores/' + editingId, { method: 'PUT', json: payload });
        showStatus('已更新店家');
      } else {
        await api('/api/stores', { method: 'POST', json: payload });
        showStatus('已新增店家');
      }
      await loadStores();
      editor.hidden = true;
      resetEditor();
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  deleteBtn.addEventListener('click', async function () {
    if (!editingId) return;
    if (!confirm('確定刪除此店家？此操作無法復原。')) return;
    try {
      await api('/api/stores/' + editingId, { method: 'DELETE' });
      showStatus('已刪除店家');
      editor.hidden = true;
      resetEditor();
      await loadStores();
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  // ===== Events =====
  var events = [];
  var editingEventId = null;
  var eventEditor = document.getElementById('event-editor');
  var eventEditorTitle = document.getElementById('event-editor-title');
  var eventTbody = document.getElementById('event-tbody');
  var newEventBtn = document.getElementById('new-event-btn');
  var eventCancelBtn = document.getElementById('event-cancel-btn');
  var eventDeleteBtn = document.getElementById('event-delete-btn');
  var eventLivePreview = document.getElementById('event-live-preview');

  function refreshEventPreview(index) {
    if (!eventLivePreview) return;
    var title = field('e-title').value.trim() || '活動標題預覽';
    var body = field('e-body').value.trim() || '活動內容會顯示在這裡…';
    var imageUrl = field('e-image-url').value.trim();
    var idx = typeof index === 'number' ? index + 1 : 1;
    var idxText = idx < 10 ? '0' + idx : String(idx);

    var titleEl = eventLivePreview.querySelector('.event-title');
    var bodyEl = eventLivePreview.querySelector('.event-body');
    var indexEl = eventLivePreview.querySelector('.event-index');
    var mediaEl = eventLivePreview.querySelector('.event-media');

    if (indexEl) indexEl.textContent = 'EVENT ' + idxText;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    if (mediaEl) {
      mediaEl.innerHTML = imageUrl
        ? '<img src="' + escapeHtml(imageUrl) + '" alt="" />'
        : '<div class="event-media-empty">尚未上傳圖片</div>';
    }
  }

  function bindEventPreviewInputs() {
    ['e-title', 'e-body', 'e-image-url'].forEach(function (id) {
      var el = field(id);
      if (!el || el._previewBound) return;
      el._previewBound = true;
      el.addEventListener('input', function () {
        var idx = events.findIndex(function (ev) {
          return ev.id === editingEventId;
        });
        refreshEventPreview(idx >= 0 ? idx : events.length);
      });
    });
  }

  function setEventImagePreview(url) {
    var box = document.getElementById('event-image-preview');
    if (!url) {
      box.innerHTML = '尚未上傳圖片';
      return;
    }
    box.innerHTML =
      '<img src="' +
      escapeHtml(url) +
      '" alt="" /><div><button type="button" id="e-image-clear" class="secondary">移除圖片</button></div>';
    var clearBtn = document.getElementById('e-image-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        field('e-image-url').value = '';
        setEventImagePreview('');
      });
    }
  }

  function resetEventEditor() {
    editingEventId = null;
    field('event-id').value = '';
    field('e-title').value = '';
    field('e-body').value = '';
    field('e-link').value = '';
    field('e-sort').value = '';
    field('e-visible').value = '1';
    field('e-image-url').value = '';
    field('e-image-file').value = '';
    setEventImagePreview('');
    eventEditorTitle.textContent = '新增活動';
    eventDeleteBtn.hidden = true;
    refreshEventPreview(events.length);
  }

  function fillEventEditor(ev) {
    editingEventId = ev.id;
    field('event-id').value = ev.id;
    field('e-title').value = ev.title || '';
    field('e-body').value = ev.body || '';
    field('e-link').value = ev.link_url || '';
    field('e-sort').value = ev.sort_order != null ? ev.sort_order : '';
    field('e-visible').value = ev.visible ? '1' : '0';
    field('e-image-url').value = ev.image_url || '';
    setEventImagePreview(ev.image_url || '');
    eventEditorTitle.textContent = '編輯活動';
    eventDeleteBtn.hidden = false;
    eventEditor.hidden = false;
    var idx = events.findIndex(function (item) {
      return item.id === ev.id;
    });
    refreshEventPreview(idx >= 0 ? idx : 0);
  }

  function collectEventPayload() {
    var sortRaw = field('e-sort').value;
    var payload = {
      title: field('e-title').value.trim(),
      body: field('e-body').value,
      link_url: field('e-link').value.trim(),
      image_url: field('e-image-url').value.trim(),
      visible: field('e-visible').value === '1' ? 1 : 0,
    };
    if (sortRaw !== '' && sortRaw != null) {
      payload.sort_order = Number(sortRaw);
    }
    return payload;
  }

  function renderEventTable() {
    eventTbody.innerHTML = '';
    if (!events.length) {
      eventTbody.innerHTML =
        '<tr><td colspan="4" style="color:#6b7280;padding:20px;">尚無活動，請新增</td></tr>';
      return;
    }
    events.forEach(function (ev) {
      var tr = document.createElement('tr');
      if (editingEventId === ev.id) tr.className = 'active';
      tr.innerHTML =
        '<td>' +
        ev.sort_order +
        '</td><td>' +
        escapeHtml(ev.title) +
        '</td><td><button type="button" class="badge ' +
        (ev.visible ? 'on' : 'off') +
        '" data-visible-toggle="event" data-id="' +
        ev.id +
        '">' +
        (ev.visible ? '顯示' : '不顯示') +
        '</button></td><td>編輯</td>';
      tr.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-visible-toggle') === 'event') return;
        fillEventEditor(ev);
        renderEventTable();
      });
      var badge = tr.querySelector('[data-visible-toggle="event"]');
      if (badge) {
        badge.addEventListener('click', function (e) {
          e.stopPropagation();
          toggleEventVisible(ev.id);
        });
      }
      eventTbody.appendChild(tr);
    });
  }

  async function loadEvents(options) {
    options = options || {};
    var data = await api('/api/events?all=1');
    events = data.events || [];
    renderEventTable();
    var hint = document.getElementById('events-empty-hint');
    if (hint) hint.hidden = !!events.length;
    if (events.length) {
      var keepId = options.preserveId != null ? options.preserveId : editingEventId;
      var target = keepId
        ? events.find(function (item) {
            return item.id === keepId;
          })
        : null;
      fillEventEditor(target || events[0]);
      eventEditor.hidden = false;
    } else {
      resetEventEditor();
      eventEditor.hidden = false;
    }
  }

  async function toggleEventVisible(id) {
    var ev = events.find(function (item) {
      return item.id === id;
    });
    if (!ev) return;
    var nextVisible = ev.visible ? 0 : 1;
    try {
      await api('/api/events/' + id, {
        method: 'PUT',
        json: { visible: nextVisible },
      });
      showStatus(nextVisible ? '已設為顯示' : '已設為不顯示');
      await loadEvents({ preserveId: editingEventId || id });
    } catch (err) {
      showStatus(err.message, true);
    }
  }

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-tab') === name);
    });
    document.getElementById('tab-stores').hidden = name !== 'stores';
    document.getElementById('tab-promo').hidden = name !== 'promo';
    document.getElementById('tab-events').hidden = name !== 'events';
    if (name === 'stores') {
      editor.hidden = true;
      resetEventEditor();
      if (eventEditor) eventEditor.hidden = true;
      if (promoEditor) promoEditor.hidden = true;
    }
    if (name === 'promo') {
      editor.hidden = true;
      resetEventEditor();
      if (eventEditor) eventEditor.hidden = true;
      loadPromo().catch(function (err) {
        showStatus(err.message || '活動推廣載入失敗', true);
      });
    }
    if (name === 'events') {
      editor.hidden = true;
      if (promoEditor) promoEditor.hidden = true;
      bindEventPreviewInputs();
      loadEvents().catch(function (err) {
        showStatus(err.message || '活動載入失敗', true);
      });
    }
  }

  document.querySelectorAll('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  newEventBtn.addEventListener('click', function () {
    resetEventEditor();
    eventEditor.hidden = false;
    renderEventTable();
  });

  eventCancelBtn.addEventListener('click', function () {
    eventEditor.hidden = true;
    resetEventEditor();
    renderEventTable();
  });

  field('e-image-file').addEventListener('change', async function () {
    try {
      var file = field('e-image-file').files && field('e-image-file').files[0];
      if (!file) return;
      var data = await uploadOne(file);
      field('e-image-url').value = data.url;
      setEventImagePreview(data.url);
      field('e-image-file').value = '';
      refreshEventPreview(
        events.findIndex(function (ev) {
          return ev.id === editingEventId;
        })
      );
      showStatus('活動圖片已上傳');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  eventEditor.addEventListener('submit', async function (e) {
    e.preventDefault();
    var payload = collectEventPayload();
    if (!payload.title) {
      showStatus('請填寫活動標題', true);
      return;
    }
    try {
      if (editingEventId) {
        await api('/api/events/' + editingEventId, { method: 'PUT', json: payload });
        showStatus('已更新活動');
      } else {
        await api('/api/events', { method: 'POST', json: payload });
        showStatus('已新增活動');
      }
      await loadEvents();
      eventEditor.hidden = true;
      resetEventEditor();
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  eventDeleteBtn.addEventListener('click', async function () {
    if (!editingEventId) return;
    if (!confirm('確定刪除此活動？此操作無法復原。')) return;
    try {
      await api('/api/events/' + editingEventId, { method: 'DELETE' });
      showStatus('已刪除活動');
      eventEditor.hidden = true;
      resetEventEditor();
      await loadEvents();
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  bindEventPreviewInputs();

  // ===== Promo (separate from store categories) =====
  var PROMO_CATEGORIES = {
    dining: '餐飲相關特約店家',
    cafe: '咖啡 · 點心 · 甜品類',
    hotel: '旅館民宿特約店家',
    souvenir: '伴手禮/觀光工廠特約店家',
  };
  var promoStores = [];
  var promoEditingId = null;
  var promoLoaded = false;
  var promoEditor = document.getElementById('promo-editor');
  var promoEditorTitle = document.getElementById('promo-editor-title');
  var promoTbody = document.getElementById('promo-tbody');
  var promoFilter = document.getElementById('promo-filter-category');
  var promoHeroUrl = '';

  function promoImages() {
    try {
      var parsed = JSON.parse(field('p-image-urls').value || '[]');
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function setPromoImages(urls) {
    var list = (urls || []).filter(Boolean).slice(0, 12);
    field('p-image-urls').value = JSON.stringify(list);
    var box = document.getElementById('promo-image-preview');
    if (!list.length) {
      box.innerHTML = '<span class="empty">尚未上傳圖片</span>';
      return;
    }
    box.innerHTML = list
      .map(function (url, idx) {
        return (
          '<div class="image-thumb"><img src="' +
          escapeHtml(url) +
          '" alt="" /><button type="button" data-promo-remove="' +
          idx +
          '">刪除</button></div>'
        );
      })
      .join('');
  }

  function setPromoPdf(url, name) {
    var box = document.getElementById('promo-pdf-preview');
    if (!url) {
      box.innerHTML = '尚未上傳 PDF';
      return;
    }
    box.innerHTML =
      '<a href="' + escapeHtml(url) + '" target="_blank">' + escapeHtml(name || '下載 PDF') + '</a>';
  }

  function setPromoHeroPreview(url) {
    promoHeroUrl = url || '';
    var box = document.getElementById('promo-hero-preview');
    if (!promoHeroUrl) {
      box.innerHTML = '尚未上傳照片';
      return;
    }
    box.innerHTML = '<img src="' + escapeHtml(promoHeroUrl) + '" alt="" />';
  }

  function resetPromoEditor() {
    promoEditingId = null;
    field('p-category').value = promoFilter.value || 'dining';
    field('p-region').value = 'all';
    field('p-name').value = '';
    field('p-address').value = '';
    field('p-phone').value = '';
    field('p-hours').value = '';
    field('p-transport').value = '';
    field('p-services').value = '';
    field('p-description').value = '';
    field('p-discount').value = '';
    field('p-notes').value = '';
    field('p-website').value = '';
    field('p-sort').value = '';
    field('p-visible').value = '1';
    field('p-pdf-url').value = '';
    field('p-pdf-name').value = '';
    field('p-image-file').value = '';
    field('p-pdf-file').value = '';
    setPromoImages([]);
    setPromoPdf('');
    promoEditorTitle.textContent = '新增店家';
    document.getElementById('promo-delete-btn').hidden = true;
  }

  function fillPromoEditor(store) {
    promoEditingId = store.id;
    field('p-category').value = PROMO_CATEGORIES[store.category] ? store.category : 'dining';
    field('p-region').value = REGIONS[store.region] ? store.region : 'all';
    field('p-name').value = store.name || '';
    field('p-address').value = store.address || '';
    field('p-phone').value = store.phone || '';
    field('p-hours').value = store.hours || '';
    field('p-transport').value = store.transport || '';
    field('p-services').value = store.services || '';
    field('p-description').value = store.description || '';
    field('p-discount').value = store.discount || '';
    field('p-notes').value = store.notes || '';
    field('p-website').value = store.website || '';
    field('p-sort').value = store.sort_order != null ? store.sort_order : '';
    field('p-visible').value = store.visible ? '1' : '0';
    setPromoImages(
      Array.isArray(store.images) && store.images.length
        ? store.images
        : store.image_url
          ? [store.image_url]
          : []
    );
    field('p-pdf-url').value = store.pdf_url || '';
    field('p-pdf-name').value = store.pdf_name || '';
    setPromoPdf(store.pdf_url || '', store.pdf_name || '');
    promoEditorTitle.textContent = '編輯店家';
    document.getElementById('promo-delete-btn').hidden = false;
    promoEditor.hidden = false;
  }

  function collectPromoPayload() {
    var images = promoImages();
    var sortRaw = field('p-sort').value;
    var payload = {
      category: field('p-category').value,
      region: field('p-region').value || 'all',
      name: field('p-name').value.trim(),
      address: field('p-address').value.trim(),
      phone: field('p-phone').value.trim(),
      hours: field('p-hours').value.trim(),
      transport: field('p-transport').value.trim(),
      services: field('p-services').value.trim(),
      description: field('p-description').value.trim(),
      discount: field('p-discount').value.trim(),
      notes: field('p-notes').value.trim(),
      website: field('p-website').value.trim(),
      images: images,
      image_url: images[0] || '',
      pdf_url: field('p-pdf-url').value.trim(),
      pdf_name: field('p-pdf-name').value.trim(),
      visible: field('p-visible').value === '1' ? 1 : 0,
    };
    if (sortRaw !== '' && sortRaw != null) payload.sort_order = Number(sortRaw);
    return payload;
  }

  function renderPromoTable() {
    var cat = promoFilter.value;
    var list = promoStores.filter(function (s) {
      return !cat || s.category === cat;
    });
    promoTbody.innerHTML = '';
    if (!list.length) {
      promoTbody.innerHTML =
        '<tr><td colspan="6" style="color:#6b7280;padding:20px;">這個分類還沒有店家</td></tr>';
      return;
    }
    list.forEach(function (s) {
      var tr = document.createElement('tr');
      if (promoEditingId === s.id) tr.className = 'active';
      tr.innerHTML =
        '<td>' +
        s.sort_order +
        '</td><td>' +
        escapeHtml(s.name) +
        '</td><td>' +
        escapeHtml(PROMO_CATEGORIES[s.category] || s.category) +
        '</td><td>' +
        escapeHtml(REGIONS[s.region] || '全部') +
        '</td><td><button type="button" class="badge ' +
        (s.visible ? 'on' : 'off') +
        '" data-promo-visible="' +
        s.id +
        '">' +
        (s.visible ? '顯示' : '不顯示') +
        '</button></td><td>編輯</td>';
      tr.addEventListener('click', function (e) {
        if (e.target && e.target.getAttribute('data-promo-visible')) return;
        fillPromoEditor(s);
        renderPromoTable();
      });
      var badge = tr.querySelector('[data-promo-visible]');
      if (badge) {
        badge.addEventListener('click', function (e) {
          e.stopPropagation();
          togglePromoVisible(s.id);
        });
      }
      promoTbody.appendChild(tr);
    });
  }

  async function loadPromo() {
    var hero = await api('/api/promo');
    setPromoHeroPreview(hero.image_url || '');
    var data = await api('/api/promo-stores?all=1');
    promoStores = data.stores || [];
    promoLoaded = true;
    renderPromoTable();
  }

  async function savePromoHero(url) {
    var data = await api('/api/promo', { method: 'PUT', json: { image_url: url || '' } });
    setPromoHeroPreview(data.image_url || '');
  }

  async function togglePromoVisible(id) {
    var store = promoStores.find(function (s) {
      return s.id === id;
    });
    if (!store) return;
    var nextVisible = store.visible ? 0 : 1;
    try {
      await api('/api/promo-stores/' + id, { method: 'PUT', json: { visible: nextVisible } });
      showStatus(nextVisible ? '已設為顯示' : '已設為不顯示');
      await loadPromo();
      if (promoEditingId === id) {
        var updated = promoStores.find(function (s) {
          return s.id === id;
        });
        if (updated) fillPromoEditor(updated);
      }
    } catch (err) {
      showStatus(err.message, true);
    }
  }

  document.getElementById('promo-new-btn').addEventListener('click', function () {
    resetPromoEditor();
    promoEditor.hidden = false;
    renderPromoTable();
  });

  promoFilter.addEventListener('change', renderPromoTable);

  document.getElementById('promo-cancel-btn').addEventListener('click', function () {
    promoEditor.hidden = true;
    resetPromoEditor();
    renderPromoTable();
  });

  document.getElementById('promo-image-preview').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-promo-remove]');
    if (!btn) return;
    var list = promoImages();
    list.splice(Number(btn.getAttribute('data-promo-remove')), 1);
    setPromoImages(list);
  });

  field('p-image-file').addEventListener('change', async function () {
    try {
      var files = field('p-image-file').files
        ? Array.prototype.slice.call(field('p-image-file').files)
        : [];
      if (!files.length) return;
      var current = promoImages();
      var remain = 12 - current.length;
      if (remain <= 0) throw new Error('最多只能上傳 12 張圖片');
      files = files.slice(0, remain);
      for (var i = 0; i < files.length; i++) {
        var uploaded = await uploadOne(files[i]);
        current.push(uploaded.url);
      }
      setPromoImages(current);
      field('p-image-file').value = '';
      showStatus('圖片已上傳');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  field('p-pdf-file').addEventListener('change', async function () {
    try {
      var file = field('p-pdf-file').files && field('p-pdf-file').files[0];
      if (!file) return;
      var data = await uploadOne(file);
      field('p-pdf-url').value = data.url;
      field('p-pdf-name').value = data.name || file.name;
      setPromoPdf(data.url, data.name || file.name);
      showStatus('PDF 已上傳');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  field('promo-hero-file').addEventListener('change', async function () {
    try {
      var file = field('promo-hero-file').files && field('promo-hero-file').files[0];
      if (!file) return;
      var data = await uploadOne(file);
      await savePromoHero(data.url);
      field('promo-hero-file').value = '';
      showStatus('頁面照片已更新');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  document.getElementById('promo-hero-clear').addEventListener('click', async function () {
    try {
      await savePromoHero('');
      showStatus('已移除頁面照片');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  promoEditor.addEventListener('submit', async function (e) {
    e.preventDefault();
    var payload = collectPromoPayload();
    if (!payload.name) {
      showStatus('請填寫店名', true);
      return;
    }
    try {
      if (promoEditingId) {
        await api('/api/promo-stores/' + promoEditingId, { method: 'PUT', json: payload });
        showStatus('已更新活動推廣店家');
      } else {
        await api('/api/promo-stores', { method: 'POST', json: payload });
        showStatus('已新增活動推廣店家');
      }
      promoEditor.hidden = true;
      resetPromoEditor();
      await loadPromo();
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  document.getElementById('promo-delete-btn').addEventListener('click', async function () {
    if (!promoEditingId) return;
    if (!confirm('確定刪除此店家？只會從活動推廣移除，不會影響原本的商店分類。')) return;
    try {
      await api('/api/promo-stores/' + promoEditingId, { method: 'DELETE' });
      showStatus('已從活動推廣刪除');
      promoEditor.hidden = true;
      resetPromoEditor();
      await loadPromo();
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  // boot
  api('/api/login')
    .then(function (data) {
      if (data.authenticated) {
        showAdmin();
        return loadStores();
      }
      showLogin();
    })
    .catch(function () {
      showLogin();
    });
})();
