(function () {
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
    field('f-sort').value = '0';
    field('f-visible').checked = true;
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
    field('f-sort').value = store.sort_order != null ? store.sort_order : 0;
    field('f-visible').checked = !!store.visible;
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
    return {
      category: field('f-category').value,
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
      sort_order: Number(field('f-sort').value) || 0,
      visible: field('f-visible').checked ? 1 : 0,
    };
  }

  function renderTable() {
    var cat = filterCategory.value;
    var list = stores.filter(function (s) {
      return !cat || s.category === cat;
    });
    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="color:#6b7280;padding:20px;">尚無店家</td></tr>';
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
        '</td><td><span class="badge ' +
        (s.visible ? 'on' : 'off') +
        '">' +
        (s.visible ? '顯示' : '隱藏') +
        '</span></td><td>編輯</td>';
      tr.addEventListener('click', function () {
        fillEditor(s);
        renderTable();
      });
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
