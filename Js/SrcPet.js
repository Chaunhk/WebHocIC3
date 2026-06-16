//const API_URL = 'https://script.google.com/macros/s/AKfycbymSYuhfwsUn3dLbNGjRa9e3zHWiS5LFHC-LBB3MQKSWxF-8mleozE6S0FXQ9etXqhX-A/exec';

    let currentUser = null;    
    // ==for now import raw data ==  
    currentUser = {
        level: 1,
        exp: 100,
        power: 50,
        coin: 10000,
        petImg: "https://png.pngtree.com/recommend-works/png-clipart/20250730/ourmid/pngtree-cute-pixel-cat-character-png-image_16944762.webp"
    };
    //=============================
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