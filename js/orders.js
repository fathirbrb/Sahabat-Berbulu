/**
 * orders.js - Manajemen Pesanan, Process Checkout, & Riwayat
 * Aplikasi Sahabat Berbulu
 */

/**
 * Memproses checkout dari keranjang belanja pengguna
 * @param {string} alamat 
 * @param {string} metodeBayar 
 * @returns {{success: boolean, message: string, orderId?: string}}
 */
function checkout(alamat, metodeBayar) {
  if (!Auth.isLoggedIn()) {
    return { success: false, message: 'Harap login terlebih dahulu untuk membuat pesanan.' };
  }

  const user = Auth.getCurrentUser();
  const cartDetails = CartModule.getCartDetails();

  if (!cartDetails.items || cartDetails.items.length === 0) {
    return { success: false, message: 'Keranjang belanja Anda masih kosong.' };
  }

  if (!alamat || !alamat.trim()) {
    return { success: false, message: 'Alamat pengiriman wajib diisi.' };
  }

  if (!metodeBayar) {
    return { success: false, message: 'Metode pembayaran wajib dipilih.' };
  }

  // 1. Validasi kecukupan stok seluruh produk dalam keranjang
  const products = Storage.getProducts();
  for (const item of cartDetails.items) {
    const p = products.find(prod => prod.id === item.productId);
    if (!p) {
      return { success: false, message: `Produk "${item.nama}" sudah tidak tersedia.` };
    }
    if (p.stok < item.qty) {
      return {
        success: false,
        message: `Checkout gagal! Stok "${p.nama}" tidak cukup (sisa stok: ${p.stok}, dipesan: ${item.qty}).`
      };
    }
  }

  // 2. Kurangi stok produk di database
  for (const item of cartDetails.items) {
    const p = products.find(prod => prod.id === item.productId);
    if (p) {
      p.stok -= item.qty;
    }
  }
  Storage.setProducts(products);

  // 3. Buat entri pesanan baru
  const orderId = 'ORD-' + Date.now();
  const newOrder = {
    id: orderId,
    userId: user.id,
    userNama: user.nama,
    userEmail: user.email,
    total: cartDetails.total,
    status: 'menunggu', // Status awal: menunggu, diproses, selesai, dibatal
    alamat: alamat.trim(),
    metodeBayar: metodeBayar,
    dibuatPada: new Date().toISOString(),
    items: cartDetails.items.map(item => ({
      productId: item.productId,
      nama: item.nama,
      jumlah: item.qty,
      hargaSaatBeli: item.harga
    }))
  };

  const orders = Storage.getOrders();
  orders.unshift(newOrder); // Simpan pesanan terbaru di paling atas
  Storage.setOrders(orders);

  // 4. Kosongkan keranjang belanja
  CartModule.clearCart();

  return {
    success: true,
    message: 'Pesanan Anda berhasil dibuat! Silakan cek riwayat pesanan.',
    orderId
  };
}

/**
 * Mengambil riwayat pesanan milik pengguna yang sedang login
 * @returns {Array}
 */
function getUserOrders() {
  const user = Auth.getCurrentUser();
  if (!user) return [];
  const orders = Storage.getOrders();
  return orders.filter(o => o.userId === user.id);
}

/**
 * Mengambil seluruh pesanan dalam sistem (Khusus Admin)
 * @returns {Array}
 */
function getAllOrders() {
  if (!Auth.isAdmin()) return [];
  return Storage.getOrders();
}

/**
 * Mengubah status pesanan (Khusus Admin)
 * @param {string} orderId 
 * @param {string} newStatus 'menunggu' | 'diproses' | 'selesai' | 'dibatal'
 * @returns {{success: boolean, message: string}}
 */
function updateOrderStatus(orderId, newStatus) {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak. Anda bukan admin.' };
  }

  const validStatuses = ['menunggu', 'diproses', 'selesai', 'dibatal'];
  if (!validStatuses.includes(newStatus)) {
    return { success: false, message: 'Status pesanan tidak valid.' };
  }

  const orders = Storage.getOrders();
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return { success: false, message: 'Pesanan tidak ditemukan.' };
  }

  // Jika pesanan dibatalkan dari status sebelumnya, kembalikan stok
  if (newStatus === 'dibatal' && order.status !== 'dibatal') {
    const products = Storage.getProducts();
    for (const item of order.items) {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        p.stok += item.jumlah;
      }
    }
    Storage.setProducts(products);
  }

  order.status = newStatus;
  Storage.setOrders(orders);

  return { success: true, message: `Status pesanan #${orderId} diubah menjadi "${newStatus}".` };
}

const OrdersModule = {
  checkout,
  getUserOrders,
  getAllOrders,
  updateOrderStatus
};
