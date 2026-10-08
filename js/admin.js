/**
 * admin.js - Fitur Manajemen Admin (CRUD Produk & Kategori, Reset Demo)
 * Aplikasi Sahabat Berbulu
 */

/**
 * Menambah produk baru
 * @param {object} productData 
 * @returns {{success: boolean, message: string}}
 */
function addProduct(productData) {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak! Hanya Admin yang berhak menambah produk.' };
  }

  const { categoryId, nama, deskripsi, harga, stok, ikon } = productData;
  if (!nama || !harga || stok === undefined || !categoryId) {
    return { success: false, message: 'Harap lengkapi semua data produk.' };
  }

  const products = Storage.getProducts();
  const newProduct = {
    id: 'prod-' + Date.now(),
    categoryId,
    nama: nama.trim(),
    deskripsi: (deskripsi || '').trim(),
    harga: Number(harga),
    stok: Number(stok),
    ikon: ikon || '📦'
  };

  products.push(newProduct);
  Storage.setProducts(products);

  return { success: true, message: `Produk "${newProduct.nama}" berhasil ditambahkan.` };
}

/**
 * Mengubah data produk yang ada
 * @param {string} id 
 * @param {object} updatedData 
 * @returns {{success: boolean, message: string}}
 */
function updateProduct(id, updatedData) {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak.' };
  }

  const products = Storage.getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) {
    return { success: false, message: 'Produk tidak ditemukan.' };
  }

  products[index] = {
    ...products[index],
    nama: updatedData.nama ? updatedData.nama.trim() : products[index].nama,
    categoryId: updatedData.categoryId || products[index].categoryId,
    deskripsi: updatedData.deskripsi !== undefined ? updatedData.deskripsi.trim() : products[index].deskripsi,
    harga: updatedData.harga !== undefined ? Number(updatedData.harga) : products[index].harga,
    stok: updatedData.stok !== undefined ? Number(updatedData.stok) : products[index].stok,
    ikon: updatedData.ikon || products[index].ikon
  };

  Storage.setProducts(products);
  return { success: true, message: `Data produk "${products[index].nama}" berhasil diperbarui.` };
}

/**
 * Menghapus produk
 * @param {string} id 
 * @returns {{success: boolean, message: string}}
 */
function deleteProduct(id) {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak.' };
  }

  let products = Storage.getProducts();
  const target = products.find(p => p.id === id);
  if (!target) {
    return { success: false, message: 'Produk tidak ditemukan.' };
  }

  products = products.filter(p => p.id !== id);
  Storage.setProducts(products);

  return { success: true, message: `Produk "${target.nama}" berhasil dihapus.` };
}

/**
 * Menambah kategori baru
 * @param {string} nama 
 * @param {string} jenisHewan 
 * @returns {{success: boolean, message: string}}
 */
function addCategory(nama, jenisHewan = 'Semua Hewan Peliharaan') {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak.' };
  }

  if (!nama || !nama.trim()) {
    return { success: false, message: 'Nama kategori wajib diisi.' };
  }

  const categories = Storage.getCategories();
  const newCat = {
    id: 'cat-' + Date.now(),
    nama: nama.trim(),
    jenisHewan: jenisHewan.trim()
  };

  categories.push(newCat);
  Storage.setCategories(categories);

  return { success: true, message: `Kategori "${newCat.nama}" berhasil dibuat.` };
}

/**
 * Menghapus kategori
 * @param {string} id 
 * @returns {{success: boolean, message: string}}
 */
function deleteCategory(id) {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak.' };
  }

  let categories = Storage.getCategories();
  const cat = categories.find(c => c.id === id);
  if (!cat) {
    return { success: false, message: 'Kategori tidak ditemukan.' };
  }

  categories = categories.filter(c => c.id !== id);
  Storage.setCategories(categories);

  return { success: true, message: `Kategori "${cat.nama}" berhasil dihapus.` };
}

/**
 * Mengembalikan seluruh data ke kondisi bawaan dari data/products.json
 */
async function resetDemo() {
  if (!Auth.isAdmin()) {
    return { success: false, message: 'Akses ditolak.' };
  }
  return await Storage.resetDemoData();
}

const AdminModule = {
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  deleteCategory,
  resetDemo
};
