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
  {
    level: "LV4",
    exams: ["GM1", "GM2"],
  },
  {
    level: "LV5",
    exams: ["GM1", "GM2"],
  },
  {
    level: "LV6",
    exams: ["GM1", "GM2"],
  },
];

// Grade to Level mapping
const gradeToLevel = {
  3: "LV1", // Grade 3 = LV1
  4: "LV2", // Grade 4 = LV2
  5: "LV3", // Grade 5 = LV3
};

//API
const API_CONFIG = {
  SHEET_ID: "1ym_kZsUS5_WjA9l4VsTitD5ZZIhIaF5vosyJt6GaKKc",
  API_KEY: "AIzaSyBNf9pyfd6W2Zm3rwVZ_CY8g8MOrYsj57k",
  maxRecord: 1000,
};

/* ════════════════════════════════
   DOM REFS
════════════════════════════════ */
const selSchool = document.getElementById("sel-school"); // NEW: School selector
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
  authCheck();
  // Load available schools on page load (without auto-loading first sheet)
  loadAvailableSheets();
  // Clear all data initially
  clearAllData();
});

/* ════════════════════════════════
   STEP 1: LOAD ALL AVAILABLE SHEETS (Schools)
════════════════════════════════ */

/**
 * Sheet names to exclude (won't show in school dropdown)
 * Add sheet names you want to hide here
 */
const EXCLUDED_SHEETS = [
  // 'template',     // Example: exclude sheet named 'template'
  // 'settings',     // Example: exclude sheet named 'settings'
  // 'archive',      // Example: exclude sheet named 'archive'
  "QuizLog",
];

async function loadAvailableSheets() {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.SHEET_ID}?key=${API_CONFIG.API_KEY}&fields=sheets.properties`;

    const response = await fetch(url);
    const data = await response.json();

    // Extract sheet names and filter
    const sheets = data.sheets
      .map((s) => s.properties.title)
      .filter((name) => name && name.trim()) // Filter empty names
      .filter((name) => !EXCLUDED_SHEETS.includes(name)); // Exclude specified sheets

    console.log("✓ Available sheets (schools):", sheets);
    console.log("✓ Excluded sheets:", EXCLUDED_SHEETS);

    // Populate school selector
    populateSchoolDropdown(sheets);

    return sheets;
  } catch (error) {
    console.error("✗ Error loading sheets:", error);
    showError("Failed to load schools list");
    return [];
  }
}

/**
 * Populate school dropdown with sheet names
 * Does NOT auto-load the first sheet
 */
function populateSchoolDropdown(sheets) {
  if (!selSchool) {
    console.warn("selSchool element not found");
    return;
  }

  selSchool.innerHTML =
    '<option value="" disabled selected>Chọn trường học</option>';

  sheets.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    selSchool.appendChild(option);
  });

  console.log("✓ School dropdown populated with", sheets.length, "schools");
  console.log("✓ No sheet auto-loaded - waiting for user selection");
}

/* ════════════════════════════════
   STEP 2: LOAD DATA WHEN SCHOOL IS SELECTED
════════════════════════════════ */

if (selSchool) {
  selSchool.addEventListener("change", async (e) => {
    const selectedSheet = e.target.value;

    if (!selectedSheet) {
      clearAllData();
      return;
    }

    console.log(`Loading data from sheet: ${selectedSheet}`);

    // Initialize school data structure
    if (!SCHOOL_DATA[selectedSheet]) {
      SCHOOL_DATA[selectedSheet] = {};
    }

    // Load data from selected sheet
    await loadSheetData(selectedSheet);

    // Reset dependent dropdowns
    selBlock.value = "";
    selClass.value = "";
    selStudent.value = "";
    inpPass.value = "";

    // Populate khối (grades)
    populateKhoiFromSheet(selectedSheet);

    // Update field states
    updateFieldStates();
  });
}

/**
 * Load data from a specific sheet
 */
async function loadSheetData(sheetName) {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${API_CONFIG.SHEET_ID}/values/${sheetName}!A1:Z${API_CONFIG.maxRecord}?key=${API_CONFIG.API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.values || data.values.length < 2) {
      console.warn("Sheet has no data");
      showError("Selected sheet is empty");
      return;
    }

    // Skip header row
    const rows = data.values.slice(1);

    // Process each row
    rows.forEach(([id, ho, ten, lop, coin]) => {
      // Skip empty rows
      if (!id || !ho || !ten || !lop) return;

      // Extract khối (grade) from lớp
      const khoi = "Khối " + lop.split("/")[0];

      // Initialize nested structure
      if (!SCHOOL_DATA[sheetName][khoi]) {
        SCHOOL_DATA[sheetName][khoi] = {};
      }
      if (!SCHOOL_DATA[sheetName][khoi][lop]) {
        SCHOOL_DATA[sheetName][khoi][lop] = [];
      }

      // Add student
      SCHOOL_DATA[sheetName][khoi][lop].push({
        name: `${ho} ${ten}`,
        id: id,
        lop: lop,
        khoi: khoi,
        coin: coin,
      });
    });

    console.log(`✓ Data loaded from ${sheetName}:`, SCHOOL_DATA[sheetName]);
  } catch (error) {
    console.error(`✗ Error loading sheet ${sheetName}:`, error);
    showError(`Failed to load data from ${sheetName}`);
  }
}

/* ════════════════════════════════
   STEP 3: POPULATE DEPENDENT DROPDOWNS
════════════════════════════════ */

/**
 * Populate khối dropdown from selected school
 */
function populateKhoiFromSheet(sheetName) {
  const schoolData = SCHOOL_DATA[sheetName];

  selBlock.innerHTML = '<option value="" disabled selected>Chọn khối</option>';

  if (!schoolData) {
    console.warn("No data for school:", sheetName);
    return;
  }

  // Get unique khối (grades)
  const khoiList = Object.keys(schoolData).sort();

  khoiList.forEach((khoi) => {
    const option = document.createElement("option");
    option.value = khoi;
    option.textContent = khoi;
    selBlock.appendChild(option);
  });

  console.log("✓ Khối dropdown populated:", khoiList);
}

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
  // School must be selected
  if (!selSchool || !selSchool.value) {
    selBlock.disabled = true;
    selClass.disabled = true;
    selStudent.disabled = true;
    inpPass.disabled = true;
    return;
  }

  // Enable/disable selClass based on selBlock
  selBlock.disabled = false;
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
    examGrid.innerHTML =
      "<p>Các bài kiểm tra chưa được thiết lập, vui lòng quay lại sau</p>";
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

/**
 * Clear all data when school is deselected or on initial load
 */
function clearAllData() {
  if (selBlock)
    selBlock.innerHTML =
      '<option value="" disabled selected>Chọn khối</option>';
  if (selClass)
    selClass.innerHTML = '<option value="" disabled selected>Chọn lớp</option>';
  if (selStudent)
    selStudent.innerHTML =
      '<option value="" disabled selected>Chọn học sinh</option>';
  if (inpPass) inpPass.value = "";
  updateFieldStates();
}

/* ════════════════════════════════
   DROPDOWNS
════════════════════════════════ */

selBlock.addEventListener("change", () => {
  const selectedSchool = selSchool.value;
  const selectedKhoi = selBlock.value;

  resetOption(selClass, "Chọn lớp");
  resetOption(selStudent, "Chọn họ tên học sinh");
  inpPass.value = "";

  if (!selectedKhoi) {
    updateFieldStates();
    return;
  }

  const schoolData = SCHOOL_DATA[selectedSchool];
  const classList = schoolData[selectedKhoi];

  if (!classList) {
    console.warn("No classes for khối:", selectedKhoi);
    updateFieldStates();
    return;
  }

  // Get unique lớp (classes)
  const classes = Object.keys(classList).sort();

  classes.forEach((lop) => {
    const option = document.createElement("option");
    option.value = lop;
    option.textContent = lop;
    selClass.appendChild(option);
  });

  console.log("✓ Lớp dropdown populated:", classes);
  updateFieldStates();
});

selClass.addEventListener("change", () => {
  const selectedSchool = selSchool.value;
  const selectedKhoi = selBlock.value;
  const selectedLop = selClass.value;

  resetOption(selStudent, "Chọn họ tên học sinh");
  inpPass.value = "";

  if (!selectedLop) {
    updateFieldStates();
    return;
  }

  const schoolData = SCHOOL_DATA[selectedSchool];
  const classList = schoolData[selectedKhoi];
  const students = classList[selectedLop];

  if (!students) {
    console.warn("No students for lop:", selectedLop);
    updateFieldStates();
    return;
  }

  students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.name;
    option.textContent = student.name;
    selStudent.appendChild(option);
  });

  console.log("✓ Student dropdown populated:", students.length, "students");
  updateFieldStates();
});

selStudent.addEventListener("change", () => {
  updateFieldStates();
});

/* ════════════════════════════════
   LOGIN
════════════════════════════════ */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzzItSBl5-AMSFp1ChUdmU4hTINZ41Bu27zWfxyvcyboYfj3Jz_ZHG3J0BhPLJtNgUN8w/exec";

btnLogin.addEventListener("click", async () => {
  clearError();

  const school = selSchool.value;
  const block = selBlock.value;
  const cls = selClass.value;
  const student = selStudent.value;
  const pass = inpPass.value;

  if (!school || !block || !cls || !student || !pass) {
    showError("Vui lòng điền đầy đủ thông tin.");
    return;
  }

  // Hash password before sending
  const hashedPass = await hashPassword(pass);

  // Gửi request POST lên Apps Script kèm theo thông tin trường (school)
  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "login",
      hoten: student,
      lop: cls,
      password: hashedPass,
      truong: school,
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
      sessionStorage.setItem("quiz_userSchool", school);
      sessionStorage.setItem("auth", true);

      // Get grade from user's class and set level
      const grade = getGradeFromClass(currentUser.lop);
      selectedLV = getLevelFromGrade(grade);

      // Populate exam buttons based on level
      populateExamButtons(selectedLV);

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
    // Get grade from user's class and set level
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
  selSchool.value = "";
  clearAllData();
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
