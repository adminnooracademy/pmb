window.PMB_CONFIG = {
  // Isi dengan Web App URL Google Apps Script setelah deploy.
  sheetsWebAppUrl: "https://script.google.com/macros/s/AKfycbzsL_XYU1bunFXr6sJ9DVpz1uJC4fN0JHddBM8asDckSkfn_yVwPSGMXkgwEI206dX7iw/exec",

  // Samakan dengan password admin di database/users.js dan Script Property ADMIN_PASSWORD di Google Apps Script.
  // Catatan: karena website statis, nilai ini tetap bisa dibaca dari source code.
  adminPassword: "ipimadmin2026",

  monitoring:
    cameraOptional: true,
    micOptional: true,
    cameraRequired: false,
    micRequired: false,
    fullscreenRequired: false,
    syncActivities: false,
    heartbeatSeconds: 120
  }
};
