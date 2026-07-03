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
const upgradeContext = {
  power: [
    { cost: 30, value: 5 },
    { cost: 75, value: 15 },
    { cost: 150, value: 30 },
    { cost: 250, value: 50 },
    { cost: 500, value: 100 },
  ],
  food: [
    { cost: 30, value: 2 },
    { cost: 75, value: 3 },
    { cost: 150, value: 4 },
    { cost: 250, value: 5 },
    { cost: 500, value: 6 },
  ],
};
// Pet images
const petImages = [
  {
    petId: "Ex_Al",
    petSrc: "Image/PetEX/Al.gif",
    petName: "Alpha",
    cost: 100000,
  },
  {
    petId: "Ex_Be",
    petSrc: "Image/PetEX/Be.gif",
    petName: "Beta",
    cost: 100000,
  },
  {
    petId: "default",
    petSrc:
      "https://png.pngtree.com/recommend-works/png-clipart/20250730/ourmid/pngtree-cute-pixel-cat-character-png-image_16944762.webp",
    petName: "Pussy Cat",
    cost: 10,
  },
  {
    petId: "Dragon",
    petSrc: "Image/Pet/Dragon.gif",
    petName: "Dragon",
    cost: 100,
  }, // Dragon
  {
    petId: "Phoenix",
    petSrc: "Image/Pet/Phoenix.gif",
    petName: "Phoenix",
    cost: 100,
  }, // Phoenix
  {
    petId: "Tiger",
    petSrc: "Image/Pet/Tiger.gif",
    petName: "Tiger",
    cost: 500,
  }, // Tiger
  // {
  //   petId: "Eagle",
  //   petSrc: "/Image/Pet/Eagle.gif",
  //   petName: "Eagle",
  //   cost: 1000,
  // }, // Eagle
  // {
  //   petId: "Wolf",
  //   petSrc: "/Image/Pet/Wolf.gif",
  //   petName: "Wolf",
  //   cost: 1500,
  // }, // Wolf
  // {
  //   petId: "Lion",
  //   petSrc: "/Image/Pet/Lion.gif",
  //   petName: "Lion",
  //   cost: 1800,
  // }, // Lion
  // {
  //   petId: "Bear",
  //   petSrc: "/Image/Pet/Bear.gif",
  //   petName: "Bear",
  //   cost: 2000,
  // }, // Bear
  // {
  //   petId: "Snake",
  //   petSrc: "/Image/Pet/Snake.gif",
  //   petName: "Snake",
  //   cost: 2500,
  // }, // Snake
];
// Apps Script API Config
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw4067fDBC01B884cWXg5gyXOHbrRR9N6qabaV1G_JpvWdB5nsoynRXcpRg15I6PZWKJA/exec";

// Load pet data from sheet on page load
document.addEventListener("DOMContentLoaded", () => {
  if (
    sessionStorage.getItem("auth") !== "true" ||
    !sessionStorage.getItem("quiz_userName") ||
    !sessionStorage.getItem("quiz_userClass")
  ) {
    exitToHome();
    return;
  }
  generateUpgradeCards();
  loadPetDataFromSheet();
});
function generateUpgradeCards() {
  const container = document.getElementById("upgrade-cards-container");
  if (!container) return;

  container.innerHTML = "";

  const upgrades = [
    {
      type: "power",
      title: "💪 Power Boost",
      desc: "Increase battle power to win more fights and climb the leaderboard",
      data: upgradeContext.power,
    },
    {
      type: "food",
      title: "🍗 Food Quality",
      desc: "Better food = more EXP per feeding. Level up faster!",
      data: upgradeContext.food,
    },
  ];

  upgrades.forEach((upgrade) => {
    const card = document.createElement("div");
    card.className = `card upgrade-card ${upgrade.type}`;

    let levelsHTML = upgrade.data
      .map((level, idx) => {
        const levelNum = idx + 1;
        const isMax = levelNum === upgrade.data.length;
        return `
        <div class="level-item">
          <span class="level-info">Level ${levelNum}${isMax ? " (Max)" : ""}</span>
          <span class="level-cost">${level.cost} 💰</span>
        </div>
      `;
      })
      .join("");

    const firstCost = upgrade.data[0].cost;
    let currentLevel = 0;
    if (upgrade.type === "food") {
      currentLevel = gameState.upgrades.foodQuality;
      console.log("Current food level:", gameState.upgrades.foodQuality);
    }
    if (upgrade.type === "power") {
      currentLevel = gameState.upgrades.powerBoost;
      console.log("Current power level:", gameState.upgrades.powerBoost);
    }
    card.innerHTML = `
      <div class="upgrade-title">${upgrade.title}</div>
      <div class="upgrade-description">${upgrade.desc}</div>
      <div class="upgrade-levels">${levelsHTML}</div>
      <button class="upgrade-btn" id="upgrade-btn-${upgrade.type}" onclick="buyUpgrade('${upgrade.type}', ${firstCost})">
        Buy Level ${currentLevel + 1} 
      </button>
    `;

    container.appendChild(card);
  });

  // Add cosmetics card
  const cosmeticCard = document.createElement("div");
  cosmeticCard.className = "card upgrade-card cosmetic";

  let cosmeticHTML = petImages
    .slice(2)
    .map((pet) => {
      return `
    <div class="level-item">
      <span class="level-info">${pet.petName}</span>
      <span class="level-cost">${pet.cost} 💰</span>
    </div>
  `;
    })
    .join("");

  cosmeticCard.innerHTML = `
    <div class="upgrade-title">🎨 Pet Cosmetics</div>
    <div class="upgrade-description">
      Unlock different pet skins!
    </div>
    <div class="upgrade-levels">${cosmeticHTML}</div>
    <button class="upgrade-btn" onclick="buyCosmeticPet()">
      View Cosmetics
    </button>
  `;

  container.appendChild(cosmeticCard);
}
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
  //document.getElementById("my-level-pre").textContent = gameState.level;
  gameState.petName =
    petImages.find((p) => p.petId === gameState.petID)?.petName || "Pussy Cat";
  document.getElementById("pet-name").textContent = gameState.petName;
  gameState.petImg =
    petImages.find((p) => p.petId === gameState.petID)?.petSrc ||
    "https://png.pngtree.com/recommend-works/png-clipart/20250730/ourmid/pngtree-cute-pixel-cat-character-png-image_16944762.webp";
  const petImgFallback = gameState.petImg;

  if (gameState.evolution > 1) {
    const evolvedImg = `Image/Pet/${gameState.petID}${gameState.evolution}.gif`;

    const testImg = new Image();

    testImg.onload = () => {
      // The evolved image exists
      gameState.petImg = evolvedImg;
      updatePetImages();
    };

    testImg.onerror = () => {
      // The evolved image doesn't exist
      gameState.petImg = petImgFallback;
      updatePetImages();
    };

    testImg.src = evolvedImg;
  } else {
    updatePetImages();
  }
  function updatePetImages() {
    document.getElementById("my-pet-img").src = gameState.petImg;
    document.getElementById("my-pet-battle").src = gameState.petImg;
    document.getElementById("pet-sprite").src = gameState.petImg;
  }
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

  const index = gameState.upgrades.foodQuality - 1;
  const bonusExp = index >= 0 ? upgradeContext.food[index].value * 25 : 0;

  const expGain = baseExp + bonusExp;

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
  //gameState.totalEarned += cost;
  //console.log(upgradeContext.power.length, gameState.upgrades.powerBoost);
  if (type === "power") {
    if (gameState.upgrades.powerBoost < upgradeContext.power.length) {
      cost = upgradeContext.power[gameState.upgrades.powerBoost].cost;
      if (gameState.coin < cost) {
        showModal(
          "❌ Không đủ Coin",
          `Bạn cần ${cost} coins. Hiện tại chỉ có ${gameState.coin} coins.`,
        );
        return;
      }
      gameState.coin -= cost;
      powerGain = upgradeContext.power[gameState.upgrades.powerBoost].value;
      gameState.power += powerGain;
      gameState.upgrades.powerBoost++;
      if (gameState.upgrades.powerBoost < upgradeContext.power.length)
        document.getElementById(`upgrade-btn-power`).textContent =
          `Buy Level ${gameState.upgrades.powerBoost + 1}`;
      else {
        let btn = document.getElementById(`upgrade-btn-power`);
        btn.textContent = `Max Level Reached`;
        btn.disabled = true;
      }
      showModal(
        "💪 Power Boost!",
        `Mua thành công!\n+${powerGain} Power\nLevel: ${gameState.upgrades.powerBoost}`,
      );
    } else showModal("Nâng cấp đã đến giới hạn");
  } else if (type === "food") {
    if (gameState.upgrades.foodQuality < upgradeContext.food.length) {
      cost = upgradeContext.food[gameState.upgrades.foodQuality].cost;
      if (gameState.coin < cost) {
        showModal(
          "❌ Không đủ Coin",
          `Bạn cần ${cost} coins. Hiện tại chỉ có ${gameState.coin} coins.`,
        );
        return;
      }
      gameState.coin -= cost;
      foodMod = upgradeContext.food[gameState.upgrades.foodQuality].value;
      gameState.upgrades.foodQuality++;
      if (gameState.upgrades.foodQuality < upgradeContext.food.length)
        document.getElementById(`upgrade-btn-food`).textContent =
          `Buy Level ${gameState.upgrades.foodQuality + 1}`;
      else {
        let btn = document.getElementById(`upgrade-btn-food`);
        btn.textContent = `Max Level Reached`;
        btn.disabled = true;
      }
      showModal(
        "🍗 Food Upgrade!",
        `Mua thành công!\nx${foodMod} EXP per feed\nLevel: ${gameState.upgrades.foodQuality}`,
      );
    } else showModal("Nâng cấp đã đến giới hạn");
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

  //console.log("Pet evolution stage:", gameState.petImg);
  //gameState.petImg = gameState.petImg + gameState.evolution; // Update pet image based on evolution stage
}

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
    petImages[Math.floor(Math.random() * petImages.length)].petSrc; // Exclude default and Dragon for opponents

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
  console.log(
    document.querySelector("#battle-result .battle-arena").children.length,
  );

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
  console.log(
    document.querySelector("#battle-result .battle-arena").children.length,
  );
}
// Random Attack Effects System

function getRandomAttackEffect() {
  const effects = ["lightning", "fireball", "slash", "aura"];
  return effects[Math.floor(Math.random() * effects.length)];
}

function animateAttack(attacker, defender, isPlayer, callback) {
  const effect = getRandomAttackEffect();

  if (effect === "lightning") {
    animateLightning(attacker, defender, callback);
  } else if (effect === "fireball") {
    animateFireball(attacker, defender, callback);
  } else if (effect === "slash") {
    animateSlash(attacker, defender, callback);
  } else if (effect === "aura") {
    animateAura(attacker, defender, callback);
  }
}

// ===== LIGHTNING EFFECT =====
function animateLightning(attacker, defender, callback) {
  const attackerParent = attacker.parentElement; // Get .fighter container
  const defenderParent = defender.parentElement;
  const startX = attacker.offsetLeft + attacker.offsetWidth / 2;
  const startY = attacker.offsetTop + attacker.offsetHeight / 2;
  const endX = defender.offsetLeft + defender.offsetWidth / 2;
  const endY = defender.offsetTop + defender.offsetHeight / 2;

  // Create jagged lightning bolt
  const lightning = document.createElement("div");
  lightning.className = "lightning-bolt";
  lightning.style.left = startX + "px";
  lightning.style.top = startY + "px";
  lightning.style.width = Math.abs(endX - startX) + "px";
  lightning.style.height = "8px";
  lightning.style.transform = `rotate(${(Math.atan2(endY - startY, endX - startX) * 180) / Math.PI}deg)`;
  lightning.style.transformOrigin = "0 50%";
  document.querySelector("#battle-result .battle-arena").appendChild(lightning);

  setTimeout(() => {
    defender.classList.add("electric-flash", "battle-shake");

    // Crackle particles
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      particle.className = "electric-particle";
      particle.style.left = endX + "px";
      particle.style.top = endY + "px";

      const angle = (i / 12) * Math.PI * 2;
      const distance = 60 + Math.random() * 40;
      particle.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      particle.style.setProperty("--ty", Math.sin(angle) * distance + "px");

      document
        .querySelector("#battle-result .battle-arena")
        .appendChild(particle);
      setTimeout(() => particle.remove(), 800);
    }

    //const damage = Math.floor(Math.random() * 20 + 10);
    //showDamageNumber(defender, damage, isPlayer);

    setTimeout(() => {
      defender.classList.remove("electric-flash", "battle-shake");
      lightning.remove();
      if (callback) callback();
    }, 400);
  }, 300);
  console.log("Lightning effect created:", lightning);
  console.log("Battle arena:", document.querySelector(".battle-arena"));
  console.log("Start:", startX, startY, "End:", endX, endY);
}

// ===== FIREBALL EFFECT =====
function animateFireball(attacker, defender, callback) {
  const attackerParent = attacker.parentElement; // Get .fighter container
  const defenderParent = defender.parentElement;
  const startX = attacker.offsetLeft + attacker.offsetWidth / 2;
  const startY = attacker.offsetTop + attacker.offsetHeight / 2;
  const endX = defender.offsetLeft + defender.offsetWidth / 2;
  const endY = defender.offsetTop + defender.offsetHeight / 2;

  // Create fireball
  const fireball = document.createElement("div");
  fireball.className = "fireball";
  fireball.style.left = startX + "px";
  fireball.style.top = startY + "px";
  fireball.style.width = "20px";
  fireball.style.height = "20px";
  fireball.style.background = "radial-gradient(circle, #ff6b35, #ff3c00)";
  fireball.style.borderRadius = "50%";
  fireball.style.boxShadow = "0 0 20px #ff6b35";
  fireball.style.position = "absolute";
  fireball.style.animation = `fireballFly 0.6s ease-out forwards`;
  fireball.style.setProperty("--endX", endX - startX + "px");
  fireball.style.setProperty("--endY", endY - startY + "px");
  document.querySelector("#battle-result .battle-arena").appendChild(fireball);

  setTimeout(() => {
    defender.classList.add("fire-flash", "battle-shake");

    // Explosion particles
    for (let i = 0; i < 16; i++) {
      const particle = document.createElement("div");
      particle.className = "fire-particle";
      particle.style.left = endX + "px";
      particle.style.top = endY + "px";
      particle.style.width = "8px";
      particle.style.height = "8px";
      particle.style.background = ["#ff6b35", "#ff3c00", "#ffb627"][
        Math.floor(Math.random() * 3)
      ];
      particle.style.borderRadius = "50%";
      particle.style.position = "absolute";
      particle.style.animation = `fireParticle 0.8s ease-out forwards`;

      const angle = (i / 16) * Math.PI * 2;
      const distance = 70 + Math.random() * 50;
      particle.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      particle.style.setProperty("--ty", Math.sin(angle) * distance + "px");

      document.querySelector(".battle-arena").appendChild(particle);
      setTimeout(() => particle.remove(), 800);
    }

    //const damage = Math.floor(Math.random() * 20 + 10);
    //showDamageNumber(defender, damage, isPlayer);

    setTimeout(() => {
      defender.classList.remove("fire-flash", "battle-shake");
      fireball.remove();
      if (callback) callback();
    }, 400);
  }, 300);
}

// ===== SLASH EFFECT =====
function animateSlash(attacker, defender, callback) {
  const attackerParent = attacker.parentElement; // Get .fighter container
  const defenderParent = defender.parentElement;
  const startX = attacker.offsetLeft + attacker.offsetWidth / 2;
  const startY = attacker.offsetTop + attacker.offsetHeight / 2;
  const endX = defender.offsetLeft + defender.offsetWidth / 2;
  const endY = defender.offsetTop + defender.offsetHeight / 2;

  // Create slash line
  const slash = document.createElement("div");
  slash.className = "slash-effect";
  slash.style.left = startX + "px";
  slash.style.top = startY + "px";
  slash.style.width = Math.abs(endX - startX) + "px";
  slash.style.height = "6px";
  slash.style.background =
    "linear-gradient(90deg, transparent, #fbbf24, transparent)";
  slash.style.position = "absolute";
  slash.style.boxShadow = "0 0 15px #fbbf24";
  slash.style.transform = `rotate(${(Math.atan2(endY - startY, endX - startX) * 180) / Math.PI}deg)`;
  slash.style.transformOrigin = "0 50%";
  slash.style.animation = "slashFade 0.5s ease-out forwards";
  document.querySelector(".battle-arena").appendChild(slash);

  setTimeout(() => {
    defender.classList.add("spark-flash", "battle-shake");

    // Spark particles
    for (let i = 0; i < 10; i++) {
      const spark = document.createElement("div");
      spark.className = "spark-particle";
      spark.style.left = endX + "px";
      spark.style.top = endY + "px";
      spark.style.width = "4px";
      spark.style.height = "4px";
      spark.style.background = "#fbbf24";
      spark.style.position = "absolute";
      spark.style.animation = `sparkFly 0.6s ease-out forwards`;

      const angle = (i / 10) * Math.PI * 2;
      const distance = 50 + Math.random() * 30;
      spark.style.setProperty("--tx", Math.cos(angle) * distance + "px");
      spark.style.setProperty("--ty", Math.sin(angle) * distance + "px");

      document.querySelector(".battle-arena").appendChild(spark);
      setTimeout(() => spark.remove(), 600);
    }

    //const damage = Math.floor(Math.random() * 20 + 10);
    //showDamageNumber(defender, damage, isPlayer);

    setTimeout(() => {
      defender.classList.remove("spark-flash", "battle-shake");
      slash.remove();
      if (callback) callback();
    }, 400);
  }, 300);
}

// ===== AURA DRAIN EFFECT =====
function animateAura(attacker, defender, callback) {
  const attackerParent = attacker.parentElement; // Get .fighter container
  const defenderParent = defender.parentElement;
  const startX = attacker.offsetLeft + attacker.offsetWidth / 2;
  const startY = attacker.offsetTop + attacker.offsetHeight / 2;
  const endX = defender.offsetLeft + defender.offsetWidth / 2;
  const endY = defender.offsetTop + defender.offsetHeight / 2;

  // Attacker glow
  attacker.style.filter = "drop-shadow(0 0 15px #667eea)";

  // Create aura orbs flowing
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const orb = document.createElement("div");
      orb.className = "aura-orb";
      orb.style.left = startX + "px";
      orb.style.top = startY + "px";
      orb.style.width = "10px";
      orb.style.height = "10px";
      orb.style.background = "radial-gradient(circle, #667eea, #764ba2)";
      orb.style.borderRadius = "50%";
      orb.style.position = "absolute";
      orb.style.boxShadow = "0 0 15px #667eea";
      orb.style.animation = `auraFlow 0.8s ease-in forwards`;
      orb.style.setProperty("--endX", endX - startX + "px");
      orb.style.setProperty("--endY", endY - startY + "px");

      document.querySelector(".battle-arena").appendChild(orb);
      setTimeout(() => orb.remove(), 800);
    }, i * 100);
  }

  setTimeout(() => {
    defender.classList.add("aura-hit", "battle-shake");
    defender.style.filter = "brightness(0.7)";

    //const damage = Math.floor(Math.random() * 20 + 10);
    //showDamageNumber(defender, damage, isPlayer);

    setTimeout(() => {
      defender.style.filter = "none";
      defender.classList.remove("aura-hit", "battle-shake");
      attacker.style.filter = "none";
      if (callback) callback();
    }, 400);
  }, 300);
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
function exitToHome() {
  window.location.href = "index.html";
}
// Buy cosmetic pet
function buyCosmeticPet() {
  generateCosmeticsShop();
  document.getElementById("cosmetics-modal").classList.add("active");
}

// Close cosmetics modal
function closeCosmeticsModal() {
  document.getElementById("cosmetics-modal").classList.remove("active");
}

// Generate cosmetics shop grid
function generateCosmeticsShop() {
  const grid = document.getElementById("cosmetics-grid");
  grid.innerHTML = "";

  petImages.forEach((pet) => {
    const card = document.createElement("div");
    card.className = "cosmetic-card";
    if (pet.petId === gameState.petID) {
      card.classList.add("active");
    }

    card.innerHTML = `
      <img src="${pet.petSrc}" alt="${pet.petName}" class="cosmetic-pet-img">
      <div class="cosmetic-pet-name">${pet.petName}</div>
      <div class="cosmetic-pet-cost">${pet.cost} 💰</div>
      <button class="cosmetic-pet-btn ${pet.petId === gameState.petID ? "active" : ""}" 
              onclick="buyCosmeticPetItem('${pet.petId}', '${pet.petSrc}', '${pet.petName}', ${pet.cost})">
        ${pet.petId === gameState.petID ? "✓ Selected" : "Buy"}
      </button>
    `;

    grid.appendChild(card);
  });
}

// Buy specific cosmetic pet
function buyCosmeticPetItem(petId, petSrc, petName, petCost) {
  const cost = petCost;

  if (gameState.coin < cost) {
    showModal(
      "❌ Not Enough Coins",
      `You need ${cost} coins. You only have ${gameState.coin}.`,
    );
    return;
  }

  if (petId === gameState.petID) {
    showModal("✅ Already Owned", `You already have ${petName}!`);
    return;
  }

  gameState.coin -= cost;
  gameState.petID = petId;
  gameState.petImg = petSrc;
  gameState.petName = petName;

  // Update display
  updateDisplay();
  updatePetImage();
  savePetDataToSheet();

  // Refresh shop
  generateCosmeticsShop();

  showModal("🎉 Purchased!", `You now have ${petName}!\n-${cost} Coins`);
}

// Update pet image in home screen
function updatePetImage() {
  const petImg = document.getElementById("display-pet-img");
  if (petImg) {
    petImg.src =
      gameState.petImg ||
      "https://png.pngtree.com/recommend-works/png-clipart/20250730/ourmid/pngtree-cute-pixel-cat-character-png-image_16944762.webp";
  }
}
// Initialize (happens in loadPetDataFromSheet after DOMContentLoaded)
checkEvolution();
