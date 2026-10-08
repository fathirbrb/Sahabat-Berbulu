/**
 * app.js - Pengontrol Utama, Router SPA & Sistem Animasi Scroll Sahabat Berbulu
 */

// Toast Notifikasi Helper dengan Animasi Membal
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Inisialisasi IntersectionObserver untuk Animasi Reveal saat Scroll
function initScrollObserver() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -5% 0px',
    threshold: 0.08
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Once revealed, stop watching
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    if (!el.classList.contains('active')) {
      observer.observe(el);
    }
  });
}

// Navbar Scroll Effect (Floating Apple Capsule Pill on Scroll)
function initNavbarScroll() {
  const headerWrapper = document.getElementById('header-wrapper');
  if (!headerWrapper) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      headerWrapper.classList.add('scrolled');
    } else {
      headerWrapper.classList.remove('scrolled');
    }
  });
}

// Router SPA berbasis Hash (#/)
function handleRoute() {
  const hash = window.location.hash || '#/katalog';
  const routes = ['#/katalog', '#/keranjang', '#/riwayat', '#/admin', '#/login', '#/register'];

  let activeRoute = routes.includes(hash) ? hash : '#/katalog';

  // Guard Rute Berbasis Peran (Role Checks)
  if (activeRoute === '#/admin' && !Auth.isAdmin()) {
    showToast('Akses ditolak. Rute ini hanya untuk Admin.', 'error');
    window.location.hash = '#/login';
    return;
  }

  if (activeRoute === '#/riwayat' && !Auth.isLoggedIn()) {
    showToast('Harap login terlebih dahulu untuk melihat riwayat pesanan.', 'error');
    window.location.hash = '#/login';
    return;
  }

  // Sembunyikan semua section view
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));

  // Update kelas active di link navigasi header
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === activeRoute) {
      link.classList.add('active');
    }
  });

  // Tampilkan view yang aktif
  const viewId = 'view-' + activeRoute.replace('#/', '');
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Trigger render spesifik berdasarkan rute
  updateHeaderUserNav();
  updateCartBadge();

  if (activeRoute === '#/katalog') renderKatalogView();
  else if (activeRoute === '#/keranjang') renderKeranjangView();
  else if (activeRoute === '#/riwayat') renderRiwayatView();
  else if (activeRoute === '#/admin') renderAdminView();

  // Re-observe elemen baru setelah perpindahan rute
  setTimeout(initScrollObserver, 100);
}

// Pembaruan UI Header Navigasi Pengguna & Badge Keranjang
function updateHeaderUserNav() {
  const box = document.getElementById('user-nav-box');
  const user = Auth.getCurrentUser();

  const riwayatNav = document.getElementById('nav-item-riwayat');
  const adminNav = document.getElementById('nav-item-admin');

  if (riwayatNav) riwayatNav.style.display = Auth.isLoggedIn() ? 'block' : 'none';
  if (adminNav) adminNav.style.display = Auth.isAdmin() ? 'block' : 'none';

  if (!box) return;

  if (user) {
    const roleClass = user.peran === 'admin' ? 'admin' : 'pelanggan';
    const roleText = user.peran === 'admin' ? 'Admin' : 'Pelanggan';

    box.innerHTML = `
      <div class="user-badge">
        👤 <strong>${Storage.escapeHTML(user.nama)}</strong>
        <span class="role-tag ${roleClass}">${roleText}</span>
      </div>
      <button class="btn btn-outline btn-sm" onclick="handleLogout()">Keluar</button>
    `;
  } else {
    box.innerHTML = `
      <a href="#/login" class="btn btn-outline btn-sm">Masuk</a>
      <a href="#/register" class="btn btn-primary btn-sm">Daftar</a>
    `;
  }
}

function updateCartBadge() {
  const badge = document.getElementById('cart-count-badge');
  if (!badge) return;
  const cartDetails = CartModule.getCartDetails();
  badge.textContent = cartDetails.count;
  badge.classList.remove('pop');
  void badge.offsetWidth; // trigger reflow
  badge.classList.add('pop');
}

function handleLogout() {
  Auth.logout();
  showToast('Anda telah keluar dari akun.');
  window.location.hash = '#/katalog';
  handleRoute();
}

/* ==========================================================================
   RENDER VIEW 1: KATALOG & INTERACTIVE PILLS
   ========================================================================== */
function renderKatalogView() {
  const categorySelect = document.getElementById('category-filter-select');
  const categories = Storage.getCategories();

  if (categorySelect) {
    const currentVal = categorySelect.value;
    categorySelect.innerHTML = `<option value="">Semua Kategori</option>` +
      categories.map(c => `<option value="${c.id}">${Storage.escapeHTML(c.nama)} (${Storage.escapeHTML(c.jenisHewan)})</option>`).join('');
    categorySelect.value = currentVal;
  }

  renderCategoryPills(categories);
  filterAndRenderProducts();
}

function renderCategoryPills(categories) {
  const container = document.getElementById('category-pills-container');
  if (!container) return;

  const activeCatId = document.getElementById('category-filter-select')?.value || '';

  container.innerHTML = `
    <button class="cat-pill ${activeCatId === '' ? 'active' : ''}" onclick="selectCategoryPill('')">
      ✨ Semua Kategori
    </button>
  ` + categories.map(cat => `
    <button class="cat-pill ${activeCatId === cat.id ? 'active' : ''}" onclick="selectCategoryPill('${cat.id}')">
      🐾 ${Storage.escapeHTML(cat.nama)}
    </button>
  `).join('');
}

function selectCategoryPill(catId) {
  const categorySelect = document.getElementById('category-filter-select');
  if (categorySelect) {
    categorySelect.value = catId;
  }
  const categories = Storage.getCategories();
  renderCategoryPills(categories);
  filterAndRenderProducts();
}

function filterAndRenderProducts() {
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-filter-select');
  const gridContainer = document.getElementById('product-grid-container');
  const countLabel = document.getElementById('product-count-label');

  const searchKeyword = searchInput ? searchInput.value : '';
  const categoryId = categorySelect ? categorySelect.value : '';

  const allProducts = Storage.getProducts();
  const filtered = ProductsModule.filterProducts(allProducts, searchKeyword, categoryId);

  if (countLabel) {
    countLabel.textContent = `Menampilkan ${filtered.length} dari total ${allProducts.length} produk pilihan`;
  }

  if (!gridContainer) return;

  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div class="empty-state reveal" style="grid-column: 1 / -1;">
        <div class="empty-state-icon">🔍</div>
        <h3>Produk tidak ditemukan</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Coba gunakan kata kunci pencarian atau filter kategori lain.</p>
      </div>
    `;
    setTimeout(initScrollObserver, 50);
    return;
  }

  gridContainer.innerHTML = filtered.map((prod, index) => {
    const staggerNum = (index % 6) + 1;
    const staggerClass = `stagger-${staggerNum}`;
    const imageHtml = prod.gambar
      ? `<img src="${prod.gambar}" alt="${Storage.escapeHTML(prod.nama)}" loading="lazy" onerror="this.onerror=null; this.parentNode.innerHTML='<span style=\'font-size:4rem\'>${Storage.escapeHTML(prod.ikon)}</span>';">`
      : `<span style="font-size:4rem">${Storage.escapeHTML(prod.ikon)}</span>`;

    return `
      <div class="product-card reveal ${staggerClass}">
        <div>
          <div class="product-icon-box">${imageHtml}</div>
          <div class="product-category-tag">
            ${Storage.escapeHTML(ProductsModule.getCategoryName(prod.categoryId))}
          </div>
          <h3 class="product-title">${Storage.escapeHTML(prod.nama)}</h3>
          <p class="product-desc">${Storage.escapeHTML(prod.deskripsi)}</p>
        </div>

        <div>
          <div class="product-bottom-row">
            <div>
              <span class="product-price">${ProductsModule.formatRupiah(prod.harga)}</span>
              <span class="product-stock">${prod.stok > 0 ? `Stok: ${prod.stok}` : '<strong style="color:#C73838">Stok Habis</strong>'}</span>
            </div>
            <button class="btn-round-add" title="Tambah ke Keranjang"
              ${prod.stok <= 0 ? 'disabled' : ''} 
              onclick="handleAddToCart('${prod.id}')">
              +
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  setTimeout(initScrollObserver, 80);
}

function handleAddToCart(productId) {
  const result = CartModule.addToCart(productId, 1);
  if (result.success) {
    showToast(result.message, 'success');
    updateCartBadge();
  } else {
    showToast(result.message, 'error');
  }
}

/* ==========================================================================
   RENDER VIEW 2: KERANJANG & CHECKOUT
   ========================================================================== */
function renderKeranjangView() {
  const wrapper = document.getElementById('cart-content-wrapper');
  if (!wrapper) return;

  if (!Auth.isLoggedIn()) {
    wrapper.innerHTML = `
      <div class="empty-state reveal">
        <div class="empty-state-icon">🔐</div>
        <h3>Silakan Login Terlebih Dahulu</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem; margin-bottom: 1rem;">Anda perlu masuk ke akun Anda untuk melihat keranjang dan belanja.</p>
        <a href="#/login" class="btn btn-primary">Masuk ke Akun</a>
      </div>
    `;
    setTimeout(initScrollObserver, 50);
    return;
  }

  const cartDetails = CartModule.getCartDetails();
  if (cartDetails.items.length === 0) {
    wrapper.innerHTML = `
      <div class="empty-state reveal">
        <div class="empty-state-icon">🛒</div>
        <h3>Keranjang Belanja Anda Masih Kosong</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem; margin-bottom: 1rem;">Yuk, cari produk makanan atau mainan favorit sahabat berbulumu!</p>
        <a href="#/katalog" class="btn btn-primary">Buka Katalog Produk</a>
      </div>
    `;
    setTimeout(initScrollObserver, 50);
    return;
  }

  wrapper.innerHTML = `
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; align-items: start;">
      <!-- Table Items -->
      <div class="table-responsive reveal-left">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Harga</th>
              <th>Jumlah</th>
              <th>Subtotal</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            ${cartDetails.items.map(item => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">${Storage.escapeHTML(item.ikon)}</span>
                    <div>
                      <strong>${Storage.escapeHTML(item.nama)}</strong><br>
                      <small style="color: var(--text-muted);">Sisa stok: ${item.stok}</small>
                    </div>
                  </div>
                </td>
                <td>${ProductsModule.formatRupiah(item.harga)}</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 0.3rem;">
                    <button class="btn btn-outline btn-sm" onclick="handleUpdateCartQty('${item.productId}', ${item.qty - 1})">-</button>
                    <span style="min-width: 24px; text-align: center; font-weight: 600;">${item.qty}</span>
                    <button class="btn btn-outline btn-sm" onclick="handleUpdateCartQty('${item.productId}', ${item.qty + 1})">+</button>
                  </div>
                </td>
                <td><strong>${ProductsModule.formatRupiah(item.subtotal)}</strong></td>
                <td>
                  <button class="btn btn-danger btn-sm" onclick="handleRemoveCartItem('${item.productId}')">🗑️ Hapus</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Checkout Card -->
      <div class="reveal-right" style="background: var(--bg-card); padding: 1.5rem; border-radius: var(--border-radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-soft);">
        <h3 style="margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; font-family: var(--font-heading);">Ringkasan Pesanan</h3>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span>Total Items:</span>
          <span><strong>${cartDetails.count} unit</strong></span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 1.15rem; margin-bottom: 1.25rem;">
          <span>Total Pembayaran:</span>
          <span style="color: var(--accent-primary); font-weight: 800;">${ProductsModule.formatRupiah(cartDetails.total)}</span>
        </div>

        <form id="form-checkout">
          <div class="form-group">
            <label class="form-label" for="checkout-alamat">Alamat Pengiriman Lengkap</label>
            <textarea id="checkout-alamat" class="form-control" rows="3" placeholder="Jl. Mawar No. 12, Kelurahan Melati, Kota Jakarta" required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label" for="checkout-metode">Metode Pembayaran (Simulasi)</label>
            <select id="checkout-metode" class="form-control" required>
              <option value="Transfer Bank BCA / Mandiri">Transfer Bank (BCA / Mandiri)</option>
              <option value="QRIS / E-Wallet (Gopay/OVO/Dana)">QRIS / E-Wallet (Gopay/OVO/Dana)</option>
              <option value="Bayar di Tempat (COD)">Bayar di Tempat (COD)</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block" style="margin-top: 1rem;">
            💳 Buat Pesanan Sekarang
          </button>
        </form>
      </div>
    </div>
  `;

  setTimeout(initScrollObserver, 50);

  // Bind submit event ke form checkout → buka Payment Gateway
  const checkoutForm = document.getElementById('form-checkout');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const alamat = document.getElementById('checkout-alamat').value;
      const metode = document.getElementById('checkout-metode').value;
      const cartDetails = CartModule.getCartDetails();

      if (!alamat.trim()) {
        showToast('Harap isi alamat pengiriman terlebih dahulu.', 'error');
        return;
      }
      showPaymentGateway(alamat, metode, cartDetails.total);
    });
  }
}

function handleUpdateCartQty(productId, newQty) {
  const res = CartModule.updateQuantity(productId, newQty);
  if (!res.success) showToast(res.message, 'error');
  else updateCartBadge();
  renderKeranjangView();
}

function handleRemoveCartItem(productId) {
  const res = CartModule.removeFromCart(productId);
  showToast(res.message, 'success');
  updateCartBadge();
  renderKeranjangView();
}

/* ==========================================================================
   RENDER VIEW 3: RIWAYAT PESANAN
   ========================================================================== */
function renderRiwayatView() {
  const container = document.getElementById('orders-history-container');
  if (!container) return;

  const orders = OrdersModule.getUserOrders();
  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state reveal">
        <div class="empty-state-icon">📜</div>
        <h3>Belum Ada Riwayat Pesanan</h3>
        <p style="color: var(--text-muted); margin-top: 0.5rem; margin-bottom: 1rem;">Pesanan yang Anda buat akan muncul di sini.</p>
        <a href="#/katalog" class="btn btn-primary">Belanja Sekarang</a>
      </div>
    `;
    setTimeout(initScrollObserver, 50);
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="reveal" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 1.5rem; margin-bottom: 1rem; box-shadow: var(--shadow-soft);">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
        <div>
          <strong>#${Storage.escapeHTML(order.id)}</strong>
          <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">
            ${new Date(order.dibuatPada).toLocaleString('id-ID')}
          </span>
        </div>
        <span class="status-badge ${order.status}">${Storage.escapeHTML(order.status)}</span>
      </div>

      <div style="margin-bottom: 0.75rem;">
        ${order.items.map(item => `
          <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.3rem;">
            <span>${item.jumlah}x ${Storage.escapeHTML(item.nama)}</span>
            <span>${ProductsModule.formatRupiah(item.hargaSaatBeli * item.jumlah)}</span>
          </div>
        `).join('')}
      </div>

      <div style="border-top: 1px dashed var(--border-color); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          <strong>Metode:</strong> ${Storage.escapeHTML(order.metodeBayar)} | <strong>Alamat:</strong> ${Storage.escapeHTML(order.alamat)}
        </div>
        <div style="font-size: 1.15rem; font-weight: 800; color: var(--accent-primary);">
          Total: ${ProductsModule.formatRupiah(order.total)}
        </div>
      </div>
    </div>
  `).join('');

  setTimeout(initScrollObserver, 50);
}

/* ==========================================================================
   RENDER VIEW 4: ADMIN PANEL
   ========================================================================== */
function renderAdminView() {
  if (!Auth.isAdmin()) return;
  renderAdminProducts();
  renderAdminCategories();
  renderAdminOrders();
}

function switchAdminTab(tabName) {
  ['products', 'categories', 'orders'].forEach(tab => {
    const tabBtn = document.getElementById(`admin-tab-${tab}`);
    const tabContent = document.getElementById(`admin-panel-${tab}`);
    if (tabBtn) tabBtn.classList.toggle('active', tab === tabName);
    if (tabContent) tabContent.style.display = tab === tabName ? 'block' : 'none';
  });
}

function renderAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const products = Storage.getProducts();
  tbody.innerHTML = products.map(prod => `
    <tr>
      <td style="font-size: 1.5rem;">${Storage.escapeHTML(prod.ikon)}</td>
      <td><strong>${Storage.escapeHTML(prod.nama)}</strong></td>
      <td>${Storage.escapeHTML(ProductsModule.getCategoryName(prod.categoryId))}</td>
      <td>${ProductsModule.formatRupiah(prod.harga)}</td>
      <td>${prod.stok} unit</td>
      <td>
        <div style="display: flex; gap: 0.3rem;">
          <button class="btn btn-outline btn-sm" onclick="openEditProductModal('${prod.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="handleDeleteProduct('${prod.id}')">🗑️ Hapus</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderAdminCategories() {
  const tbody = document.getElementById('admin-categories-tbody');
  if (!tbody) return;

  const categories = Storage.getCategories();
  tbody.innerHTML = categories.map(cat => `
    <tr>
      <td><code>${Storage.escapeHTML(cat.id)}</code></td>
      <td><strong>${Storage.escapeHTML(cat.nama)}</strong></td>
      <td>${Storage.escapeHTML(cat.jenisHewan)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="handleDeleteCategory('${cat.id}')">🗑️ Hapus</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  const orders = OrdersModule.getAllOrders();
  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>#${Storage.escapeHTML(order.id)}</strong></td>
      <td>${Storage.escapeHTML(order.userNama || order.userEmail)}</td>
      <td>${new Date(order.dibuatPada).toLocaleDateString('id-ID')}</td>
      <td><strong>${ProductsModule.formatRupiah(order.total)}</strong></td>
      <td><span class="status-badge ${order.status}">${Storage.escapeHTML(order.status)}</span></td>
      <td>
        <select class="form-control btn-sm" style="width: auto;" onchange="handleAdminChangeOrderStatus('${order.id}', this.value)">
          <option value="menunggu" ${order.status === 'menunggu' ? 'selected' : ''}>Menunggu</option>
          <option value="diproses" ${order.status === 'diproses' ? 'selected' : ''}>Diproses</option>
          <option value="selesai" ${order.status === 'selesai' ? 'selected' : ''}>Selesai</option>
          <option value="dibatal" ${order.status === 'dibatal' ? 'selected' : ''}>Dibatal</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function handleAdminChangeOrderStatus(orderId, newStatus) {
  const res = OrdersModule.updateOrderStatus(orderId, newStatus);
  if (res.success) {
    showToast(res.message, 'success');
    renderAdminOrders();
  } else {
    showToast(res.message, 'error');
  }
}

function openAddProductModal() {
  document.getElementById('modal-product-title').textContent = 'Tambah Produk Baru';
  document.getElementById('modal-prod-id').value = '';
  document.getElementById('form-product-modal').reset();

  populateCategorySelectInModal();
  document.getElementById('modal-product').style.display = 'flex';
}

function openEditProductModal(productId) {
  const products = Storage.getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('modal-product-title').textContent = 'Edit Produk';
  document.getElementById('modal-prod-id').value = product.id;
  document.getElementById('modal-prod-nama').value = product.nama;
  document.getElementById('modal-prod-icon').value = product.ikon;
  document.getElementById('modal-prod-harga').value = product.harga;
  document.getElementById('modal-prod-stok').value = product.stok;
  document.getElementById('modal-prod-desc').value = product.deskripsi;

  populateCategorySelectInModal(product.categoryId);
  document.getElementById('modal-product').style.display = 'flex';
}

function closeProductModal() {
  const modal = document.getElementById('modal-product');
  if (modal) {
    modal.style.display = 'none';
    modal.style.opacity = '';
  }
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal-product');
  if (modal && e.target === modal) {
    closeProductModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-product');
    if (modal && modal.style.display === 'flex') closeProductModal();
  }
});

function populateCategorySelectInModal(selectedId = '') {
  const select = document.getElementById('modal-prod-cat');
  const categories = Storage.getCategories();
  select.innerHTML = categories.map(c => `
    <option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>${Storage.escapeHTML(c.nama)}</option>
  `).join('');
}

function handleDeleteProduct(id) {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
    const res = AdminModule.deleteProduct(id);
    showToast(res.message, 'success');
    renderAdminProducts();
  }
}

function handleDeleteCategory(id) {
  if (confirm('Apakah Anda yakin ingin menghapus kategori ini?')) {
    const res = AdminModule.deleteCategory(id);
    showToast(res.message, 'success');
    renderAdminCategories();
  }
}

/* ==========================================================================
   EVENT INITIALIZATIONS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // Inisialisasi storage awal dari products.json jika kosong
  await Storage.initStorage();

  // Inisialisasi efek Scroll Reveal & Navbar Scroll
  initNavbarScroll();

  // Handle Rute awal & perubahan hash
  window.addEventListener('hashchange', handleRoute);
  handleRoute();

  // Event Listener Pencarian & Filter Katalog
  const searchInput = document.getElementById('search-input');
  const categorySelect = document.getElementById('category-filter-select');

  if (searchInput) searchInput.addEventListener('input', filterAndRenderProducts);
  if (categorySelect) categorySelect.addEventListener('change', filterAndRenderProducts);

  // Event Listener Form Login
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const pass = document.getElementById('login-password').value;

      const res = await Auth.login(email, pass);
      if (res.success) {
        showToast(res.message, 'success');
        formLogin.reset();
        window.location.hash = Auth.isAdmin() ? '#/admin' : '#/katalog';
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Event Listener Form Registrasi
  const formRegister = document.getElementById('form-register');
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nama = document.getElementById('reg-nama').value;
      const email = document.getElementById('reg-email').value;
      const pass = document.getElementById('reg-password').value;

      const res = await Auth.register(nama, email, pass);
      if (res.success) {
        showToast(res.message, 'success');
        formRegister.reset();
        window.location.hash = '#/login';
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Event Listener Modal Tambah/Edit Produk
  const btnOpenAddProduct = document.getElementById('btn-open-add-product');
  if (btnOpenAddProduct) btnOpenAddProduct.addEventListener('click', openAddProductModal);

  const formProductModal = document.getElementById('form-product-modal');
  if (formProductModal) {
    formProductModal.addEventListener('submit', (e) => {
      e.preventDefault();
      const prodId = document.getElementById('modal-prod-id').value;
      const data = {
        nama: document.getElementById('modal-prod-nama').value,
        categoryId: document.getElementById('modal-prod-cat').value,
        ikon: document.getElementById('modal-prod-icon').value,
        harga: document.getElementById('modal-prod-harga').value,
        stok: document.getElementById('modal-prod-stok').value,
        deskripsi: document.getElementById('modal-prod-desc').value
      };

      let res;
      if (prodId) {
        res = AdminModule.updateProduct(prodId, data);
      } else {
        res = AdminModule.addProduct(data);
      }

      if (res.success) {
        showToast(res.message, 'success');
        closeProductModal();
        renderAdminProducts();
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Event Listener Form Tambah Kategori
  const formAddCategory = document.getElementById('form-add-category');
  if (formAddCategory) {
    formAddCategory.addEventListener('submit', (e) => {
      e.preventDefault();
      const nama = document.getElementById('cat-name-input').value;
      const jenis = document.getElementById('cat-type-input').value;

      const res = AdminModule.addCategory(nama, jenis);
      if (res.success) {
        showToast(res.message, 'success');
        formAddCategory.reset();
        renderAdminCategories();
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Event Listener Reset Demo Data (Admin)
  const btnResetDemo = document.getElementById('btn-reset-demo');
  if (btnResetDemo) {
    btnResetDemo.addEventListener('click', async () => {
      if (confirm('Apakah Anda yakin ingin mengembalikan seluruh data ke kondisi awal demo?')) {
        const res = await AdminModule.resetDemo();
        if (res.success) {
          showToast(res.message, 'success');
          renderAdminView();
          renderKatalogView();
        } else {
          showToast(res.message, 'error');
        }
      }
    });
  }
});

/* ==========================================================================
   PAYMENT GATEWAY MODULE — SahabatPay (Simulasi)
   ========================================================================== */

// State untuk payment gateway
let _pgPendingCheckout = null;
let _pgQRTimerInterval = null;
let _pgQRSeconds = 300; // 5 menit

/**
 * Tampilkan modal payment gateway
 * @param {string} alamat   - Alamat pengiriman
 * @param {string} metode   - Metode pembayaran dipilih user
 * @param {number} total    - Total tagihan (angka)
 */
function showPaymentGateway(alamat, metode, total) {
  _pgPendingCheckout = { alamat, metode };

  const modal = document.getElementById('modal-payment');
  if (!modal) return;

  // Reset ke step 1
  document.getElementById('pg-step-details').style.display = '';
  document.getElementById('pg-step-processing').style.display = 'none';
  document.getElementById('pg-step-success').style.display = 'none';

  // Isi jumlah
  const amountEl = document.getElementById('pg-amount-display');
  if (amountEl) amountEl.textContent = ProductsModule.formatRupiah(total);

  // Isi COD total
  const codTotal = document.getElementById('pg-cod-total');
  if (codTotal) codTotal.textContent = ProductsModule.formatRupiah(total);

  // Generate order reference
  const ref = 'SB-' + Date.now().toString(36).toUpperCase().slice(-6);
  const orderIdEl = document.getElementById('pg-order-id-display');
  if (orderIdEl) orderIdEl.textContent = 'Order #' + ref;

  // Auto-select tab based on metode from checkout form
  if (metode.includes('QRIS') || metode.includes('Wallet') || metode.includes('E-Wallet')) {
    switchPayTab('qris');
  } else if (metode.includes('COD') || metode.includes('Tempat')) {
    switchPayTab('cod');
  } else {
    switchPayTab('transfer');
  }

  // Tampilkan modal
  modal.style.display = 'flex';

  // Generate QR (canvas)
  generateFakeQR();
}

/**
 * Ganti tab metode pembayaran (Transfer / QRIS / COD)
 */
function switchPayTab(tabName) {
  ['transfer', 'qris', 'cod'].forEach(t => {
    const tab = document.getElementById('tab-' + t);
    const panel = document.getElementById('pg-panel-' + t);
    if (tab) tab.classList.toggle('active', t === tabName);
    if (panel) panel.style.display = t === tabName ? '' : 'none';
  });

  // Mulai timer QR jika tab qris
  if (tabName === 'qris') {
    startQRTimer();
  } else {
    if (_pgQRTimerInterval) clearInterval(_pgQRTimerInterval);
  }
}

/**
 * Generate fake QR Code di canvas menggunakan pixel-art acak tapi deterministik
 */
function generateFakeQR() {
  const canvas = document.getElementById('pg-qr-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const size = 160;
  const modules = 21; // 21x21 grid
  const cellSize = size / modules;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);

  // Pseudo-random seed berdasarkan timestamp
  let seed = Date.now() % 9999;
  function pseudoRandom() {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return Math.abs(seed) / 0x7fffffff;
  }

  // Finder patterns (pojok kiri atas, kanan atas, kiri bawah)
  function drawFinder(x, y) {
    ctx.fillStyle = '#1D1D1F';
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = 'white';
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#1D1D1F';
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  }

  // Draw data modules
  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      // Skip finder pattern areas
      if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) continue;
      // Timing patterns
      if (r === 6 || c === 6) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#1D1D1F' : 'white';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        continue;
      }
      if (pseudoRandom() > 0.45) {
        ctx.fillStyle = '#1D1D1F';
        ctx.fillRect(c * cellSize + 0.5, r * cellSize + 0.5, cellSize - 1, cellSize - 1);
      }
    }
  }

  // Draw finder patterns on top
  drawFinder(0, 0);
  drawFinder(modules - 7, 0);
  drawFinder(0, modules - 7);

  // Alignment pattern (center-ish)
  ctx.fillStyle = '#1D1D1F';
  ctx.fillRect(12 * cellSize, 12 * cellSize, 5 * cellSize, 5 * cellSize);
  ctx.fillStyle = 'white';
  ctx.fillRect(13 * cellSize, 13 * cellSize, 3 * cellSize, 3 * cellSize);
  ctx.fillStyle = '#1D1D1F';
  ctx.fillRect(14 * cellSize, 14 * cellSize, cellSize, cellSize);
}

/**
 * Countdown timer untuk QRIS (5 menit)
 */
function startQRTimer() {
  if (_pgQRTimerInterval) clearInterval(_pgQRTimerInterval);
  _pgQRSeconds = 300;

  function updateTimer() {
    const el = document.getElementById('pg-qr-timer');
    if (!el) { clearInterval(_pgQRTimerInterval); return; }
    const m = Math.floor(_pgQRSeconds / 60);
    const s = _pgQRSeconds % 60;
    el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (_pgQRSeconds <= 0) {
      clearInterval(_pgQRTimerInterval);
      el.textContent = 'Expired';
      el.style.color = '#C73838';
    }
    _pgQRSeconds--;
  }

  updateTimer();
  _pgQRTimerInterval = setInterval(updateTimer, 1000);
}

/**
 * Simulasi proses pembayaran (progress bar + status text)
 * Setelah selesai → panggil finalizePayment()
 */
function simulatePaymentProcessing() {
  if (_pgQRTimerInterval) clearInterval(_pgQRTimerInterval);

  // Pindah ke step processing
  document.getElementById('pg-step-details').style.display = 'none';
  document.getElementById('pg-step-processing').style.display = 'flex';

  const fillEl = document.getElementById('pg-progress-fill');
  const statusEl = document.getElementById('pg-processing-status');

  const steps = [
    { pct: 20, label: 'Memverifikasi pembayaran...', delay: 400 },
    { pct: 45, label: 'Mengecek keamanan transaksi...', delay: 800 },
    { pct: 70, label: 'Mengonfirmasi dengan bank...', delay: 700 },
    { pct: 90, label: 'Memproses pesanan...', delay: 600 },
    { pct: 100, label: 'Pembayaran berhasil! ✓', delay: 500 }
  ];

  let cumDelay = 0;
  steps.forEach(step => {
    cumDelay += step.delay;
    setTimeout(() => {
      if (fillEl) fillEl.style.width = step.pct + '%';
      if (statusEl) {
        statusEl.style.animation = 'none';
        void statusEl.offsetWidth;
        statusEl.style.animation = 'statusFade 0.5s var(--ease)';
        statusEl.textContent = step.label;
      }
    }, cumDelay);
  });

  // Setelah semua step selesai → finalize
  setTimeout(() => {
    finalizePayment();
  }, cumDelay + 600);
}

/**
 * Finalisasi: proses order, tampilkan success screen
 */
function finalizePayment() {
  if (!_pgPendingCheckout) return;

  const res = OrdersModule.checkout(_pgPendingCheckout.alamat, _pgPendingCheckout.metode);

  // Pindah ke step success
  document.getElementById('pg-step-processing').style.display = 'none';
  document.getElementById('pg-step-success').style.display = 'flex';

  if (res.success) {
    updateCartBadge();

    const detailEl = document.getElementById('pg-success-detail');
    if (detailEl) {
      detailEl.innerHTML = `
        <div style="margin-bottom: 0.3rem;">📍 <strong>Alamat:</strong> ${Storage.escapeHTML(_pgPendingCheckout.alamat.slice(0, 60))}${_pgPendingCheckout.alamat.length > 60 ? '...' : ''}</div>
        <div>💳 <strong>Metode:</strong> ${Storage.escapeHTML(_pgPendingCheckout.metode)}</div>
      `;
    }

    // Tutup modal & redirect setelah 3 detik
    setTimeout(() => {
      closePaymentGateway();
      showToast('🎉 Pesanan berhasil dibuat!', 'success');
      window.location.hash = '#/riwayat';
    }, 3000);
  } else {
    // Kalau ada error, tutup modal dan tampilkan error toast
    setTimeout(() => {
      closePaymentGateway();
      showToast(res.message || 'Terjadi kesalahan saat memproses pesanan.', 'error');
    }, 1500);
  }

  _pgPendingCheckout = null;
}

/**
 * Tutup payment gateway modal
 */
function closePaymentGateway() {
  if (_pgQRTimerInterval) clearInterval(_pgQRTimerInterval);
  const modal = document.getElementById('modal-payment');
  if (modal) modal.style.display = 'none';
}

/**
 * Copy nomor rekening ke clipboard
 */
function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    if (btn) {
      btn.textContent = '✓ Disalin';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Salin';
        btn.classList.remove('copied');
      }, 2000);
    }
  }).catch(() => {
    showToast('Gagal menyalin teks.', 'error');
  });
}

// Tutup payment modal dengan klik backdrop
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal-payment');
  if (modal && e.target === modal) closePaymentGateway();
});
