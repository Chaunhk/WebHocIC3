const API_URL = 'https://script.google.com/macros/s/AKfycbymSYuhfwsUn3dLbNGjRa9e3zHWiS5LFHC-LBB3MQKSWxF-8mleozE6S0FXQ9etXqhX-A/exec';

    let currentRawStudents = []; 
    let currentUser = null;       
    let currentQuizData = [];     
    let userAnswers = {};         
    let currentIndex = 0;
    let isReviewMode = false;
    let timeLeft = 45 * 60;
    let timerInterval;
    let selectedTopicName = "";

    function showLoading(status) { document.getElementById('loading-overlay').style.display = status ? 'flex' : 'none'; }
    function showDebug(msg) { const db = document.getElementById('debug-box'); if(msg) { db.innerText = msg; db.style.display = 'block'; } else { db.style.display = 'none'; } }

    function loadHocSinhTheoKhoi() {
        const khoi = document.getElementById('select-khoi').value;
        const selectLop = document.getElementById('select-lop');
        const selectHoTen = document.getElementById('select-hoten');
        if(!khoi) { selectLop.disabled = selectHoTen.disabled = true; return; }
        showLoading(true); showDebug(null);
        fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getStudents', khoi: khoi }) })
        .then(res => res.json())
        .then(response => {
            showLoading(false);
            if(!response.success) { showDebug("❌ LỖI HỆ THỐNG: " + response.error); selectLop.disabled = true; return; }
            currentRawStudents = response.data;
            const lops = [...new Set(currentRawStudents.map(s => s.lop))].filter(Boolean).sort();
            selectLop.innerHTML = '<option value="">-- Chọn Lớp --</option>';
            lops.forEach(l => { selectLop.innerHTML += `<option value="${l}">${l}</option>`; });
            selectLop.disabled = false;
            selectHoTen.innerHTML = '<option value="">-- Chọn Học Sinh --</option>'; selectHoTen.disabled = true;
        }).catch(err => { showLoading(false); showDebug("❌ Không thể kết nối tới API: " + err.message); });
    }

    function locDanhSachHocSinh() {
        const lopSelected = document.getElementById('select-lop').value;
        const selectHoTen = document.getElementById('select-hoten');
        if(!lopSelected) { selectHoTen.disabled = true; return; }
        const filtered = currentRawStudents.filter(s => s.lop === lopSelected);
        selectHoTen.innerHTML = '<option value="">-- Chọn Học Sinh --</option>';
        filtered.forEach(s => { selectHoTen.innerHTML += `<option value="${s.hoten}">${s.hoten}</option>`; });
        selectHoTen.disabled = false;
    }

    function handleLogin() {
        const lop = document.getElementById('select-lop').value;
        const hoten = document.getElementById('select-hoten').value;
        const pass = document.getElementById('input-password').value.trim();
        const user = currentRawStudents.find(s => s.lop === lop && s.hoten === hoten);
        if(user && String(user.password) === pass) { 
            currentUser = user; 
            updateTopbarUI("Đăng Xuất");
            showTopicSelection(); 
        } else { 
            alert("Mật khẩu hoặc thông tin đăng nhập không chính xác!"); 
        }
    }

    function updateTopbarUI(btnText) {
        document.getElementById('common-student-topbar').style.display = 'flex';
        document.getElementById('topbar-user-text').innerHTML = `Họ và tên: ${currentUser.hoten}<br>Lớp: ${currentUser.lop}`;
        const mainBtn = document.getElementById('btn-topbar-main');
        if (btnText === null) mainBtn.style.display = 'none';
        else { mainBtn.style.display = 'inline-block'; mainBtn.innerText = btnText; }
    }

    function handleTopbarAction() {
        const currentText = document.getElementById('btn-topbar-main').innerText;
        if (currentText === "Đăng Xuất") logoutQuiz();
        else if (currentText === "Kết quả") {
            document.getElementById("view-quiz").style.display = "none";
            document.getElementById("view-result").style.display = "block";
            updateTopbarUI("Đăng Xuất");
        }
    }

    function showTopicSelection() {
        document.getElementById('view-auth').style.display = 'none'; 
        document.getElementById('view-topics').style.display = 'block';
        document.getElementById('view-myhome').style.display = 'none';
        document.getElementById('view-quiz').style.display = 'none';
        document.getElementById('view-result').style.display = 'none';
        updateTopbarUI("Đăng Xuất");

        const container = document.getElementById('container-topics'); container.innerHTML = '';
        let maxDe = currentUser.khoi === '6' ? 6 : 8;
        for(let i = 1; i <= maxDe; i++) {
            container.innerHTML += `<button class="btn-topic" onclick="fetchQuizDataFromServer(${currentUser.khoi}, ${i})">Bộ đề số ${i}</button>`;
        }
    }

    function updateMyHomeUI() {
        document.getElementById('home-stats-details').innerHTML = `
            Level: ${currentUser.level || 1}<br>
            Exp: ${currentUser.exp || 0}<br>
            Power: 💪 ${currentUser.power || 0}
        `;
        document.getElementById('home-coin-val').innerHTML = `🪙 ${currentUser.coin || 0}`;
        document.getElementById('home-win-val').innerText = `Thắng: ⚔️ ${currentUser.win || 0}`;

        const petImgEl = document.getElementById('display-pet-img');
        petImgEl.src = (currentUser.petImg && currentUser.petImg !== "") ? currentUser.petImg : "https://i.imgur.com/B9OQfC7.png";
    }

    /* ĐÃ ĐỔI: SẮP XẾP BXH THEO LỰC CHIẾN VÀ BỎ CHỮ PWR THỪA */
    function renderBXH() {
        const bxhContainer = document.getElementById('home-bxh-container');
        bxhContainer.innerHTML = '';
        
        // Sắp xếp: Ưu tiên theo Lực chiến (power). Nếu bằng nhau so đến số trận thắng, sau đó là coin.
        const sortedClass = [...currentRawStudents].sort((a, b) => {
            const powerA = a.power || 0;
            const powerB = b.power || 0;
            if (powerB !== powerA) {
                return powerB - powerA; 
            }
            const winA = a.win || 0;
            const winB = b.win || 0;
            if (winB !== winA) {
                return winB - winA;
            }
            return (b.coin || 0) - (a.coin || 0); 
        }).slice(0, 7);

        sortedClass.forEach((st, idx) => {
            // ĐÃ BỎ: Chữ pwr sau số lực chiến
            bxhContainer.innerHTML += `
                <li class="bxh-item" style="${st.hoten === currentUser.hoten ? 'color:#e67e22; font-weight:bold;' : ''}">
                    <span>${idx + 1}. ${st.hoten}</span>
                    <span>💪 ${st.power || 0}</span>
                </li>`;
        });
    }

    function switchToMyHome() {
        document.getElementById('view-topics').style.display = 'none';
        document.getElementById('view-myhome').style.display = 'block';
        updateMyHomeUI();
        renderBXH();
    }

    function handleFeedPet() {
        if ((currentUser.coin || 0) < 50) { alert("❌ Không đủ Coin! Bạn cần ít nhất 50 Coin."); return; }
        showLoading(true);
        fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'feedPet', khoi: currentUser.khoi, lop: currentUser.lop, hoten: currentUser.hoten })
        })
        .then(res => res.json())
        .then(response => {
            showLoading(false);
            if (response.success) {
                currentUser.coin = response.newCoin; currentUser.exp = response.newExp;
                let m = currentRawStudents.find(s => s.lop === currentUser.lop && s.hoten === currentUser.hoten);
                if(m) { m.coin = response.newCoin; m.exp = response.newExp; }
                updateMyHomeUI(); renderBXH(); alert("🎉 Cho Pet ăn thành công! -50 Coin, +50 EXP.");
            } else alert("❌ Lỗi: " + response.error);
        }).catch(err => { showLoading(false); alert("❌ Lỗi kết mạng: " + err.message); });
    }

    function handlePvPBattle() {
        const enemies = currentRawStudents.filter(s => !(s.lop === currentUser.lop && s.hoten === currentUser.hoten));
        if (enemies.length === 0) {
            alert("⚠️ Hiện tại trong khối chưa có học sinh nào khác để bạn thách đấu!");
            return;
        }

        const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        
        document.getElementById('battle-my-pet').src = (currentUser.petImg && currentUser.petImg !== "") ? currentUser.petImg : "https://i.imgur.com/B9OQfC7.png";
        document.getElementById('battle-my-name').innerText = currentUser.hoten;
        
        document.getElementById('battle-enemy-pet').src = (randomEnemy.petImg && randomEnemy.petImg !== "") ? randomEnemy.petImg : "https://i.imgur.com/B9OQfC7.png";
        document.getElementById('battle-enemy-name').innerText = randomEnemy.hoten;

        const battleOverlay = document.getElementById('battle-overlay');
        battleOverlay.style.display = 'flex';

        setTimeout(() => {
            battleOverlay.style.display = 'none'; 

            let myPower = currentUser.power || 0;
            let enemyPower = randomEnemy.power || 0;

            if (myPower >= enemyPower) {
                showLoading(true);
                fetch(API_URL, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'pvpBattle', khoi: currentUser.khoi, lop: currentUser.lop, hoten: currentUser.hoten })
                })
                .then(res => res.json())
                .then(response => {
                    showLoading(false);
                    if (response.success) {
                        currentUser.win = response.newWin; 
                        let m = currentRawStudents.find(s => s.lop === currentUser.lop && s.hoten === currentUser.hoten);
                        if(m) m.win = response.newWin; 
                        
                        updateMyHomeUI();
                        renderBXH(); 
                        alert(`🏆 CHIẾN THẮNG!\nPet của bạn dũng mãnh hơn (Lực chiến: ${myPower}) và đã đánh bại Pet của ${randomEnemy.hoten} (Lực chiến: ${enemyPower})!`);
                    } else {
                        alert("❌ Lỗi cập nhật dữ liệu: " + response.error);
                    }
                })
                .catch(err => { showLoading(true); alert("❌ Lỗi kết nối mạng: " + err.message); });
            } else {
                alert(`😢 THẤT BẠI!\nLực chiến của bạn (${myPower}) yếu hơn Pet của ${randomEnemy.hoten} (${enemyPower}). Hãy làm thêm bài trắc nghiệm để nâng cấp lực chiến mạnh hơn nhé!`);
            }
        }, 2000); 
    }

    function switchToTopics() { document.getElementById('view-myhome').style.display = 'none'; document.getElementById('view-topics').style.display = 'block'; }

    function fetchQuizDataFromServer(khoi, boDeIndex) {
        showLoading(true); selectedTopicName = `Khối ${khoi} - Bộ đề số ${boDeIndex}`;
        fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'getQuiz', khoi: khoi, boDeIndex: boDeIndex }) })
        .then(res => res.json())
        .then(response => { showLoading(false); if(!response.success) { alert(response.error); return; } startQuiz(response.data); })
        .catch(err => { showLoading(false); alert("Lỗi tải đề thi: " + err.message); });
    }

    function startQuiz(quizData) {
        currentQuizData = quizData; userAnswers = {};
        currentQuizData.forEach(q => {
            if(q.type === "single") userAnswers[q.id] = null;
            else if(q.type === "multi") userAnswers[q.id] = [];
            else if(q.type === "true_false" || q.type === "matching") userAnswers[q.id] = {};
        });
        currentIndex = 0; isReviewMode = false; timeLeft = 45 * 60;
        updateTopbarUI(null); 
        document.getElementById('view-topics').style.display = 'none'; 
        document.getElementById('view-quiz').style.display = 'block'; 
        renderQuestion(0);
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (timeLeft <= 0) { clearInterval(timerInterval); submitQuiz(); return; }
            timeLeft--; let min = Math.floor(timeLeft / 60), sec = timeLeft % 60;
            document.getElementById("txt-timer").innerText = `${min < 10 ? '0'+min : min} : ${sec < 10 ? '0'+sec : sec}`;
        }, 1000);
    }

    function renderQuestion(index) {
        currentIndex = index; const q = currentQuizData[index];
        document.getElementById("txt-question-index").innerText = `Câu ${index + 1}/${currentQuizData.length}`;
        document.getElementById("btn-prev").style.display = index === 0 ? "none" : "inline-block";
        document.getElementById("btn-next").style.display = index === currentQuizData.length - 1 ? "none" : "inline-block";
        document.getElementById("btn-submit").style.display = (index === currentQuizData.length - 1 && !isReviewMode) ? "inline-block" : "none";
        
        const container = document.getElementById("dynamic-question-box"); 
        container.innerHTML = `
            <button class="btn-topbar-action" style="position: absolute; top: 10px; right: 10px; background: #34495e; padding: 6px 12px; font-size:0.85rem;" onclick="resetCurrentQuestion()">Đặt lại</button>
            <p class="question-title" style="margin-right: 80px;">${q.title}</p>
        `;
        if(q.img) container.innerHTML += `<img class="question-img" src="${q.img}" onerror="this.style.display='none';">`;

        if (q.type === "single" || q.type === "multi") {
            const ul = document.createElement("ul"); ul.className = "options-list";
            q.options.forEach(opt => {
                const li = document.createElement("li"); li.className = "option-item"; const input = document.createElement("input");
                input.type = q.type === "single" ? "radio" : "checkbox"; input.name = "q_" + q.id;
                let isSelected = q.type === "single" ? (userAnswers[q.id] === opt.text) : (userAnswers[q.id] && userAnswers[q.id].includes(opt.text));
                if(isSelected) { input.checked = true; li.classList.add("selected"); }
                if(!isReviewMode) {
                    li.onclick = () => {
                        if(q.type === "single") {
                            ul.querySelectorAll(".option-item").forEach(item => item.classList.remove("selected"));
                            input.checked = true; li.classList.add("selected"); userAnswers[q.id] = opt.text;
                        } else {
                            input.checked = !input.checked;
                            if(input.checked) { li.classList.add("selected"); userAnswers[q.id].push(opt.text); }
                            else { li.classList.remove("selected"); userAnswers[q.id] = userAnswers[q.id].filter(x => x !== opt.text); }
                        }
                    };
                } else {
                    input.disabled = true;
                    let isCorrect = q.type === "single" ? (opt.text === q.correct || opt.key === q.correct) : q.correct.includes(opt.text);
                    if(isCorrect) li.classList.add("review-correct"); else if(isSelected && !isCorrect) li.classList.add("review-incorrect");
                }
                li.innerHTML = `<span><b>${opt.key}.</b> ${opt.text}</span>`; li.prepend(input); ul.appendChild(li);
            });
            container.appendChild(ul);
        } else if (q.type === "true_false") {
            const table = document.createElement("table"); table.className = "tf-table";
            table.innerHTML = `<thead><tr><th>Phát biểu</th><th>Đúng</th><th>Sai</th></tr></thead>`; const tbody = document.createElement("tbody");
            q.statements.forEach(st => {
                const tr = document.createElement("tr"); tr.innerHTML = `<td>${st.text}</td>`;
                ["Đúng", "Sai"].forEach(val => {
                    const td = document.createElement("td"); const rad = document.createElement("input"); rad.type = "radio"; rad.name = `tf_${q.id}_${st.id}`;
                    if(userAnswers[q.id] && userAnswers[q.id][st.id] === val) rad.checked = true;
                    if(!isReviewMode) { rad.onchange = () => { userAnswers[q.id][st.id] = val; }; } else {
                        rad.disabled = true; if(q.correct[st.id] === val) td.className = "text-correct";
                        else if(userAnswers[q.id][st.id] === val && userAnswers[q.id][st.id] !== q.correct[st.id]) td.className = "text-incorrect";
                    }
                    td.appendChild(rad); tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody); container.appendChild(table);
        } else if (q.type === "matching") {
            const matchContainer = document.createElement("div"); matchContainer.className = "matching-container";
            const colA = document.createElement("div"); colA.className = "column"; colA.id = "colA"; colA.innerHTML = `<h4>Cột A</h4>`;
            const colB = document.createElement("div"); colB.className = "column"; colB.id = "colB"; colB.innerHTML = `<h4>Cột B</h4>`;
            let allocated = Object.values(userAnswers[q.id]);
            q.pairs.forEach(p => {
                if(!allocated.includes(p.id)) {
                    const item = document.createElement("div"); item.className = "drag-item"; item.id = p.id; item.innerText = p.textA;
                    if(!isReviewMode) item.draggable = true; colA.appendChild(item);
                }
            });
            q.pairs.forEach(p => {
                const zone = document.createElement("div"); zone.className = "drop-zone"; zone.dataset.zoneid = p.zoneId; zone.innerHTML = `<div class="drop-zone-title">${p.textB}</div>`;
                let attachedId = userAnswers[q.id][p.zoneId];
                if(attachedId) {
                    let origin = q.pairs.find(x => x.id === attachedId); const item = document.createElement("div"); item.className = "drag-item"; item.id = origin.id; item.innerText = origin.textA;
                    if(isReviewMode) { if(p.id === attachedId) item.classList.add("review-correct"); else item.classList.add("review-incorrect"); }
                    zone.appendChild(item);
                }
                colB.appendChild(zone);
            });
            matchContainer.appendChild(colA); matchContainer.appendChild(colB); container.appendChild(matchContainer);
            if(!isReviewMode) {
                const dragItems = container.querySelectorAll('.drag-item'); const dropZones = container.querySelectorAll('.drop-zone'); let dragged = null;
                dragItems.forEach(i => { i.ondragstart = () => { dragged = i; }; i.ondragend = () => { dragged = null; }; });
                colA.ondragover = (e) => e.preventDefault();
                colA.ondrop = () => { if(dragged){ let prevZone = dragged.parentNode; if(prevZone.classList.contains('drop-zone')) delete userAnswers[q.id][prevZone.dataset.zoneid]; colA.appendChild(dragged); }};
                dropZones.forEach(z => { z.ondragover = (e) => e.preventDefault(); z.ondrop = () => { if(dragged && z.querySelectorAll('.drag-item').length === 0){ z.appendChild(dragged); userAnswers[q.id][z.dataset.zoneid] = dragged.id; }}; });
            }
        }
    }

    function resetCurrentQuestion() {
        if(isReviewMode) return;
        const q = currentQuizData[currentIndex];
        if(q.type === "single") userAnswers[q.id] = null;
        else if(q.type === "multi") userAnswers[q.id] = [];
        else if(q.type === "true_false" || q.type === "matching") userAnswers[q.id] = {};
        renderQuestion(currentIndex);
    }

    function changeQuestion(step) { let next = currentIndex + step; if(next >= 0 && next < currentQuizData.length) renderQuestion(next); }

    function openMenu() {
        const grid = document.getElementById("grid-container"); grid.innerHTML = "";
        currentQuizData.forEach((q, idx) => {
            const btn = document.createElement("button"); btn.className = "btn-grid-item";
            let answered = userAnswers[q.id] !== null && userAnswers[q.id] !== "" && Object.keys(userAnswers[q.id]).length !== 0;
            if(answered) btn.classList.add("answered"); if(idx === currentIndex) btn.classList.add("current");
            btn.innerText = idx + 1; btn.onclick = () => { renderQuestion(idx); closeMenu(); }; grid.appendChild(btn);
        });
        document.getElementById("menuModal").style.display = "flex";
    }
    function closeMenu() { document.getElementById("menuModal").style.display = "none"; }

    function submitQuiz() {
        clearInterval(timerInterval); let correctCount = 0;
        currentQuizData.forEach(q => {
            let uAns = userAnswers[q.id];
            if(q.type === "single") { if(uAns === q.correct || q.options.find(o=>o.text===uAns)?.key === q.correct) correctCount++; }
            else if(q.type === "multi") { if(uAns && uAns.length === q.correct.length && uAns.every(x => q.correct.includes(x))) correctCount++; }
            else if(q.type === "true_false") {
                let isAll = true; Object.keys(q.correct).forEach(k => { if(!uAns || uAns[k] !== q.correct[k]) isAll = false; }); if(isAll) correctCount++;
            } else if(q.type === "matching") {
                let isAll = true; q.pairs.forEach(p => { if(!uAns || uAns[p.zoneId] !== p.id) isAll = false; }); if(isAll) correctCount++;
            }
        });

        let finalScore = Math.round((correctCount / currentQuizData.length) * 1000);
        let coinBonus = 0;
        if (finalScore === 1000) coinBonus = 150;
        else if (finalScore >= 900) coinBonus = 75;
        else if (finalScore >= 800) coinBonus = 50;
        else if (finalScore >= 700) coinBonus = 25;

        updateTopbarUI("Đăng Xuất");
        document.getElementById("result-topic-name").innerText = selectedTopicName;
        document.getElementById("view-quiz").style.display = "none";
        document.getElementById("view-result").style.display = "block";
        document.getElementById("score-display").innerText = `${finalScore} Điểm`;
        document.getElementById("stats-display").innerText = `Đúng ${correctCount} / ${currentQuizData.length} câu.`;

        const bonusEl = document.getElementById("bonus-coin-display");
        if (coinBonus > 0) {
            bonusEl.innerText = `🎉 Thưởng mốc điểm: +${coinBonus} Coin!`;
            bonusEl.style.display = "block";
            fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'updateCoin', khoi: currentUser.khoi, lop: currentUser.lop, hoten: currentUser.hoten, coinBonus: coinBonus })
            })
            .then(res => res.json())
            .then(resData => {
                if(resData.success) {
                    currentUser.coin = resData.newCoin;
                    let m = currentRawStudents.find(s => s.lop === currentUser.lop && s.hoten === currentUser.hoten);
                    if(m) m.coin = resData.newCoin;
                }
            }).catch(err => console.error(err));
        } else bonusEl.style.display = "none";
    }

    function reviewQuiz() {
        isReviewMode = true; updateTopbarUI("Kết quả");
        document.getElementById("view-result").style.display = "none"; document.getElementById("view-quiz").style.display = "block";
        document.getElementById("txt-timer").innerText = "XEM LẠI"; document.getElementById("txt-timer").style.background = "#e74c3c"; 
        renderQuestion(0);
    }
    function reloadToTopics() { showTopicSelection(); }
    function logoutQuiz() { 
        currentUser = null; 
        document.getElementById('common-student-topbar').style.display = 'none';
        document.getElementById('view-topics').style.display = 'none';
        document.getElementById('view-myhome').style.display = 'none';
        document.getElementById('view-quiz').style.display = 'none';
        document.getElementById('view-result').style.display = 'none';
        document.getElementById('view-auth').style.display = 'block'; 
    }