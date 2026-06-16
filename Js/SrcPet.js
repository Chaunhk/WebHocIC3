const API_URL = ''; // add your Apps Script URL later
let currentRawStudents = [];
function renderBXH() { console.log('renderBXH called'); }
function showLoading(state) { console.log('Loading:', state); }
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
document.addEventListener('DOMContentLoaded', () => {
    updateMyHomeUI();
});
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



function handleFeedPet() {
    if ((currentUser.coin || 0) < 50) { alert("❌ Không đủ Coin! Bạn cần ít nhất 50 Coin."); return; }
    showLoading(true);
    //handlePetAPI; will update this later
    
    currentUser.coin -=50;
    currentUser.exp +=100;
    checkLevelEvent ();
    updateMyHomeUI();
}
function handlePetAPI(){
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
function checkLevelEvent (){
    if(currentUser.level*100<currentUser.exp){
        currentUser.exp-=currentUser.level*100;
        currentUser.level++;
        currentUser.power += currentUser.level*25;
        alert("🎉 Chúc mừng Pet đã lên cấp !!! 🎉");
    }
    else alert("🎉 Cho Pet ăn thành công! -50 Coin, +50 EXP.");
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
