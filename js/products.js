/**
 * products.js - Manajemen Katalog Produk & Pencarian/Filter
 * Aplikasi Sahabat Berbulu
 */

/**
 * Format angka ke format mata uang Rupiah (Rp)
 * @param {number} amount 
 * @returns {string}
 */
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0);
}

/**
 * Filter daftar produk berdasarkan kata kunci pencarian dan ID kategori
 * @param {Array} products 
 * @param {string} searchKeyword 
 * @param {string} categoryId 
 * @returns {Array}
 */
function filterProducts(products, searchKeyword = '', categoryId = '') {
  return products.filter(product => {
    const matchSearch = !searchKeyword ||
      product.nama.toLowerCase().includes(searchKeyword.toLowerCase().trim()) ||
      product.deskripsi.toLowerCase().includes(searchKeyword.toLowerCase().trim());

    const matchCategory = !categoryId || product.categoryId === categoryId;

    return matchSearch && matchCategory;
  });
}

/**
 * Mengambil nama kategori berdasarkan ID
 * @param {string} categoryId 
 * @returns {string}
 */
function getCategoryName(categoryId) {
  const categories = Storage.getCategories();
  const category = categories.find(c => c.id === categoryId);
  return category ? category.nama : 'Kategori Umum';
}

const ProductsModule = {
  formatRupiah,
  filterProducts,
  getCategoryName
};
