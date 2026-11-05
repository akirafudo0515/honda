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
    field('f-promo-visible').value = '0';
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
    field('f-promo-visible').value = store.promo_visible ? '1' : '0';
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
      promo_visible: field('f-promo-visible').value === '1' ? 1 : 0,
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
        '<tr><td colspan="7" style="color:#6b7280;padding:20px;">尚無店家</td></tr>';
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
        '</button></td><td><button type="button" class="badge ' +
        (s.promo_visible ? 'on' : 'off') +
        '" data-promo-toggle="' +
        s.id +
        '">' +
        (s.promo_visible ? '顯示' : '不顯示') +
        '</button></td><td>編輯</td>';
      tr.addEventListener('click', function (e) {
        if (e.target && e.target.closest('[data-visible-toggle], [data-promo-toggle]')) return;
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
      var promoBadge = tr.querySelector('[data-promo-toggle]');
      if (promoBadge) {
        promoBadge.addEventListener('click', function (e) {
          e.stopPropagation();
          togglePromoVisible(s.id);
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

  async function togglePromoVisible(id) {
    var store = stores.find(function (s) {
      return s.id === id;
    });
    if (!store) return;
    var nextVisible = store.promo_visible ? 0 : 1;
    try {
      await api('/api/stores/' + id, {
        method: 'PUT',
        json: { promo_visible: nextVisible },
      });
      showStatus(nextVisible ? '已顯示於活動推廣' : '已從活動推廣隱藏');
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
      await loadCategories();
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

  document.getElementById('add-category-btn').addEventListener('click', function () {
    var box = document.getElementById('new-category-box');
    var open = box.hidden;
    box.hidden = !open;
    this.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.classList.toggle('is-active', open);
    if (open) field('new-category-name').focus();
  });

  document.getElementById('new-category-save').addEventListener('click', async function () {
    var name = field('new-category-name').value.trim();
    if (!name) {
      showStatus('請填分類名稱', true);
      return;
    }
    try {
      await api('/api/categories', { method: 'POST', json: { name: name } });
      field('new-category-name').value = '';
      document.getElementById('new-category-box').hidden = true;
      document.getElementById('add-category-btn').setAttribute('aria-expanded', 'false');
      document.getElementById('add-category-btn').classList.remove('is-active');
      await loadCategories();
      showStatus('已新增分類。還沒有可顯示的店家時，前台不會出現');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  function categoryOptions(list, includeAll) {
    var html = includeAll ? '<option value="">全部</option>' : '';
    list.forEach(function (c) {
      html +=
        '<option value="' + escapeHtml(c.slug) + '">' + escapeHtml(c.name) + '</option>';
    });
    return html;
  }

  async function loadCategories() {
    var data = await api('/api/categories?all=1');
    var list = data.categories || [];
    categoryRecords = list;
    list.forEach(function (c) {
      CATEGORIES[c.slug] = c.name;
    });
    var filterVal = filterCategory.value;
    var formVal = field('f-category').value;
    var renameVal = field('rename-category').value;
    filterCategory.innerHTML = categoryOptions(list, true);
    field('f-category').innerHTML = categoryOptions(list, false);
    field('rename-category').innerHTML = categoryOptions(list, false);
    if (filterVal) filterCategory.value = filterVal;
    if (formVal) field('f-category').value = formVal;
    if (renameVal) field('rename-category').value = renameVal;
    fillRenameName();
    renderTable();
  }

  var categoryRecords = [];

  function fillRenameName() {
    var slug = field('rename-category').value;
    var found = null;
    categoryRecords.forEach(function (c) {
      if (c.slug === slug) found = c;
    });
    field('rename-category-name').value = found ? found.name : '';
  }

  document.getElementById('rename-category').addEventListener('change', fillRenameName);

  document.getElementById('rename-category-save').addEventListener('click', async function () {
    var slug = field('rename-category').value;
    var name = field('rename-category-name').value.trim();
    if (!slug || !name) {
      showStatus('請選擇分類並填名稱', true);
      return;
    }
    try {
      await api('/api/categories/' + encodeURIComponent(slug), { method: 'PUT', json: { name: name } });
      await loadCategories();
      showStatus('已更新分類名稱');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

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

  var PROMO_POSTERS = {
    desktop: '/files/promo-campaign-wide.jpg?v=20261105c',
    mobile: '/files/promo-campaign-portrait.jpg?v=20261105c',
  };

  function setPromoPreview(id, url, fallback) {
    var box = document.getElementById(id);
    if (!box) return;
    var src = url || fallback;
    box.innerHTML = '<img src="' + escapeHtml(src) + '" alt="目前前台照片" />';
  }

  async function loadPromo() {
    var data = await api('/api/promo');
    field('promo-title').value = data.title || '活動推廣';
    setPromoPreview('promo-desktop-preview', data.desktop_image_url, PROMO_POSTERS.desktop);
    setPromoPreview('promo-mobile-preview', data.mobile_image_url, PROMO_POSTERS.mobile);
  }

  async function savePromo(patch) {
    var data = await api('/api/promo', { method: 'PUT', json: patch });
    if (patch.title !== undefined) field('promo-title').value = data.title || '活動推廣';
    if (patch.desktop_image_url !== undefined) {
      setPromoPreview('promo-desktop-preview', data.desktop_image_url, PROMO_POSTERS.desktop);
    }
    if (patch.mobile_image_url !== undefined) {
      setPromoPreview('promo-mobile-preview', data.mobile_image_url, PROMO_POSTERS.mobile);
    }
  }

  document.getElementById('promo-title-save').addEventListener('click', async function () {
    try {
      await savePromo({ title: field('promo-title').value.trim() });
      showStatus('已更新活動名稱');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  async function uploadPromoImage(inputId, fieldName) {
    var file = field(inputId).files && field(inputId).files[0];
    if (!file) return;
    var data = await uploadOne(file);
    var patch = {};
    patch[fieldName] = data.url;
    await savePromo(patch);
    field(inputId).value = '';
  }

  field('promo-desktop-file').addEventListener('change', async function () {
    try {
      await uploadPromoImage('promo-desktop-file', 'desktop_image_url');
      showStatus('電腦版照片已更新');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  field('promo-mobile-file').addEventListener('change', async function () {
    try {
      await uploadPromoImage('promo-mobile-file', 'mobile_image_url');
      showStatus('手機版照片已更新');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  document.getElementById('promo-desktop-clear').addEventListener('click', async function () {
    try {
      await savePromo({ desktop_image_url: '' });
      showStatus('已恢復電腦版海報');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  document.getElementById('promo-mobile-clear').addEventListener('click', async function () {
    try {
      await savePromo({ mobile_image_url: '' });
      showStatus('已恢復手機版海報');
    } catch (err) {
      showStatus(err.message, true);
    }
  });

  // boot
  api('/api/login')
    .then(function (data) {
      if (data.authenticated) {
        showAdmin();
        return loadCategories().then(loadStores);
      }
      showLogin();
    })
    .catch(function () {
      showLogin();
    });
})();
