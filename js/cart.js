/**
 * cart.js - Manajemen Keranjang Belanja per Pengguna
 * Aplikasi Sahabat Berbulu
 */

/**
 * Mengambil keranjang belanja milik pengguna yang sedang login
 * @returns {Array<{productId: string, qty: number}>}
 */
function getUserCart() {
  const user = Auth.getCurrentUser();
  if (!user) return [];
  const cartStore = Storage.getCart();
  return cartStore[user.id] || [];
}

/**
 * Menyimpan data keranjang belanja pengguna yang sedang login
 * @param {Array} items 
 */
function saveUserCart(items) {
  const user = Auth.getCurrentUser();
  if (!user) return;
  const cartStore = Storage.getCart();
  cartStore[user.id] = items;
  Storage.setCart(cartStore);
}

/**
 * Menambahkan produk ke keranjang belanja
 * @param {string} productId 
 * @param {number} qty 
 * @returns {{success: boolean, message: string}}
 */
function addToCart(productId, qty = 1) {
  if (!Auth.isLoggedIn()) {
    return { success: false, message: 'Harap login terlebih dahulu untuk menambah produk ke keranjang.' };
  }

  const products = Storage.getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) {
    return { success: false, message: 'Produk tidak ditemukan.' };
  }

  if (product.stok <= 0) {
    return { success: false, message: 'Stok produk ini sedang habis.' };
  }

  const cart = getUserCart();
  const existingItemIndex = cart.findIndex(item => item.productId === productId);

  const currentQtyInCart = existingItemIndex >= 0 ? cart[existingItemIndex].qty : 0;
  if (currentQtyInCart + qty > product.stok) {
    return {
      success: false,
      message: `Stok tidak mencukupi. Stok yang tersedia hanya ${product.stok} unit.`
    };
  }

  if (existingItemIndex >= 0) {
    cart[existingItemIndex].qty += qty;
  } else {
    cart.push({ productId, qty });
  }

  saveUserCart(cart);
  return { success: true, message: `"${product.nama}" berhasil ditambahkan ke keranjang!` };
}

/**
 * Mengubah jumlah (quantity) produk di keranjang
 * @param {string} productId 
 * @param {number} newQty 
 * @returns {{success: boolean, message: string}}
 */
function updateQuantity(productId, newQty) {
  if (!Auth.isLoggedIn()) return { success: false, message: 'Harap login terlebih dahulu.' };

  let cart = getUserCart();
  if (newQty <= 0) {
    return removeFromCart(productId);
  }

  const products = Storage.getProducts();
  const product = products.find(p => p.id === productId);
  if (product && newQty > product.stok) {
    return { success: false, message: `Stok tidak mencukupi (tersedia: ${product.stok}).` };
  }

  const itemIndex = cart.findIndex(i => i.productId === productId);
  if (itemIndex >= 0) {
    cart[itemIndex].qty = newQty;
    saveUserCart(cart);
    return { success: true, message: 'Jumlah keranjang diperbarui.' };
  }

  return { success: false, message: 'Item tidak ditemukan di keranjang.' };
}

/**
 * Menghapus item tertentu dari keranjang belanja
 * @param {string} productId 
 */
function removeFromCart(productId) {
  let cart = getUserCart();
  cart = cart.filter(i => i.productId !== productId);
  saveUserCart(cart);
  return { success: true, message: 'Item berhasil dihapus dari keranjang.' };
}

/**
 * Mengosongkan seluruh isi keranjang belanja pengguna saat ini
 */
function clearCart() {
  saveUserCart([]);
}

/**
 * Menghitung total harga dan mendapatkan rincian item keranjang
 * @returns {{items: Array, total: number, count: number}}
 */
function getCartDetails() {
  const cart = getUserCart();
  const products = Storage.getProducts();

  let total = 0;
  let count = 0;

  const detailedItems = cart.map(item => {
    const product = products.find(p => p.id === item.productId);
    const subtotal = product ? product.harga * item.qty : 0;

    if (product) {
      total += subtotal;
      count += item.qty;
    }

    return {
      productId: item.productId,
      nama: product ? product.nama : 'Produk telah dihapus',
      harga: product ? product.harga : 0,
      stok: product ? product.stok : 0,
      ikon: product ? product.ikon : '📦',
      qty: item.qty,
      subtotal
    };
  });

  return { items: detailedItems, total, count };
}

const CartModule = {
  getUserCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getCartDetails
};
