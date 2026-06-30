const API_URL = "";
// Game State
const gameState = {
  level: 5,
  exp: 250,
  maxExp: 500,
  power: 125,
  coin: 500,
  totalEarned: 2500,
  wins: 12,
  petName: "Dragon",
  evolution: 1,

  upgrades: {
    powerBoost: 0,
    foodQuality: 0,
  },

  ranking: 8,
  maxRanking: 15,
};
document.addEventListener("DOMContentLoaded", () => {
  btnStart = document.getElementById("btnStart");
  btnExit = document.getElementById("btnExit");
  btnExit.addEventListener("click", exitToHome);
  btnStart.addEventListener("click", startBattle);
  if (
    sessionStorage.getItem("auth") !== "true" ||
    !sessionStorage.getItem("quiz_userName") ||
    !sessionStorage.getItem("quiz_userClass")
  ) {
    exitToHome();
    return;
  }
});
function handlePetAPI() {
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "feedPet",
      khoi: currentUser.khoi,
      lop: currentUser.lop,
      hoten: currentUser.hoten,
    }),
  })
    .then((res) => res.json())
    .then((response) => {
      showLoading(false);
      if (response.success) {
        currentUser.coin = response.newCoin;
        currentUser.exp = response.newExp;
        let m = currentRawStudents.find(
          (s) => s.lop === currentUser.lop && s.hoten === currentUser.hoten,
        );
        if (m) {
          m.coin = response.newCoin;
          m.exp = response.newExp;
        }
        updateMyHomeUI();
        renderBXH();
        alert("🎉 Cho Pet ăn thành công! -50 Coin, +100 EXP.");
      } else alert("❌ Lỗi: " + response.error);
    })
    .catch((err) => {
      showLoading(false);
      alert("❌ Lỗi kết mạng: " + err.message);
    });
}
// Switch between tabs
function switchTab(tabName) {
  // Hide all views
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));

  // Show selected view
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");
}

// Update display
function updateDisplay() {
  document.getElementById("stat-level").textContent = gameState.level;
  document.getElementById("stat-exp").textContent =
    `${gameState.exp}/${gameState.maxExp}`;
  document.getElementById("stat-power").textContent = gameState.power + " 💪";
  document.getElementById("stat-wins").textContent = gameState.wins + " ⚔️";
  document.getElementById("coin-display").textContent = gameState.coin;
  document.getElementById("total-earned").textContent = gameState.totalEarned;
  document.getElementById("current-rank").textContent = "#" + gameState.ranking;

  // Update evolution badge
  const evolutionTexts = [
    "",
    "Stage 1: Starter",
    "Stage 2: Evolved",
    "Stage 3: Final",
  ];
  document.getElementById("evolution-badge").textContent =
    evolutionTexts[gameState.evolution] || "Stage " + gameState.evolution;

  // Update EXP bar
  const expPercent = (gameState.exp / gameState.maxExp) * 100;
  document.getElementById("exp-bar").style.width = expPercent + "%";
}

// Feed pet
function feedPet() {
  const feedCost = 50;
  const baseExp = 100;
  const expGain = baseExp + gameState.upgrades.foodQuality * 25;

  if (gameState.coin < feedCost) {
    showModal(
      "❌ Không đủ Coin",
      `Bạn cần ${feedCost} coins để cho pet ăn. Hiện tại chỉ có ${gameState.coin} coins.`,
    );
    return;
  }

  gameState.coin -= feedCost;
  gameState.exp += expGain;

  // Check level up
  if (gameState.exp >= gameState.maxExp) {
    gameState.exp = 0;
    gameState.level++;
    gameState.power += 25;
    checkEvolution();
    showModal(
      "🎉 Level Up!",
      `Chúc mừng! Pet của bạn đã lên level ${gameState.level}!\n+25 Power`,
    );
  } else {
    showModal(
      "✅ Cho Pet Ăn Thành Công",
      `Mất 50 coins, nhận ${expGain} EXP!\n${gameState.exp}/${gameState.maxExp}`,
    );
  }

  updateDisplay();
}

// Buy upgrade
function buyUpgrade(type, cost) {
  if (gameState.coin < cost) {
    showModal(
      "❌ Không đủ Coin",
      `Bạn cần ${cost} coins. Hiện tại chỉ có ${gameState.coin} coins.`,
    );
    return;
  }

  gameState.coin -= cost;
  gameState.totalEarned += cost;

  if (type === "power") {
    gameState.upgrades.powerBoost++;
    gameState.power += 10 + gameState.upgrades.powerBoost * 5;
    showModal(
      "💪 Power Boost!",
      `Mua thành công!\n+${10 + gameState.upgrades.powerBoost * 5} Power\nLevel: ${gameState.upgrades.powerBoost}`,
    );
  } else if (type === "food") {
    gameState.upgrades.foodQuality++;
    showModal(
      "🍗 Food Upgrade!",
      `Mua thành công!\n+25 EXP per feed\nLevel: ${gameState.upgrades.foodQuality}`,
    );
  }

  updateDisplay();
}

// Check evolution
function checkEvolution() {
  const evolutionLevels = [0, 1, 6, 11, 21];
  for (let i = evolutionLevels.length - 1; i >= 0; i--) {
    if (gameState.level >= evolutionLevels[i]) {
      gameState.evolution = i;
      break;
    }
  }
}

// Start battle with animations
function startBattle() {
  // Generate random opponent
  const opponents = [
    { name: "Nguyễn Văn A", power: 180, level: 8 },
    { name: "Trần Thị B", power: 165, level: 7 },
    { name: "Lê Minh C", power: 155, level: 7 },
    { name: "Phạm Văn D", power: 142, level: 6 },
    { name: "Vũ Thị E", power: 135, level: 6 },
    { name: "Hoàng Văn F", power: 120, level: 5 },
    { name: "Đặng Thị G", power: 110, level: 4 },
  ];

  const opponent = opponents[Math.floor(Math.random() * opponents.length)];

  // Show battle
  document.getElementById("battle-result").style.display = "block";
  document.getElementById("result-box").style.display = "none";
  document.getElementById("enemy-pet").src =
    "https://png.pngtree.com/recommend-works/png-clipart/20250730/ourmid/pngtree-cute-pixel-cat-character-png-image_16944762.webp";
  document.getElementById("enemy-name").textContent = opponent.name;
  document.getElementById("enemy-power").textContent = opponent.power;
  document.getElementById("my-power").textContent = gameState.power;

  // Update power bars
  const myPowerPercent = (gameState.power / 200) * 100;
  const enemyPowerPercent = (opponent.power / 200) * 100;
  document.getElementById("my-power-bar").style.width = myPowerPercent + "%";
  document.getElementById("enemy-power-bar").style.width =
    enemyPowerPercent + "%";
  btnStart.disabled = 1;
  // Start combat sequence
  simulateBattle(gameState.power, opponent.power, opponent.name);
}

// Simulate battle with animations
function simulateBattle(myPower, enemyPower, enemyName) {
  const myPet = document.getElementById("my-pet-img");
  const enemyPet = document.getElementById("enemy-pet");

  if (!myPet || !enemyPet) {
    console.error("Pet elements not found!");
    return;
  }

  let round = 0;
  const maxRounds = 3;

  function animateRound() {
    if (round >= maxRounds) {
      // Battle complete
      setTimeout(showBattleResult, 500);
      return;
    }

    round++;

    if (myPower > enemyPower) {
      // Player attacks first
      animateAttack(myPet, enemyPet, true, () => {
        setTimeout(() => animateCounterAttack(), 300);
      });
    } else if (enemyPower > myPower) {
      // Enemy attacks first
      animateAttack(enemyPet, myPet, false, () => {
        setTimeout(() => animateCounterAttack(), 300);
      });
    } else {
      // Tie - both attack
      animateAttack(myPet, enemyPet, true);
      animateAttack(enemyPet, myPet, false);
    }

    function animateCounterAttack() {
      if (myPower > enemyPower) {
        animateAttack(enemyPet, myPet, false, () => {
          setTimeout(animateRound, 400);
        });
      } else if (enemyPower > myPower) {
        animateAttack(myPet, enemyPet, true, () => {
          setTimeout(animateRound, 400);
        });
      } else {
        setTimeout(animateRound, 400);
      }
    }
  }

  animateRound();
  btnStart.disabled = 0;
}

// Animate attack with enhanced visibility
function animateAttack(attacker, defender, isPlayer, callback) {
  // Add glow effect during attack
  attacker.style.filter = "drop-shadow(0 0 10px rgba(102, 126, 234, 0.8))";
  attacker.style.transition = "filter 0.1s ease-out";

  // Attack animation
  attacker.classList.add("battle-pet-attacking");
  if (!isPlayer) {
    attacker.classList.add("attacking-enemy");
  }

  setTimeout(() => {
    // Hit animation
    defender.classList.add("battle-pet-hit", "battle-shake");
    defender.style.filter = "drop-shadow(0 0 15px rgba(255, 100, 100, 1))";

    // Create damage number
    const damage = Math.floor(Math.random() * 20 + 10);
    showDamageNumber(defender, damage, isPlayer);

    // Remove attack glow
    attacker.style.filter = "none";

    // Remove animations
    attacker.classList.remove("battle-pet-attacking", "attacking-enemy");

    setTimeout(() => {
      defender.classList.remove("battle-pet-hit", "battle-shake");
      defender.style.filter = "none";
      if (callback) callback();
    }, 400);
  }, 300);
}

// Show floating damage number
function showDamageNumber(element, damage, isPlayer) {
  const damageEl = document.createElement("div");
  damageEl.className =
    "damage-number " + (damage > 15 ? "damage-critical" : "damage-normal");
  damageEl.textContent = damage;

  const rect = element.getBoundingClientRect();
  damageEl.style.left = rect.left + rect.width / 2 - 14 + "px";
  damageEl.style.top = rect.top - 20 + "px";

  document.body.appendChild(damageEl);

  setTimeout(() => damageEl.remove(), 1000);
}

// Show battle result
function showBattleResult() {
  const myPet = document.getElementById("my-pet-img");
  const enemyPet = document.getElementById("enemy-pet");
  const resultBox = document.getElementById("result-box");

  const result =
    gameState.power >
    parseInt(document.getElementById("enemy-power").textContent)
      ? "win"
      : gameState.power ===
          parseInt(document.getElementById("enemy-power").textContent)
        ? "tie"
        : "loss";

  resultBox.style.display = "block";

  if (result === "win") {
    gameState.wins++;
    gameState.ranking = Math.max(1, gameState.ranking - 1);

    myPet.classList.add("victory-jump");
    myPet.parentElement.classList.add("winning-aura");

    document.getElementById("result-title").textContent = "🏆 VICTORY!";
    document.getElementById("result-title").className =
      "result-title result-win";
    document.getElementById("result-text").textContent =
      `Your pet's power (${gameState.power}) overwhelmed your opponent!\n+1 Win! Ranking improved!`;
  } else if (result === "tie") {
    document.getElementById("result-title").textContent = "🤝 TIE!";
    document.getElementById("result-title").className =
      "result-title result-tie";
    document.getElementById("result-text").textContent =
      "Both pets are equally strong! Upgrade to gain advantage.";
  } else {
    gameState.ranking = Math.min(gameState.maxRanking, gameState.ranking + 1);

    enemyPet.classList.add("victory-jump");
    enemyPet.parentElement.classList.add("winning-aura");
    myPet.parentElement.classList.add("losing-aura");

    document.getElementById("result-title").textContent = "😢 DEFEAT";
    document.getElementById("result-title").className =
      "result-title result-loss";
    document.getElementById("result-text").textContent =
      `Opponent's power (${document.getElementById("enemy-power").textContent}) was too strong.\nUpgrade your pet and try again!`;
  }

  updateDisplay();
}

// Show modal
function showModal(title, message) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").textContent = message;
  document.getElementById("modal").classList.add("active");
}

// Close modal
function closeModal() {
  document.getElementById("modal").classList.remove("active");
}

// Initialize
updateDisplay();
checkEvolution();
function exitToHome() {
  window.location.href = "index.html";
}
