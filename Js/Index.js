/* ════════════════════════════════
   DATA
════════════════════════════════ */
// const SCHOOL_DATA = {
//   'Khối 4': {
//     'Lớp 4A': ['Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Cường'],
//     'Lớp 4B': ['Phạm Thu Hà', 'Đỗ Quang Hùng'],
//   },
//   'Khối 5': {
//     'Lớp 5A': ['Vũ Thị Lan', 'Ngô Đức Mạnh', 'Bùi Thị Nga'],
//     'Lớp 5B': ['Hoàng Văn Phong', 'Đinh Thị Quỳnh'],
//   },
//   'Khối 3': {
//     'Lớp 3A': ['Lý Văn Sơn', 'Mai Thị Thanh'],
//     'Lớp 3B': ['Phan Đức Tuấn', 'Trịnh Thị Uyên', 'Cao Văn Vĩnh'],
//   },
// };
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

//API
const SHEET_ID = '1ym_kZsUS5_WjA9l4VsTitD5ZZIhIaF5vosyJt6GaKKc';
const API_KEY  = 'AIzaSyBNf9pyfd6W2Zm3rwVZ_CY8g8MOrYsj57k';
const SHEET_NAME = 'K3';
const maxRecord = 1000; // số dòng tối đa
fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A1:Z${maxRecord}?key=${API_KEY}`)
  .then(res => res.json())
    .then(data => {
      const rows = data.values.slice(1); // skip header row
        // const SCHOOL_DATA = {};
        rows.forEach(([ho, ten, lop, coin]) => {
            const khoi = 'Khối ' + lop.split('/')[0]; // "3/1" → "Khối 3"

            if (!SCHOOL_DATA[khoi]) SCHOOL_DATA[khoi] = {};
            if (!SCHOOL_DATA[khoi][lop]) SCHOOL_DATA[khoi][lop] = [];

            SCHOOL_DATA[khoi][lop].push(`${ho} ${ten}`);
        });

        // Now populate the Khối dropdown
        populateKhoi();
      console.log(SCHOOL_DATA);
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

/* ════════════════════════════════
   DROPDOWNS
════════════════════════════════ */
function populateKhoi() {
    selBlock.innerHTML = '<option value="" disabled selected>Chọn khối</option>';
    Object.keys(SCHOOL_DATA).sort().forEach(khoi => {
    console.log(khoi+" populated")
      selBlock.innerHTML += `<option value="${khoi}">${khoi}</option>`;
    });
}

selBlock.addEventListener('change', () => {
    resetOption(selClass, 'Chọn lớp');
    resetOption(selStudent, 'Chọn họ tên học sinh');

    const classes = SCHOOL_DATA[selBlock.value] || {};
    Object.keys(classes).sort().forEach(lop => {
        selClass.innerHTML += `<option value="${lop}">${lop}</option>`;
    });
});

selClass.addEventListener('change', () => {
    resetOption(selStudent, 'Chọn họ tên học sinh');

    const students = SCHOOL_DATA[selBlock.value][selClass.value] || [];
    students.forEach(name => {
        selStudent.innerHTML += `<option value="${name}">${name}</option>`;
    });
});

/* ════════════════════════════════
   LOGIN
════════════════════════════════ */
btnLogin.addEventListener('click', () => {
  clearError();

  const block   = selBlock.value;
  const cls     = selClass.value;
  const student = selStudent.value;
  const pass    = inpPass.value;

  if (!block || !cls || !student || !pass) {
    showError('Vui lòng điền đầy đủ thông tin.');
    return;
  }

  if (pass !== PASSWORD) {
    showError('Mật khẩu không đúng. Vui lòng thử lại.');
    return;
  }

    if (!student || !cls) {
        alert('Vui lòng nhập đầy đủ Họ tên và Lớp!');
        return;
    }

    // Lưu vào sessionStorage thay vì chỉ gán biến tạm

    sessionStorage.setItem('quiz_userName', student);
    sessionStorage.setItem('quiz_userClass', cls);

  dispName.textContent  = student;
  dispClass.textContent = cls;
  switchScreen('screen-dash');
  const name = sessionStorage.getItem('quiz_userName');
  const className = sessionStorage.getItem('quiz_userClass');
  console.log(name + className);
});

/* ════════════════════════════════
   LOGOUT
════════════════════════════════ */
btnLogout.addEventListener('click', () => {
  inpPass.value = '';
  selBlock.value = '';
  resetOption(selClass,   'Chọn lớp');
  resetOption(selStudent, 'Chọn họ tên học sinh');
  clearError();
  switchScreen('screen-login');
});

/* ════════════════════════════════
   EXAM SELECTION
════════════════════════════════ */
examGrid.addEventListener('click', e => {
  const btn = e.target.closest('.exam-btn');
  if (!btn) return;
  document.querySelectorAll('.exam-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
});

btnSubmit.addEventListener('click', () => {
  const selected = examGrid.querySelector('.exam-btn.selected');
  if (!selected) {
    alert('Vui lòng chọn một bài thi.');
    return;
  }
  alert(`Bắt đầu bài thi: ${selected.dataset.exam}`);
});

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
function startQuiz() {
    const name      = document.getElementById('txtUsername').value.trim();
    const className = document.getElementById('txtClass').value.trim();

    if (!name || !className) {
        alert('Vui lòng nhập đầy đủ Họ tên và Lớp!');
        return;
    }

    // Lưu vào sessionStorage thay vì chỉ gán biến tạm
    sessionStorage.setItem('quiz_userName', name);
    sessionStorage.setItem('quiz_userClass', className);

    // Tiếp tục các logic hiện có...
    showScreen('screenQuiz');
}
