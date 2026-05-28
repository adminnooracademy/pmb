window.PMB_CONFIG = {
  // Isi dengan Web App URL Google Apps Script setelah deploy.
  sheetsWebAppUrl: "https://script.google.com/macros/s/AKfycbzsL_XYU1bunFXr6sJ9DVpz1uJC4fN0JHddBM8asDckSkfn_yVwPSGMXkgwEI206dX7iw/exec",

  // Samakan dengan password admin di database/users.js dan Script Property ADMIN_PASSWORD di Google Apps Script.
  // Catatan: karena website statis, nilai ini tetap bisa dibaca dari source code.
  adminPassword: "ipimadmin2026",

    // false = paling aman untuk 500 peserta, hanya hasil akhir yang dikirim.
    // true = kirim event penting ke Google Sheets; gunakan hanya jika Sheets sudah kuat dan peserta tidak terlalu banyak.
    syncActivities: false,
    heartbeatSeconds: 120
  }
};
