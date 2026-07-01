const gameState = {
  level: 5,
  exp: 250,
  maxExp: 500,
  power: 125,
  coin: 500,
  rankPoints: 100,
  wins: 12,
  petName: "Dragon",
  evolution: 1,
  petID: "default",

  upgrades: {
    powerBoost: 0,
    foodQuality: 0,
  },

  ranking: 8,
  maxRanking: 15,
};

// Apps Script API Config
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw4067fDBC01B884cWXg5gyXOHbrRR9N6qabaV1G_JpvWdB5nsoynRXcpRg15I6PZWKJA/exec";

// Load pet data from sheet on page load
document.addEventListener("DOMContentLoaded", () => {
  loadPetDataFromSheet();
});

// Load pet data from Google Sheets via Apps Script
async function loadPetDataFromSheet() {
  try {
    const userName = sessionStorage.getItem("quiz_userName");
    const userClass = sessionStorage.getItem("quiz_userClass");
    const userSchool = sessionStorage.getItem("quiz_userSchool");

    if (!userName || !userClass || !userSchool) {
      console.log("Session not found, using defaults");
      return;
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "getPetData",
        hoten: userName,
        lop: userClass,
        truong: userSchool,
      }),
    });

    const data = await response.json();
    console.log("Pet data response:", data);

    if (data.success) {
      gameState.level = data.data.level || gameState.level;
      gameState.exp = data.data.exp || gameState.exp;
      gameState.power = data.data.power || gameState.power;
      gameState.coin = data.data.coin || gameState.coin;
      gameState.rankPoints = data.data.rank || gameState.rank;
      gameState.evolution = data.data.evolution || gameState.evolution;
      gameState.petID = data.data.petID || gameState.petID;

      console.log("✓ Pet data loaded from sheet:", data.data);
    } else {
      console.log("Failed to load pet data:", data.error);
    }

    updateDisplay();
  } catch (error) {
    console.error("Error loading pet data:", error);
    updateDisplay();
  }
}

// Save pet data to Google Sheets
async function savePetDataToSheet() {
  try {
    const userName = sessionStorage.getItem("quiz_userName");
    const userClass = sessionStorage.getItem("quiz_userClass");
    const userSchool = sessionStorage.getItem("quiz_userSchool");

    if (!userName || !userClass || !userSchool) {
      console.log("Session not found, skipping save");
      return;
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        action: "savePetData",
        hoten: userName,
        lop: userClass,
        truong: userSchool,
        petData: {
          coin: gameState.coin,
          level: gameState.level,
          exp: gameState.exp,
          petID: gameState.petID,
          power: gameState.power,
          rank: gameState.rank,
          evolution: gameState.evolution,
        },
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✓ Pet data saved to sheet");
    } else {
      console.log("Failed to save pet data:", data.error);
    }
  } catch (error) {
    console.error("Error saving pet data:", error);
  }
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

  // Reset battle state if going to home
  if (tabName === "home") {
    resetBattleState();
  }
}

// Reset battle state
function resetBattleState() {
  const myPet = document.getElementById("my-pet-battle");
  const myPetPre = document.getElementById("my-pet-img");
  const enemyPet = document.getElementById("enemy-pet");
  const battleBtn = document.getElementById("battle-btn");
  const battleResult = document.getElementById("battle-result");
  const preBattleDisplay = document.getElementById("pre-battle-display");
  const introOverlay = document.getElementById("battle-intro-overlay");

  // Reset button
  battleBtn.disabled = false;
  battleBtn.style.opacity = "1";
  battleBtn.style.cursor = "pointer";

  // Close intro overlay
  introOverlay.classList.remove("active");

  // Show pre-battle display, hide battle result
  preBattleDisplay.style.display = "grid";
  battleResult.style.display = "none";

  // Remove all animation classes
  if (myPet) {
    myPet.classList.remove("battle-pet-hit", "battle-shake", "victory-jump");
  }
  enemyPet.classList.remove("battle-pet-hit", "battle-shake", "victory-jump");

  // Remove glow effects
  if (myPet && myPet.parentElement) {
    myPet.parentElement.classList.remove("winning-aura", "losing-aura");
  }
  if (enemyPet.parentElement) {
    enemyPet.parentElement.classList.remove("winning-aura", "losing-aura");
  }

  // Reset inline styles
  if (myPet) {
    myPet.style.filter = "none";
    myPet.style.transition = "none";
  }
  enemyPet.style.filter = "none";
  enemyPet.style.transition = "none";

  // Reset pet image to player's pet
  if (myPetPre) {
    myPetPre.src =
      gameState.petImg && gameState.petImg !== ""
        ? gameState.petImg
        : "https://png.pngtree.com/recommend-works/png-clipart/20250730/ourmid/pngtree-cute-pixel-cat-character-png-image_16944762.webp";
  }

  // Update pre-battle power display
  //const myPowerPercent = (gameState.power / 200) * 100;
  //document.getElementById('my-power-pre').textContent = gameState.power;
  //document.getElementById('my-power-bar-pre').style.width = myPowerPercent + '%';
}

// Update display
function updateDisplay() {
  document.getElementById("stat-level").textContent = gameState.level;
  document.getElementById("stat-exp").textContent =
    `${gameState.exp}/${gameState.maxExp}`;
  document.getElementById("stat-power").textContent = gameState.power + " 💪";
  document.getElementById("stat-wins").textContent = gameState.wins + " ⚔️";
  document.getElementById("coin-display").textContent = gameState.coin;
  document.getElementById("rank-points-display").textContent =
    gameState.rankPoints;
  document.getElementById("current-rank").textContent = "#" + gameState.ranking;
  document.getElementById("my-power-pre").textContent = gameState.power;
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
  savePetDataToSheet();
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
  savePetDataToSheet();
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

// Random pet images
const petImages = [
  "https://cdn-icons-png.flaticon.com/512/1998/1998920.png", // Dragon
  "https://cdn-icons-png.flaticon.com/512/1995/1995587.png", // Phoenix
  "https://cdn-icons-png.flaticon.com/512/1998/1998906.png", // Tiger
  "https://cdn-icons-png.flaticon.com/512/1995/1995433.png", // Eagle
  "https://cdn-icons-png.flaticon.com/512/1998/1998935.png", // Wolf
  "https://cdn-icons-png.flaticon.com/512/1995/1995489.png", // Lion
  "https://cdn-icons-png.flaticon.com/512/1998/1998899.png", // Bear
  "https://cdn-icons-png.flaticon.com/512/1995/1995540.png", // Snake
];

let currentBattle = null;

// Start battle with animations
function startBattle() {
  const battleBtn = document.getElementById("battle-btn");
  battleBtn.disabled = true;
  battleBtn.style.opacity = "0.5";
  battleBtn.style.cursor = "not-allowed";

  // Hide pre-battle display
  document.getElementById("pre-battle-display").style.display = "none";

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
  const enemyRandomPet =
    petImages[Math.floor(Math.random() * petImages.length)];

  // Store battle info
  currentBattle = {
    myPower: gameState.power,
    enemyPower: opponent.power,
    enemyName: opponent.name,
    enemyPet: enemyRandomPet,
  };

  // Show intro screen
  document.getElementById("intro-my-pet").src =
    gameState.petImg && gameState.petImg !== ""
      ? gameState.petImg
      : "https://png.pngtree.com/recommend-works/png-clipart/20250730/ourmid/pngtree-cute-pixel-cat-character-png-image_16944762.webp";
  document.getElementById("intro-enemy-pet").src = enemyRandomPet;
  document.getElementById("intro-my-power").textContent = gameState.power;
  document.getElementById("intro-my-level").textContent = gameState.level;
  document.getElementById("intro-enemy-name").textContent = opponent.name;
  document.getElementById("intro-enemy-power").textContent = opponent.power;
  document.getElementById("intro-enemy-level").textContent = opponent.level;

  document.getElementById("battle-intro-overlay").classList.add("active");
}

// Proceed to actual battle from intro
function proceedToBattle() {
  document.getElementById("battle-intro-overlay").classList.remove("active");
  document.getElementById("battle-result").style.display = "block";

  // Set battle pets
  document.getElementById("enemy-pet").src = currentBattle.enemyPet;
  document.getElementById("enemy-name").textContent = currentBattle.enemyName;
  document.getElementById("enemy-power").textContent = currentBattle.enemyPower;
  document.getElementById("my-power").textContent = currentBattle.myPower;

  // Update power bars
  //const myPowerPercent = (currentBattle.myPower / 200) * 100;
  //const enemyPowerPercent = (currentBattle.enemyPower / 200) * 100;
  //document.getElementById('my-power-bar').style.width = myPowerPercent + '%';
  //document.getElementById('enemy-power-bar').style.width = enemyPowerPercent + '%';

  // Start combat sequence
  simulateBattle(
    currentBattle.myPower,
    currentBattle.enemyPower,
    currentBattle.enemyName,
  );
}

// Flee from battle
function fleeBattle() {
  const fleeCost = 50;
  const rankPenalty = 10;

  if (gameState.coin < fleeCost) {
    showModal(
      "❌ Not Enough Coins",
      `You need ${fleeCost} coins to flee. You only have ${gameState.coin}.`,
    );
    return;
  }

  // Deduct coins
  gameState.coin -= fleeCost;

  // Deduct rank points
  gameState.rankPoints = Math.max(0, gameState.rankPoints - rankPenalty);

  // Deduct rank (increase ranking number = go down)
  gameState.ranking = Math.min(
    gameState.maxRanking,
    gameState.ranking + rankPenalty,
  );

  // Show flee message
  showModal(
    "🏃 Fled Battle!",
    `You ran away!\n-${fleeCost} Coins\n-${rankPenalty} Rank Points`,
  );

  // Close intro overlay
  document.getElementById("battle-intro-overlay").classList.remove("active");

  // Reset battle state
  resetBattleState();

  // Update display
  updateDisplay();

  // Re-enable battle button
  const battleBtn = document.getElementById("battle-btn");
  battleBtn.disabled = false;
  battleBtn.style.opacity = "1";
  battleBtn.style.cursor = "pointer";
}

// Simulate battle with animations
function simulateBattle(myPower, enemyPower, enemyName) {
  const myPet = document.getElementById("my-pet-battle");
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
  const myPet = document.getElementById("my-pet-battle");
  const enemyPet = document.getElementById("enemy-pet");
  const resultBox = document.getElementById("result-box");
  const battleBtn = document.getElementById("battle-btn");

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

  // Re-enable button
  setTimeout(() => {
    battleBtn.disabled = false;
    battleBtn.style.opacity = "1";
    battleBtn.style.cursor = "pointer";
  }, 1500);

  updateDisplay();
  savePetDataToSheet();
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

// Initialize (happens in loadPetDataFromSheet after DOMContentLoaded)
checkEvolution();
