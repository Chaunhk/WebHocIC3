// Google Apps Script (bound to the Google Sheet).
// Sheet tab "users": A = username, B = password, C = data (JSON, written by the app). Row 1 = headers.

function doPost(e) {
  let out;
  try { out = handle(JSON.parse(e.postData.contents)); }
  catch (err) { out = { ok: false, error: "Lỗi máy chủ" }; }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function handle(q) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("users");
  const rows = sh.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) !== String(q.u) || String(rows[i][1]) !== String(q.p)) continue;
    if (q.action === "login") return { ok: true, data: rows[i][2] ? JSON.parse(rows[i][2]) : {} };
    if (q.action === "save") {
      const s = JSON.stringify(q.data);
      if (s.length > 45000) return { ok: false, error: "Dữ liệu quá lớn" };
      const lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try { sh.getRange(i + 1, 3).setValue(s); } finally { lock.releaseLock(); }
      return { ok: true };
    }
  }
  return { ok: false, error: "Sai tên đăng nhập hoặc mật khẩu" };
}
