/* ════════════════════════════════
   STATE
════════════════════════════════ */
let questions      = [];       // dữ liệu load từ JSON
let totalQuestions = 0;
let currentQuestion = 1;
let isReviewMode    = false;
let timerInterval;
let timeInSeconds   = 45 * 60;

/* ════════════════════════════════
   DOM REFS
════════════════════════════════ */
const name = sessionStorage.getItem('quiz_userName');
const className = sessionStorage.getItem('quiz_userClass');
document.addEventListener('DOMContentLoaded', () => {
    const btnReset          = document.getElementById('btnReset');
    const btnMenuToggle     = document.getElementById('btnMenuToggle');
    const btnSubmit         = document.getElementById('btnSubmit');
    const btnPrev           = document.getElementById('btnPrev');
    const btnNext           = document.getElementById('btnNext');
    const btnBackToResult   = document.getElementById('btnBackToResult');
    const btnReview         = document.getElementById('btnReview');
    const btnExit           = document.getElementById('btnExit');
    const btnExitFromResult = document.getElementById('btnExitFromResult');
    const quizMainContent   = document.getElementById('quizMainContent');
    btnReset.addEventListener('click', resetCurrentQuestion);
    btnMenuToggle.addEventListener('click', toggleMenuModal);
    btnSubmit.addEventListener('click', submitQuiz);
    btnPrev.addEventListener('click', () => changeQuestion(-1));
    btnNext.addEventListener('click', () => changeQuestion(1));
    btnBackToResult.addEventListener('click', backToResult);
    btnReview.addEventListener('click', reviewQuiz);
    btnExit.addEventListener('click', exitQuiz);
    btnExitFromResult.addEventListener('click', exitQuiz);
    console.log(name + className);
    
});
document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        btnReset:           document.getElementById('btnReset'),
        btnMenuToggle:      document.getElementById('btnMenuToggle'),
        btnSubmit:          document.getElementById('btnSubmit'),
        btnPrev:            document.getElementById('btnPrev'),
        btnNext:            document.getElementById('btnNext'),
        btnBackToResult:    document.getElementById('btnBackToResult'),
        btnReview:          document.getElementById('btnReview'),
        btnExit:            document.getElementById('btnExit'),
        btnExitFromResult:  document.getElementById('btnExitFromResult'),
        quizMainContent:    document.getElementById('quizMainContent'),
    };

    // This will show which ones are null
    Object.entries(elements).forEach(([key, el]) => {
        if (!el) console.error(`❌ NOT FOUND: ${key}`);
        else console.log(`✅ Found: ${key}`);
    });
});

/* ════════════════════════════════
   KHỞI ĐỘNG — LOAD JSON
════════════════════════════════ */
// async function loadJSON(filename) {
//     try {
//         // Fetch the local or remote JSON file
//         const response = await fetch(file); 
        
//         // Check if the response is successful
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
        
//         // Parse the response body as JSON
//         const data = await response.json(); 
        
//         // Use the data
//         document.getElementById('output').innerText = JSON.stringify(data);
//         console.log(data);
//     } catch (error) {
//         console.error("Could not load JSON file:", error);
//     }
// }
fetch('Data/GM1LV1.json')
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        questions      = data;
        totalQuestions = data.length;
        console.log('Dữ liệu đã tải thành công:', questions);
        startQuiz();
        
    })
    .catch(err => {
        console.error('Lỗi khi tải .json:', err);
        alert('Không thể tải dữ liệu câu hỏi. Vui lòng kiểm tra Console (F12) và đảm bảo bạn đang chạy qua Live Server.');
    });

/* ════════════════════════════════
   RENDER CÂU HỎI ĐỘNG
════════════════════════════════ */

/** Tạo toàn bộ question-container cho mọi câu rồi chèn vào DOM */
function renderQuestions() {
    // Xóa các container câu hỏi cũ (giữ lại nút btnReset)
    quizMainContent.querySelectorAll('.question-container').forEach(el => el.remove());

    questions.forEach((q, idx) => {
        const container = document.createElement('div');
        container.className  = 'question-container' + (idx === 0 ? ' active' : '');
        container.id         = `qContainer${q.id}`;
        container.dataset.type = q.type;

        let inner = `<div class="question-text">${q.text}</div>`;

        // Hình ảnh (nếu có)
        if (q.image) {
            inner += `<img class="question-img" src="${q.image}" onerror="this.style.display='none'">`;
        }

        switch (q.type) {
            case 'single':
                inner += renderSingle(q);
                break;
            case 'multi':
                inner += renderMulti(q);
                break;
            case 'tf':
                inner += renderTF(q);
                break;
            case 'drag':
                inner += renderDrag(q);
                break;
        }

        container.innerHTML = inner;
        quizMainContent.appendChild(container);
    });

    // Gắn drag-drop sau khi render xong
    bindDragDrop();
}

/* ── Dạng chọn MỘT đáp án ── */
function renderSingle(q) {
    const inputName = `q${q.id}`;
    let html = '<ul class="options-list">';
    q.options.forEach(opt => {
        const isCorrect = opt.value === q.correct;
        html += `
            <li data-ans="${opt.value}"${isCorrect ? ' class="correct-target"' : ''}>
                <label>
                    <input type="radio" name="${inputName}" value="${opt.value}">
                    ${opt.label}
                    ${isCorrect ? '<span class="review-badge">✓</span>' : ''}
                </label>
            </li>`;
    });
    html += '</ul>';
    return html;
}

/* ── Dạng chọn NHIỀU đáp án ── */
function renderMulti(q) {
    const inputName = `q${q.id}`;
    const correctSet = new Set(q.correct);
    let html = '<ul class="options-list">';
    q.options.forEach(opt => {
        const isCorrect = correctSet.has(opt.value);
        html += `
            <li data-ans="${opt.value}"${isCorrect ? ' class="correct-target"' : ''}>
                <label>
                    <input type="checkbox" name="${inputName}" value="${opt.value}">
                    ${opt.label}
                    ${isCorrect ? '<span class="review-badge">✓</span>' : ''}
                </label>
            </li>`;
    });
    html += '</ul>';
    return html;
}

/* ── Dạng ĐÚNG / SAI ── */
function renderTF(q) {
    let html = `
        <table class="tf-table">
            <thead><tr><th>Phát biểu</th><th>Đúng</th><th>Sai</th></tr></thead>
            <tbody>`;
    q.rows.forEach((row, i) => {
        html += `
            <tr data-row="${i + 1}" data-correct="${row.correct}">
                <td>${row.label}</td>
                <td><input type="radio" name="${row.name}" value="Dung"></td>
                <td><input type="radio" name="${row.name}" value="Sai"></td>
            </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

/* ── Dạng KÉO THẢ ── */
function renderDrag(q) {
    let colAItems = q.items.map(item => `
        <div class="drag-item" draggable="true" id="${item.id}" data-target="${item.target}">
            ${item.label}
        </div>`).join('');

    let colBZones = q.zones.map(zone => `
        <div class="drop-zone-group">
            <div class="drop-label">${zone.label}</div>
            <div class="drop-zone" id="${zone.id}">Thả vào đây</div>
        </div>`).join('');

    return `
        <div class="matching-grid">
            <div class="column" id="colA_${q.id}">
                <h4>Cột A</h4>
                ${colAItems}
            </div>
            <div class="column" id="colB_${q.id}">
                <h4>Cột B</h4>
                ${colBZones}
            </div>
        </div>`;
}

/* ════════════════════════════════
   DRAG & DROP
════════════════════════════════ */
function bindDragDrop() {
    document.querySelectorAll('.drag-item').forEach(item => {
        item.addEventListener('dragstart', e => {
            if (isReviewMode) return e.preventDefault();
            e.dataTransfer.setData('text/plain', e.target.id);
            // Lưu lại ID container của câu hỏi hiện tại để kiểm soát phạm vi
            const qContainer = e.target.closest('.question-container');
            if (qContainer) {
                e.dataTransfer.setData('parent-container-id', qContainer.id);
            }
        });
    });

    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', e => e.preventDefault());

        zone.addEventListener('drop', e => {
            e.preventDefault();
            if (isReviewMode) return;

            const id = e.dataTransfer.getData('text');
            const sourceContainerId = e.dataTransfer.getData('parent-container-id');
            const draggedElement = document.getElementById(id);
            const target = e.target.closest('.drop-zone');
            
            if (!target || !draggedElement) return;

            // Chặn tuyệt đối không cho kéo thả phần tử từ câu này sang câu khác
            const targetContainer = target.closest('.question-container');
            if (!targetContainer || targetContainer.id !== sourceContainerId) {
                console.warn("Không được kéo thả phần tử sang câu hỏi khác!");
                return;
            }

            // Tìm chính xác Cột A động của câu hỏi hiện tại (Ví dụ: colA_1, colA_6...)
            const currentQId = sourceContainerId.replace('qContainer', '');
            const colA = document.getElementById(`colA_${currentQId}`);

            // Nếu ô đích đã có sẵn thẻ khác -> Đẩy thẻ cũ về đúng Cột A của câu hỏi đó
            if (target.children.length > 0 && target.children[0] !== draggedElement) {
                if (colA) {
                    colA.appendChild(target.children[0]);
                }
            }

            // Xóa chữ hướng dẫn mặc định và gắn thẻ mới vào ô thả
            if (target.innerText.trim() === 'Thả vào đây') {
                target.innerText = '';
            }
            target.appendChild(draggedElement);
        });
    });
}

/* ════════════════════════════════
   CHUYỂN ĐỔI MÀN HÌNH
════════════════════════════════ */
function showScreen(screenId) {
    document.getElementById('menuModal').style.display = 'none';
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

/* ════════════════════════════════
   BẢNG MỤC LỤC POPUP
════════════════════════════════ */
function toggleMenuModal() {
    const modal = document.getElementById('menuModal');
    if (modal.style.display === 'block') {
        modal.style.display = 'none';
    } else {
        buildMenuGrid();
        modal.style.display = 'block';
    }
}

function buildMenuGrid() {
    const gridContainer = document.getElementById('menuGridBlock');
    gridContainer.innerHTML = '';
    for (let i = 1; i <= totalQuestions; i++) {
        const btn = document.createElement('button');
        btn.className = 'menu-item-btn';
        btn.innerText = i;
        if (i === currentQuestion) btn.classList.add('active-current');
        btn.addEventListener('click', () => {
            currentQuestion = i;
            updateQuestionUI();
            document.getElementById('menuModal').style.display = 'none';
        });
        gridContainer.appendChild(btn);
    }
}

/* ════════════════════════════════
   1. MÀN HÌNH BẮT ĐẦU
════════════════════════════════ */
function startQuiz() {
    
    // if (!name || !className) {
    //     alert('Vui lòng nhập đầy đủ Họ tên và Lớp trước khi làm bài!');
    //     return;
    // }

    document.getElementById('lbName').innerText  = name;
    document.getElementById('lbClass').innerText = className;

    isReviewMode    = false;
    currentQuestion = 1;

    quizMainContent.classList.remove('review-mode');
    btnSubmit.style.display       = 'block';
    btnReset.style.display        = 'block';
    btnBackToResult.style.display = 'none';

    // Render câu hỏi từ JSON mỗi lần bắt đầu (đảm bảo reset sạch)
    renderQuestions();
    resetAllAnswers();

    timeInSeconds = 45 * 60;
    clearInterval(timerInterval);
    startTimer();

    updateQuestionUI();
    showScreen('screenQuiz');
}

/* ════════════════════════════════
   ĐỒNG HỒ ĐẾM NGƯỢC
════════════════════════════════ */
function startTimer() {
    timerInterval = setInterval(() => {
        const mins = Math.floor(timeInSeconds / 60);
        const secs = timeInSeconds % 60;
        document.getElementById('countdown').innerText =
            `${mins < 10 ? '0' + mins : mins} : ${secs < 10 ? '0' + secs : secs}`;
        if (timeInSeconds <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
        timeInSeconds--;
    }, 1000);
}

/* ════════════════════════════════
   2. TRONG KHI LÀM BÀI
════════════════════════════════ */
function updateQuestionUI() {
    document.getElementById('questionCounter').innerText = `Câu ${currentQuestion}/${totalQuestions}`;
    
    // 1. Ẩn tất cả các container câu hỏi
    document.querySelectorAll('.question-container').forEach(c => {
        c.classList.remove('active');
        // Ẩn tất cả các thẻ kéo thả thuộc câu hỏi này để tránh bị tràn sang câu khác
        c.querySelectorAll('.drag-item').forEach(item => {
            item.style.display = 'none';
        });
    });

    // 2. Kích hoạt container của câu hỏi hiện tại
    const _currentQ = questions[currentQuestion - 1];
    const currentContainer = _currentQ ? document.getElementById(`qContainer${_currentQ.id}`) : null;
    if (currentContainer) {
        currentContainer.classList.add('active');
        // Chỉ hiển thị các thẻ kéo thả thuộc riêng câu hỏi hiện tại này
        currentContainer.querySelectorAll('.drag-item').forEach(item => {
            item.style.display = 'block';
        });
    }
}

function changeQuestion(direction) {
    currentQuestion = Math.max(1, Math.min(totalQuestions, currentQuestion + direction));
    updateQuestionUI();
}

function resetCurrentQuestion() {
    if (isReviewMode) return;
    const _resetQ = questions[currentQuestion - 1];
    const container = _resetQ ? document.getElementById(`qContainer${_resetQ.id}`) : null;
    if (!container) return;
    container.querySelectorAll('input').forEach(i => i.checked = false);

    // Nếu là câu drag → trả tất cả item về colA
    const q = questions[currentQuestion - 1];
    if (q && q.type === 'drag') {
        const colA = document.getElementById(`colA_${q.id}`);
        container.querySelectorAll('.drag-item').forEach(item => colA.appendChild(item));
        container.querySelectorAll('.drop-zone').forEach(z => z.innerText = 'Thả vào đây');
    }
}

function resetAllAnswers() {
    quizMainContent.querySelectorAll('input').forEach(i => i.checked = false);
    quizMainContent.querySelectorAll('li, tr').forEach(el => {
        el.classList.remove('correct-ans', 'wrong-ans');
    });

    // Khôi phục chính xác trạng thái kéo thả theo từng ID câu hỏi riêng biệt
    questions.filter(q => q.type === 'drag').forEach(q => {
        const container = document.getElementById(`qContainer${q.id}`);
        const colA = document.getElementById(`colA_${q.id}`); // Lấy chuẩn ID động colA_1, colA_6...
        if (colA && container) {
            container.querySelectorAll('.drag-item').forEach(item => {
                item.style.display = 'none'; // Ẩn mặc định, hàm updateQuestionUI sẽ mở lại sau
                colA.appendChild(item);
            });
            container.querySelectorAll('.drop-zone').forEach(z => {
                z.innerText = 'Thả vào đây';
                z.classList.remove('correct-ans', 'wrong-ans');
            });
        }
    });
}

/* ════════════════════════════════
   3. CHẤM ĐIỂM ĐỘNG
════════════════════════════════ */
function gradeQuestion(q) {
    switch (q.type) {
        case 'single': return gradeSingle(q);
        case 'multi':  return gradeMulti(q);
        case 'tf':     return gradeTF(q);
        case 'drag':   return gradeDrag(q);
        default:       return false;
    }
}

function submitQuiz() {
    clearInterval(timerInterval);
    let correctCount = 0;

    questions.forEach(q => {
        const isCorrect = gradeQuestion(q);
        if (isCorrect) correctCount++;
    });

    document.getElementById('scoreText').innerText = `${correctCount} / ${totalQuestions} Câu Đúng`;
    showScreen('screenResult');
}

/** Chấm điểm + tô màu một câu, trả về true/false */
function gradeSingle(q) {
    const container = document.getElementById(`qContainer${q.id}`);
    const checked = container.querySelector(`input[name="q${q.id}"]:checked`);
    container.querySelectorAll('li').forEach(li => {
        const val = li.getAttribute('data-ans');
        if (val === q.correct) li.classList.add('correct-ans');
        else if (checked && checked.value === val) li.classList.add('wrong-ans');
    });
    return checked && checked.value === q.correct;
}

function gradeMulti(q) {
    const correctSet = new Set(q.correct);
    let userCorrect = true;
    const container = document.getElementById(`qContainer${q.id}`);

    container.querySelectorAll('li').forEach(li => {
        const val     = li.getAttribute('data-ans');
        const input   = li.querySelector('input');
        const checked = input.checked;
        const isRight = correctSet.has(val);

        if (isRight) li.classList.add('correct-ans');
        if (checked && !isRight) { li.classList.add('wrong-ans'); userCorrect = false; }
        if (!checked && isRight) userCorrect = false;
    });
    return userCorrect;
}

function gradeTF(q) {
    let allCorrect = true;
    const container = document.getElementById(`qContainer${q.id}`);
    container.querySelectorAll('tbody tr').forEach(row => {
        const corr    = row.getAttribute('data-correct');
        const userSel = row.querySelector('input:checked');
        if (!userSel || userSel.value !== corr) {
            row.classList.add('wrong-ans');
            allCorrect = false;
        } else {
            row.classList.add('correct-ans');
        }
    });
    // Tất cả rows phải có đáp án mới tính đúng
    const allAnswered = q.rows.every(row =>
        document.querySelector(`input[name="${row.name}"]:checked`)
    );
    return allCorrect && allAnswered;
}

function gradeDrag(q) {
    let allCorrect = true;
    const container = document.getElementById(`qContainer${q.id}`);
    container.querySelectorAll('.drop-zone').forEach(zone => {
        const child = zone.children[0];
        if (child && child.getAttribute('data-target') === zone.id) {
            zone.classList.add('correct-ans');
        } else {
            zone.classList.add('wrong-ans');
            allCorrect = false;
        }
    });
    return allCorrect;
}

/* ════════════════════════════════
   4. XEM LẠI / THOÁT
════════════════════════════════ */
function reviewQuiz() {
    isReviewMode = true;
    quizMainContent.classList.add('review-mode');
    btnSubmit.style.display       = 'none';
    btnReset.style.display        = 'none';
    btnBackToResult.style.display = 'block';

    currentQuestion = 1;
    updateQuestionUI();
    showScreen('screenQuiz');
}

function backToResult() { showScreen('screenResult'); }
function exitQuiz()     { window.location.href = 'index.html?t=' + Date.now(); }

/* ════════════════════════════════
   GẮN SỰ KIỆN
════════════════════════════════ */
//btnStart.addEventListener('click', startQuiz);