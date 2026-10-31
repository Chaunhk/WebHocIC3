"use strict";
const $ = (id) => document.getElementById(id);

/* ---- Storage: Apps Script backend (leave API_URL empty for local-only mode) ---- */
const API_URL =
  "https://script.google.com/macros/s/AKfycbxobwy1U2aVHT1RXJ6zrdcy7Kkx7fczi7a98d103BHuW-v4_0KxlEXK4bIbxC7cZMbB/exec"; // paste the Apps Script web app URL here
const blank = () => ({
  f: {},
  lists: {},
  totals: {},
  rooms: {},
  today: [],
  rows: {},
});
let state = blank();
let auth = null;
const Store = {
  cacheKey() {
    return "dailyReport.v1." + (auth ? auth.u : "local");
  },
  loadLocal() {
    try {
      return JSON.parse(localStorage.getItem(this.cacheKey())) || {};
    } catch (e) {
      return {};
    }
  },
  save(data) {
    try {
      localStorage.setItem(this.cacheKey(), JSON.stringify(data));
    } catch (e) {
      msg("Không lưu được dữ liệu trên thiết bị.");
    }
    if (API_URL && auth) {
      clearTimeout(this.t);
      this.t = setTimeout(() => this.push(data), 800);
    }
  },
  async call(body) {
    const r = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    });
    return r.json();
  },
  async push(data) {
    try {
      const r = await this.call({ action: "save", u: auth.u, p: auth.p, data });
      if (!r.ok) msg(r.error);
    } catch (e) {
      msg("Chưa đồng bộ được. Dữ liệu vẫn được lưu trên máy.");
    }
  },
};
const persist = () => Store.save(state);
const LISTS = ["truong", "phuong", "gv", "tg", "phong", "lop", "mon"];
const ST = "T:Hoạt động tốt,B:Bình thường,K:Không hoạt động";

function msg(t) {
  $("msg").textContent = t;
}
function opts(sel, spec) {
  spec.split(",").forEach((p) => {
    const [v, l] = p.split(":");
    sel.add(new Option(v + " – " + l, v));
  });
}
const pad2 = (n) => String(n).padStart(2, "0");
const num = (id) => parseInt($(id).value, 10);
const val = (id) => $(id).value.trim();

function refreshLists() {
  LISTS.forEach((k) => {
    $("l-" + k).innerHTML = (state.lists[k] || [])
      .map((v) => `<option value="${v.replace(/"/g, "&quot;")}">`)
      .join("");
  });
}
function remember(k, v) {
  v = v.trim();
  if (!v) return;
  const a = state.lists[k] || (state.lists[k] = []);
  if (!a.includes(v)) a.push(v);
}

/* ---- Calculations ---- */
function faultyCount(text) {
  return (text.match(/PC\s*\d+/gi) || []).length;
}
function missing(total, faulty, maxPresent) {
  const m = maxPresent - (total - 1 - faulty);
  return Number.isFinite(m) && m > 0 ? m : 0;
}
function nowTime() {
  const d = new Date();
  return d.getHours() + ":" + pad2(d.getMinutes());
}
function faultyLine() {
  const t = val("loi");
  return pad2(faultyCount(t)) + (t ? " (" + t + ")" : "");
}

/* ---- Report text ---- */
function head(title) {
  return [
    title,
    "- Cấp: " + val("cap"),
    "- Tên Trường: " + val("truong"),
    "- Phân hiệu: " + val("phanhieu"),
    "- Phường / Xã: " + val("phuong"),
    "- Thời gian: " + nowTime(),
    "- Tên Giáo viên: " + val("gv"),
  ];
}
function roomLines(missingCount) {
  return [
    "- Tên Trợ giảng: " + val("tg"),
    "- Phòng máy: " + val("phong"),
    "- Tổng số máy: " + num("tong"),
    "- Số máy bị lỗi: " + faultyLine(),
    "- Số máy còn thiếu: " + missingCount,
  ];
}
function report1() {
  const m = missing(num("tong"), faultyCount(val("loi")), num("dukien"));
  return head("BÁO CÁO ĐẦU BUỔI")
    .concat(roomLines(m), [
      "- Tình trạng Netsupport: " + val("ns"),
      "- Tình trạng âm thanh: " + val("am"),
      "- Hiện trạng máy lạnh: " + val("lanh"),
    ])
    .join("\n");
}
function report2() {
  return head("BÁO CÁO CHUYÊN MÔN")
    .concat([
      "- Lớp đang dạy: " + val("lop"),
      "- Tên môn dạy: " + val("mon"),
      "- Tài liệu dạy: " + val("tailieu"),
      "- Nội dung dạy: " + val("noidung"),
      "- Số tiết dự kiến: " + val("tdukien"),
      "- Số tiết đã dạy: " + val("tday"),
      "- Số lần tổng hợp: 0",
      "- Tỷ lệ Flash GM: FGM1 0%, FGM2 0%",
      "- Tỷ lệ Flash OT: OT1 0%, OT2 0%, OT3 0%",
      "- Tỷ lệ Gmetrix: GM1 0%, GM2 0%",
    ])
    .join("\n");
}
function report3() {
  const rows = state.today.map((l) => state.rows[l] || {});
  const maxP = Math.max(...rows.map((r) => parseInt(r.p, 10)));
  const m = missing(num("tong"), faultyCount(val("loi")), maxP);
  const ls = state.today;
  return head("BÁO CÁO CUỐI BUỔI")
    .concat(roomLines(m), [
      "- Sĩ số học sinh: " +
        ls.map((l, i) => `${l} (${rows[i].p}/${rows[i].t})`).join(", "),
      "- SL có tập ghi chép: " +
        ls.map((l, i) => `${l} (${rows[i].n})`).join(", "),
      "- Tình trạng Netsupport: " + val("ns"),
      "- Tình trạng âm thanh: " + val("am"),
      "- Tốc độ Internet: " + val("internet") + " Mbps",
      "- Hiện trạng máy lạnh: " + val("lanh"),
      "- Camera hỗ trợ: " + val("camera"),
      "- Vệ sinh phòng máy: " + val("vs"),
      "- Ghế ngồi gọn gàng: " + val("ghe"),
      "- Tắt thiết bị điện: " + val("tat"),
      "- Tuân thủ nội quy: " + val("nq"),
      "- Danh sách vi phạm: " + val("vp"),
    ])
    .join("\n");
}

/* ---- Report 3 class rows ---- */
function buildRows() {
  const box = $("rows");
  if (!state.today.length) {
    box.innerHTML =
      '<p class="hint">Chưa có lớp nào. Hãy tạo báo cáo chuyên môn cho từng lớp trước.</p>';
    return;
  }
  box.innerHTML = state.today
    .map((l, i) => {
      const r = state.rows[l] || {};
      const t = r.t || state.totals[l] || "";
      return `<div class="row" data-i="${i}"><b>${l}</b>
      <label>Có mặt<input class="ri" data-k="p" type="number" min="0" required value="${r.p || ""}"></label>
      <label>Tổng<input class="ri" data-k="t" type="number" min="0" required value="${t}"></label>
      <label>Có tập<input class="ri" data-k="n" type="number" min="0" required value="${r.n || ""}"></label></div>`;
    })
    .join("");
  box.querySelectorAll(".row").forEach((row) => syncRow(row));
}
function syncRow(row) {
  const l = state.today[row.dataset.i];
  const r = (state.rows[l] = state.rows[l] || {});
  row.querySelectorAll(".ri").forEach((i) => {
    r[i.dataset.k] = i.value;
  });
  if (r.t) state.totals[l] = r.t;
}

/* ---- Output box ---- */
function show(title, text) {
  $("outTitle").textContent = title;
  $("out").value = text;
  if (matchMedia("(max-width: 899px)").matches)
    $("out").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---- Wiring ---- */
function setup() {
  document.querySelectorAll(".st").forEach((s) => opts(s, ST));
  document
    .querySelectorAll("select[data-o]")
    .forEach((s) => opts(s, s.dataset.o));
  Object.keys(state.f).forEach((id) => {
    if ($(id)) $(id).value = state.f[id];
  });
  refreshLists();
  buildRows();

  document.querySelectorAll("input[id], select[id]").forEach((el) => {
    el.addEventListener("input", () => {
      state.f[el.id] = el.value;
      persist();
    });
  });
  $("phong").addEventListener("change", () => {
    const t = state.rooms[val("phong")];
    if (t) {
      $("tong").value = t;
      state.f.tong = t;
    }
  });
  $("rows").addEventListener("input", (e) => {
    if (e.target.classList.contains("ri")) {
      syncRow(e.target.closest(".row"));
      persist();
    }
  });
  document.querySelectorAll(".tabs button").forEach((b) =>
    b.addEventListener("click", () => {
      document
        .querySelectorAll(".tabs button")
        .forEach((x) => x.classList.toggle("on", x === b));
      document.querySelectorAll(".tab").forEach((t) => {
        t.hidden = t.id !== b.dataset.tab;
      });
      msg("");
    }),
  );
  $("clearClasses").addEventListener("click", () => {
    state.today = [];
    state.rows = {};
    persist();
    buildRows();
  });
  document.querySelectorAll(".copy").forEach((b) =>
    b.addEventListener("click", () => {
      const o = $(b.dataset.for);
      o.select();
      (navigator.clipboard
        ? navigator.clipboard.writeText(o.value)
        : Promise.reject()
      )
        .catch(() => document.execCommand("copy"))
        .then(() => msg("Đã sao chép."));
    }),
  );

  $("r1").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("shared").reportValidity()) return;
    ["truong", "phuong", "gv", "tg", "phong"].forEach((k) =>
      remember(k, val(k)),
    );
    state.rooms[val("phong")] = val("tong");
    persist();
    refreshLists();
    show("BÁO CÁO ĐẦU BUỔI", report1());
  });
  $("r2").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("shared").reportValidity()) return;
    ["truong", "phuong", "gv", "lop", "mon"].forEach((k) =>
      remember(k, val(k)),
    );
    if (!state.today.includes(val("lop"))) state.today.push(val("lop"));
    persist();
    refreshLists();
    buildRows();
    show("BÁO CÁO CHUYÊN MÔN", report2());
  });
  $("r3").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("shared").reportValidity()) return;
    if (!$("r1").checkValidity()) {
      msg("Hãy nhập đủ báo cáo đầu buổi trước.");
      return;
    }
    if (!state.today.length) {
      msg("Chưa có lớp nào từ báo cáo chuyên môn.");
      return;
    }
    persist();
    show("BÁO CÁO CUỐI BUỔI", report3());
    msg("");
  });
}

/* ---- Login and start ---- */
let started = false;
function start(serverData) {
  auth = auth || null;
  const local = Store.loadLocal();
  const useServer = serverData && Object.keys(serverData).length;
  state = Object.assign(blank(), useServer ? serverData : local);
  $("login").hidden = true;
  $("app").hidden = false;
  if (!started) {
    started = true;
    setup();
  }
}
async function doLogin(u, p, silent) {
  try {
    const r = await Store.call({ action: "login", u, p });
    if (!r.ok) {
      if (!silent) msg(r.error);
      $("login").hidden = false;
      return;
    }
    auth = { u, p };
    localStorage.setItem("dailyReport.auth", JSON.stringify(auth));
    msg("");
    start(r.data);
  } catch (e) {
    msg("Không kết nối được máy chủ.");
    $("login").hidden = false;
  }
}
$("login").addEventListener("submit", (e) => {
  e.preventDefault();
  doLogin($("lu").value.trim(), $("lp").value, false);
});
$("logout").addEventListener("click", () => {
  localStorage.removeItem("dailyReport.auth");
  location.reload();
});
if (!API_URL) {
  $("logout").hidden = true;
  start(null);
} else {
  const saved = JSON.parse(localStorage.getItem("dailyReport.auth") || "null");
  if (saved) doLogin(saved.u, saved.p, true);
  else $("login").hidden = false;
}
