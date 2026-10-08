/**
 * auth.js - Sistem Autentikasi & Manajemen Sesi Pengguna
 * Aplikasi Sahabat Berbulu
 */

/**
 * Meng-hash kata sandi teks polos menggunakan SHA-256 lewat Web Crypto API.
 * @param {string} password 
 * @returns {Promise<string>} Hex string hasil hash
 */
async function hashPassword(password) {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Melakukan registrasi pengguna baru (default peran: 'pelanggan')
 * @param {string} nama 
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function register(nama, email, password) {
  try {
    const cleanNama = nama ? nama.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanNama || !cleanEmail || !password) {
      return { success: false, message: 'Harap isi semua bidang pendaftaran.' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Kata sandi minimal 6 karakter.' };
    }

    const users = Storage.getUsers();

    // Cek apakah email sudah terdaftar
    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return { success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' };
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      id: 'usr-' + Date.now(),
      nama: cleanNama,
      email: cleanEmail,
      passwordHash: passwordHash,
      peran: 'pelanggan'
    };

    users.push(newUser);
    Storage.setUsers(users);

    return { success: true, message: 'Registrasi berhasil! Silakan login dengan akun baru Anda.' };
  } catch (error) {
    console.error('Error registrasi:', error);
    return { success: false, message: 'Terjadi kesalahan sistem saat registrasi.' };
  }
}

/**
 * Melakukan login pengguna
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{success: boolean, message: string, user?: object}>}
 */
async function login(email, password) {
  try {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail || !password) {
      return { success: false, message: 'Email dan kata sandi wajib diisi.' };
    }

    const users = Storage.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'Email atau kata sandi tidak cocok.' };
    }

    const inputHash = await hashPassword(password);
    if (inputHash !== user.passwordHash) {
      return { success: false, message: 'Email atau kata sandi tidak cocok.' };
    }

    // Buat objek sesi (tanpa passwordHash)
    const sessionUser = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      peran: user.peran
    };

    Storage.setSession(sessionUser);
    return { success: true, message: `Selamat datang kembali, ${user.nama}!`, user: sessionUser };
  } catch (error) {
    console.error('Error login:', error);
    return { success: false, message: 'Terjadi kesalahan sistem saat login.' };
  }
}

/**
 * Melakukan logout pengguna dari sistem
 */
function logout() {
  Storage.clearSession();
}

/**
 * Mengambil data pengguna yang sedang aktif/login
 * @returns {object|null}
 */
function getCurrentUser() {
  return Storage.getSession();
}

/**
 * Memeriksa apakah pengguna sedang login
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Memeriksa apakah pengguna yang aktif memiliki peran Admin
 * @returns {boolean}
 */
function isAdmin() {
  const user = getCurrentUser();
  return user !== null && user.peran === 'admin';
}

const Auth = {
  hashPassword,
  register,
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  isAdmin
};
