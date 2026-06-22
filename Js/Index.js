/* ════════════════════════════════
   DATA
════════════════════════════════ */

const SCHOOL_DATA = {};
const PASSWORD = "1234";
const exams = [
  {
    level: "LV1",
    exams: ["GM1", "GM2", "OT1", "OT2", "OT3"],
  },
  {
    level: "LV2",
    exams: ["GM1", "GM2", "OT1", "OT2", "OT3", "OT4", "OT5"],
  },
  {
    level: "LV3",
    exams: ["GM1", "GM2", "OT1", "OT2", "OT3", "OT4"],
  },
];

// Grade to Level mapping
const gradeToLevel = {
  3: "LV1", // Grade 3 = LV1
  4: "LV2", // Grade 4 = LV2
  5: "LV3", // Grade 5 = LV3
};

/* ════════════════════════════════
   DOM REFS
════════════════════════════════ */
const selBlock = document.getElementById("sel-block");
const selClass = document.getElementById("sel-class");
const selStudent = document.getElementById("sel-student");
const inpPass = document.getElementById("inp-pass");
const loginError = document.getElementById("login-error");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const btnMode = document.getElementById("btn-mode");
const dispName = document.getElementById("disp-name");
const dispClass = document.getElementById("disp-class");
const examGrid = document.getElementById("exam-grid");

let selectedLV = null;
let currentUser = null;
document.addEventListener("DOMContentLoaded", () => {
  // // ⭐ Initialize FormStateManager
  // FormStateManager.init({
  //   storageKey: "quizFormState", // Custom key
  //   autoSave: true, // Auto-save on change
  //   autoRestore: true, // Auto-restore on load
  //   debug: true, // Show console logs
  // });

  // // ⭐ Watch all form elements for changes
  // FormStateManager.watchElements("input, select, textarea");

  // console.log("✓ Form state manager ready!");

  authCheck();
});
//API
const SHEET_ID = "1ym_kZsUS5_WjA9l4VsTitD5ZZIhIaF5vosyJt6GaKKc";
const API_KEY = "AIzaSyBNf9pyfd6W2Zm3rwVZ_CY8g8MOrYsj57k";
const SHEET_NAME = "K3";
const maxRecord = 1000; // số dòng tối đa

fetch(
  `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A1:Z${maxRecord}?key=${API_KEY}`,
)
  .then((res) => res.json())
  .then((data) => {
    const rows = data.values.slice(1); // skip header row
    rows.forEach(([id, ho, ten, lop, coin]) => {
      if (!id || !ho || !ten || !lop) return; // skip empty rows
      const khoi = "Khối " + lop.split("/")[0];

      if (!SCHOOL_DATA[khoi]) SCHOOL_DATA[khoi] = {};
      if (!SCHOOL_DATA[khoi][lop]) SCHOOL_DATA[khoi][lop] = [];

      SCHOOL_DATA[khoi][lop].push(`${ho} ${ten}`);
    });
    populateKhoi();
    // Initialize field states: disable dependent fields
    selClass.disabled = true;
    selStudent.disabled = true;
    inpPass.disabled = true;
  })
  .catch((err) => console.error(err));

/* ════════════════════════════════
   HELPERS
════════════════════════════════ */
function switchScreen(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.add("show");
}

function clearError() {
  loginError.textContent = "";
  loginError.classList.remove("show");
}

function resetOption(selectEl, placeholder) {
  selectEl.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
}

function updateFieldStates() {
  // Enable/disable selClass based on selBlock
  selClass.disabled = !selBlock.value;

  // Enable/disable selStudent based on selClass
  selStudent.disabled = !selClass.value;

  // Enable/disable inpPass based on selStudent
  inpPass.disabled = !selStudent.value;
}

/**
 * Extract grade from class string
 * Input: "3/A", "4/B", "5/C"
 * Output: "3", "4", "5"
 */
function getGradeFromClass(classString) {
  return classString.split("/")[0];
}

/**
 * Get level based on grade
 * Grade 3 → LV1, Grade 4 → LV2, Grade 5 → LV3
 */
function getLevelFromGrade(grade) {
  return gradeToLevel[grade] || null;
}

/**
 * Get exams array for a specific level
 */
function getExamsForLevel(level) {
  const levelData = exams.find((e) => e.level === level);
  return levelData ? levelData.exams : [];
}

/**
 * Generate and populate exam buttons
 */
function populateExamButtons(level) {
  if (!level) {
    examGrid.innerHTML = "<p>Chọn lớp để xem các kỳ thi</p>";
    return;
  }

  const examList = getExamsForLevel(level);

  examGrid.innerHTML = "";
  examList.forEach((exam) => {
    const button = document.createElement("button");
    button.className = "exam-btn";
    button.textContent = exam;
    button.onclick = () => handleExamClick(exam);
    examGrid.appendChild(button);
  });
}

/* ════════════════════════════════
   DROPDOWNS
════════════════════════════════ */
function populateKhoi() {
  selBlock.innerHTML = '<option value="" disabled selected>Chọn khối</option>';
  Object.keys(SCHOOL_DATA)
    .sort()
    .forEach((khoi) => {
      selBlock.innerHTML += `<option value="${khoi}">${khoi}</option>`;
    });
}

selBlock.addEventListener("change", () => {
  resetOption(selClass, "Chọn lớp");
  resetOption(selStudent, "Chọn họ tên học sinh");
  inpPass.value = "";

  const classes = SCHOOL_DATA[selBlock.value] || {};
  Object.keys(classes)
    .sort()
    .forEach((lop) => {
      selClass.innerHTML += `<option value="${lop}">${lop}</option>`;
    });

  updateFieldStates();
});

selClass.addEventListener("change", () => {
  resetOption(selStudent, "Chọn họ tên học sinh");
  inpPass.value = "";

  const students = SCHOOL_DATA[selBlock.value][selClass.value] || [];
  students.forEach((name) => {
    selStudent.innerHTML += `<option value="${name}">${name}</option>`;
  });

  updateFieldStates();
});

selStudent.addEventListener("change", () => {
  updateFieldStates();
});

/* ════════════════════════════════
   LOGIN
════════════════════════════════ */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz8Drfqlj6t0ygE63sMsfQQWvgV5rN5tJG3XndkpDvdBdNfRuYNyDL669HXXTMENk3Ukw/exec";

btnLogin.addEventListener("click", async () => {
  clearError();

  const block = selBlock.value;
  const cls = selClass.value;
  const student = selStudent.value;
  const pass = inpPass.value;

  if (!block || !cls || !student || !pass) {
    showError("Vui lòng điền đầy đủ thông tin.");
    return;
  }

  // Hash password before sending
  const hashedPass = await hashPassword(pass);

  const url = `${APPS_SCRIPT_URL}?action=login&hoten=${encodeURIComponent(student)}&lop=${encodeURIComponent(cls)}&password=${hashedPass}`;

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "login",
      hoten: student,
      lop: cls,
      password: hashedPass,
    }),
  })
    .then((res) => res.json())
    .then((response) => {
      if (!response.success) {
        showError(response.error);
        return;
      }
      // ✅ success
      currentUser = response.data;
      sessionStorage.setItem("quiz_userName", currentUser.hoten);
      sessionStorage.setItem("quiz_userClass", currentUser.lop);
      sessionStorage.setItem("auth", true);

      // Populate exam buttons based on level

      // Save level to session
      sessionStorage.setItem("quiz_userLevel", selectedLV);
      authCheck();
    })
    .catch((err) => {
      showError("Lỗi kết nối!");
      console.error(err);
    });
});

async function hashPassword(password) {
  const salt = "destroyerZero"; // change this to anything secret
  const text = salt + password;
  const encoded = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Handle exam button click
 */
function handleExamClick(examValue) {
  if (!selectedLV) {
    console.error("Level not set");
    return;
  }

  // Create exam identifier: GM1LV1, GM2LV2, etc.
  const exam = examValue + selectedLV;
  console.log("Selected exam:", exam);

  // Store in sessionStorage
  sessionStorage.setItem("selectedExam", exam);
  sessionStorage.setItem("selectedExamName", examValue);

  // Navigate to test page
  window.location.href = "srcTest.html";
}
function authCheck() {
  console.log("Auth check:", {
    auth: sessionStorage.getItem("auth"),
    userName: sessionStorage.getItem("quiz_userName"),
    userClass: sessionStorage.getItem("quiz_userClass"),
  });
  if (
    sessionStorage.getItem("auth") == "true" &&
    sessionStorage.getItem("quiz_userName") &&
    sessionStorage.getItem("quiz_userClass")
  ) {
    //Get grade from user's class and set level
    const grade = sessionStorage.getItem("quiz_userClass").split("/")[0];
    selectedLV = getLevelFromGrade(grade);
    dispName.textContent = sessionStorage.getItem("quiz_userName");
    dispClass.textContent = sessionStorage.getItem("quiz_userClass");
    populateExamButtons(selectedLV);
    switchScreen("screen-dash");
  }
}
btnLogout.addEventListener("click", () => {
  handleLogout();
});
function handleLogout() {
  sessionStorage.clear();
  switchScreen("screen-login");
}
/* ════════════════════════════════
   NIGHT SCENE
════════════════════════════════ */
(function buildNightScene() {
  const scene = document.getElementById("night");

  // -- Stars --
  const starContainer = document.createElement("div");
  starContainer.className = "stars";

  for (let i = 0; i < 80; i++) {
    const star = document.createElement("div");
    star.className = "star";
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `top:${Math.random() * 70}%`,
      `left:${Math.random() * 100}%`,
      `animation-delay:${(Math.random() * 3).toFixed(2)}s`,
      `animation-duration:${(2 + Math.random() * 2).toFixed(2)}s`,
    ].join(";");
    starContainer.appendChild(star);
  }
  scene.appendChild(starContainer);

  // -- Shooting stars --
  const shootingStars = [
    { top: 15, left: "20%", width: "70px", delay: 0 },
    { top: 30, left: "50%", width: "20px", delay: 1.5 },
    { top: 45, left: "5%", width: "40px", delay: 3 },
  ];

  shootingStars.forEach(({ top, left, width, delay }) => {
    const shoot = document.createElement("div");
    shoot.className = "shoot";
    shoot.style.cssText = `top:${top}%;left:${left};width:${width};animation-delay:${delay}s`;
    scene.appendChild(shoot);
  });

  // -- Moons --
  const moonPositions = [{ top: 18, left: 20 }];

  moonPositions.forEach(({ top, left }) => {
    const moon = document.createElement("div");
    moon.className = "moon";
    moon.style.cssText = `top:${top}%;left:${left}%`;
    scene.appendChild(moon);
  });

  // -- Mountains (SVG) --
  const mountainSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  mountainSvg.setAttribute("viewBox", "0 0 500 200");
  mountainSvg.style.cssText =
    "position:absolute;bottom:60px;left:0;width:100%;height:auto;";
  mountainSvg.innerHTML = `
    <polygon points="0,200 100,60 200,200"   fill="#2a2840"/>
    <polygon points="80,200 200,40 320,200"  fill="#3a3860"/>
    <polygon points="240,200 370,50 500,200" fill="#2a2840"/>
    <polygon points="350,200 450,90 550,200" fill="#3a3860"/>
    <polygon points="95,200 200,60 305,200"  fill="#fff" opacity=".07"/>
    <polygon points="195,200 370,80 545,200" fill="#fff" opacity=".05"/>
  `;
  scene.appendChild(mountainSvg);

  // -- Trees (SVG) --
  const treeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  treeSvg.setAttribute("viewBox", "0 0 500 80");
  treeSvg.style.cssText =
    "position:absolute;bottom:0;left:0;width:100%;height:auto;";

  let treePaths = '<rect width="500" height="30" y="50" fill="#050810"/>';
  for (let i = 0; i < 22; i++) {
    const x = i * 24 + Math.random() * 10;
    const h = 30 + Math.random() * 30;
    const w = 10 + Math.random() * 10;
    treePaths += `<polygon points="${x},${80 - h} ${x - w / 2},80 ${x + w / 2},80" fill="#080c1a"/>`;
  }

  treeSvg.innerHTML = treePaths;
  scene.appendChild(treeSvg);
})();
