/* ════════════════════════════════
   DATA
════════════════════════════════ */

const SCHOOL_DATA = {};
const PASSWORD = '1234';

/* ════════════════════════════════
   DOM REFS
════════════════════════════════ */
const selBlock   = document.getElementById('sel-block');
const selClass   = document.getElementById('sel-class');
const selStudent = document.getElementById('sel-student');
const inpPass    = document.getElementById('inp-pass');
const loginError = document.getElementById('login-error');
const btnLogin   = document.getElementById('btn-login');
const btnLogout  = document.getElementById('btn-logout');
const btnSubmit  = document.getElementById('btn-submit');
const dispName   = document.getElementById('disp-name');
const dispClass  = document.getElementById('disp-class');
const examGrid   = document.getElementById('exam-grid');
const khoi = 0;
//API
const SHEET_ID = '1ym_kZsUS5_WjA9l4VsTitD5ZZIhIaF5vosyJt6GaKKc';
const API_KEY  = 'AIzaSyBNf9pyfd6W2Zm3rwVZ_CY8g8MOrYsj57k';
const SHEET_NAME = 'K3';
const maxRecord = 1000; // số dòng tối đa
fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A1:Z${maxRecord}?key=${API_KEY}`)
  .then(res => res.json())
    .then(data => {
      const rows = data.values.slice(1); // skip header row
        rows.forEach(([id, ho, ten, lop, coin]) => {
            if (!id || !ho || !ten || !lop) return; // skip empty rows
            khoi = 'Khối ' + lop.split('/')[0];
            
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
    .catch(err => console.error(err));
/* ════════════════════════════════
   HELPERS
════════════════════════════════ */
function switchScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.add('show');
}

function clearError() {
  loginError.textContent = '';
  loginError.classList.remove('show');
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

/* ════════════════════════════════
   DROPDOWNS
════════════════════════════════ */
function populateKhoi() {
    selBlock.innerHTML = '<option value="" disabled selected>Chọn khối</option>';
    Object.keys(SCHOOL_DATA).sort().forEach(khoi => {
    //console.log(khoi+" populated")
      selBlock.innerHTML += `<option value="${khoi}">${khoi}</option>`;
    });
}

selBlock.addEventListener('change', () => {
    resetOption(selClass, 'Chọn lớp');
    resetOption(selStudent, 'Chọn họ tên học sinh');
    inpPass.value = '';

    const classes = SCHOOL_DATA[selBlock.value] || {};
    Object.keys(classes).sort().forEach(lop => {
        selClass.innerHTML += `<option value="${lop}">${lop}</option>`;
    });
    
    updateFieldStates();
});

selClass.addEventListener('change', () => {
    resetOption(selStudent, 'Chọn họ tên học sinh');
    inpPass.value = '';

    const students = SCHOOL_DATA[selBlock.value][selClass.value] || [];
    students.forEach(name => {
        selStudent.innerHTML += `<option value="${name}">${name}</option>`;
    });
    
    updateFieldStates();
});

selStudent.addEventListener('change', () => {
    updateFieldStates();
});

/* ════════════════════════════════
   LOGIN
════════════════════════════════ */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz8Drfqlj6t0ygE63sMsfQQWvgV5rN5tJG3XndkpDvdBdNfRuYNyDL669HXXTMENk3Ukw/exec';

btnLogin.addEventListener('click', async () => {
  clearError();

  const block   = selBlock.value;
  const cls     = selClass.value;
  const student = selStudent.value;
  const pass    = inpPass.value;

  if (!block || !cls || !student || !pass) {
      showError('Vui lòng điền đầy đủ thông tin.');
      return;
  }

  // Hash password before sending
  const hashedPass = await hashPassword(pass);

  const url = `${APPS_SCRIPT_URL}?action=login&hoten=${encodeURIComponent(student)}&lop=${encodeURIComponent(cls)}&password=${hashedPass}`;
  //console.log("Peak: "+ hashedPass);
  fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
        action:   'login',
        hoten:    student,
        lop:      cls,
        password: hashedPass
    })
  })
  .then(res => res.json())
  .then(response => {
    if (!response.success) {
        showError(response.error);
        return;
      }
      // ✅ success
      currentUser = response.data;
      sessionStorage.setItem('quiz_userName', currentUser.hoten);
      sessionStorage.setItem('quiz_userClass', currentUser.lop);
      dispName.textContent  = currentUser.hoten;
      dispClass.textContent = currentUser.lop;

      switchScreen('screen-dash');
    })
    .catch(err => {
      showError('Lỗi kết nối!');
      console.error(err);
    });   
});

async function hashPassword(password) {
    const salt    = 'destroyerZero'; // change this to anything secret
    const text    = salt + password;
    const encoded = new TextEncoder().encode(text);
    const hash    = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hash))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
}
function handleExamClick(examValue) {
  let lv = khoi - 2;
  let exam = examValue + 'LV' + lv;
  console.log(exam);
  sessionStorage.setItem('selectedExam', exam);
  //window.location.href = 'srcTest.html';
}
/* ════════════════════════════════
   NIGHT SCENE
════════════════════════════════ */
(function buildNightScene() {
  const scene = document.getElementById('night');

  // -- Stars --
  const starContainer = document.createElement('div');
  starContainer.className = 'stars';

  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    star.style.cssText = [
      `width:${size}px`,
      `height:${size}px`,
      `top:${Math.random() * 70}%`,
      `left:${Math.random() * 100}%`,
      `animation-delay:${(Math.random() * 3).toFixed(2)}s`,
      `animation-duration:${(2 + Math.random() * 2).toFixed(2)}s`,
    ].join(';');
    starContainer.appendChild(star);
  }
  scene.appendChild(starContainer);

  // -- Shooting stars --
  const shootingStars = [
    { top: 15, left: '20%', width: '70px', delay: 0    },
    { top: 30, left: '50%', width: '20px', delay: 1.5  },
    { top: 45, left:  '5%', width: '40px', delay: 3    },
  ];

  shootingStars.forEach(({ top, left, width, delay }) => {
    const shoot = document.createElement('div');
    shoot.className = 'shoot';
    shoot.style.cssText = `top:${top}%;left:${left};width:${width};animation-delay:${delay}s`;
    scene.appendChild(shoot);
  });

  // -- Moons --
  const moonPositions = [
    { top: 18, left: 20 },
  ];

  moonPositions.forEach(({ top, left }) => {
    const moon = document.createElement('div');
    moon.className = 'moon';
    moon.style.cssText = `top:${top}%;left:${left}%`;
    scene.appendChild(moon);
  });

  // -- Mountains (SVG) --
  const mountainSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  mountainSvg.setAttribute('viewBox', '0 0 500 200');
  mountainSvg.style.cssText = 'position:absolute;bottom:60px;left:0;width:100%;height:auto;';
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
  const treeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  treeSvg.setAttribute('viewBox', '0 0 500 80');
  treeSvg.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;height:auto;';

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
