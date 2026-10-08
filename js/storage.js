/**
 * storage.js - Pembungkus aman (wrapper) untuk Web Storage (localStorage)
 * Aplikasi Sahabat Berbulu
 */

const STORAGE_KEYS = {
  CATEGORIES: 'sb_categories',
  PRODUCTS: 'sb_products',
  USERS: 'sb_users',
  ORDERS: 'sb_orders',
  CART: 'sb_cart',
  SESSION: 'sb_session'
};

/**
 * Membaca data dari localStorage dengan try-catch dan nilai bawaan (fallback).
 * @param {string} key 
 * @param {*} defaultValue 
 * @returns {*}
 */
function getItem(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    if (data === null || data === undefined) {
      return defaultValue;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error(`Gagal membaca key "${key}" dari localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Menyimpan data ke localStorage dengan try-catch.
 * @param {string} key 
 * @param {*} value 
 * @returns {boolean} Status keberhasilan
 */
function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan key "${key}" ke localStorage:`, error);
    return false;
  }
}

/**
 * Menghapus data dari localStorage.
 * @param {string} key 
 */
function removeItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Gagal menghapus key "${key}" dari localStorage:`, error);
  }
}

/**
 * Menginisialisasi data pertama kali dari data/products.json jika localStorage masih kosong.
 */
async function initStorage() {
  try {
    const existingProducts = getItem(STORAGE_KEYS.PRODUCTS);
    const existingCategories = getItem(STORAGE_KEYS.CATEGORIES);
    const existingUsers = getItem(STORAGE_KEYS.USERS);

    // Jika data sudah lengkap di localStorage, tidak perlu memuat ulang dari JSON
    if (existingProducts && existingCategories && existingUsers) {
      return { success: true, message: 'Data localStorage disiapkan dari penyimpanan lokal.' };
    }

    // Ambil data awal dari file data/products.json
    const response = await fetch('./data/products.json');
    if (!response.ok) {
      throw new Error(`HTTP Error status: ${response.status}`);
    }
    const initialData = await response.json();

    if (!existingCategories) {
      setItem(STORAGE_KEYS.CATEGORIES, initialData.categories || []);
    }
    if (!existingProducts) {
      setItem(STORAGE_KEYS.PRODUCTS, initialData.products || []);
    }
    if (!existingUsers) {
      setItem(STORAGE_KEYS.USERS, initialData.users || []);
    }
    if (getItem(STORAGE_KEYS.ORDERS) === null) {
      setItem(STORAGE_KEYS.ORDERS, initialData.orders || []);
    }
    if (getItem(STORAGE_KEYS.CART) === null) {
      setItem(STORAGE_KEYS.CART, {});
    }

    return { success: true, message: 'Data awal Sahabat Berbulu berhasil diisi ke localStorage.' };
  } catch (error) {
    console.error('Inisialisasi storage gagal:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Meriset seluruh data ke kondisi bawaan dari data/products.json (Khusus Fitur Reset Admin)
 */
async function resetDemoData() {
  try {
    const response = await fetch('./data/products.json');
    if (!response.ok) {
      throw new Error(`Gagal memuat data/products.json: status ${response.status}`);
    }
    const initialData = await response.json();

    setItem(STORAGE_KEYS.CATEGORIES, initialData.categories || []);
    setItem(STORAGE_KEYS.PRODUCTS, initialData.products || []);
    setItem(STORAGE_KEYS.USERS, initialData.users || []);
    setItem(STORAGE_KEYS.ORDERS, []);
    setItem(STORAGE_KEYS.CART, {});

    // Pertahankan session jika ada pengguna yang sedang login
    const currentSession = getItem(STORAGE_KEYS.SESSION);
    if (currentSession) {
      setItem(STORAGE_KEYS.SESSION, currentSession);
    }

    return { success: true, message: 'Data demo berhasil dikembalikan ke kondisi awal!' };
  } catch (error) {
    console.error('Reset data demo gagal:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Helper pencegah XSS: Melakukan sanitasi teks agar aman ditampilkan di DOM.
 * @param {string} str 
 * @returns {string}
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Pembungkus khusus koleksi data
const Storage = {
  initStorage,
  resetDemoData,
  escapeHTML,

  getCategories: () => getItem(STORAGE_KEYS.CATEGORIES, []),
  setCategories: (data) => setItem(STORAGE_KEYS.CATEGORIES, data),

  getProducts: () => getItem(STORAGE_KEYS.PRODUCTS, []),
  setProducts: (data) => setItem(STORAGE_KEYS.PRODUCTS, data),

  getUsers: () => getItem(STORAGE_KEYS.USERS, []),
  setUsers: (data) => setItem(STORAGE_KEYS.USERS, data),

  getOrders: () => getItem(STORAGE_KEYS.ORDERS, []),
  setOrders: (data) => setItem(STORAGE_KEYS.ORDERS, data),

  getCart: () => getItem(STORAGE_KEYS.CART, {}),
  setCart: (data) => setItem(STORAGE_KEYS.CART, data),

  getSession: () => getItem(STORAGE_KEYS.SESSION, null),
  setSession: (data) => setItem(STORAGE_KEYS.SESSION, data),
  clearSession: () => removeItem(STORAGE_KEYS.SESSION)
};
