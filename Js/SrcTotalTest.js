/* ════════════════════════════════════════════════════════════
   END-TERM TEST GENERATOR (SrcEndtermTest.js)
   Loads all OT*.json for selected level → pools all → selects 30 random
   
   Key: Drops selectedExam; uses selectedLevel only + loops OT1-OT10.json
════════════════════════════════════════════════════════════ */

let questions = [];
let totalQuestions = 0;
let currentQuestion = 1;
let isReviewMode = false;
let timerInterval;
let timeInSeconds = 45 * 60;
let btnQuit, btnReset, btnMenuToggle, btnSubmit, btnPrev, btnNext;
let btnBackToResult, btnReview, btnExit, btnExitFromResult, quizMainContent;
let name, className, school;

/* ════════════════════════════════
   API CONFIGURATION
════════════════════════════════ */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbw6pSVH34qkY9WbmaYxUQJ6hymkpVitbp4xFt096Hb3qyqbkqtiAMA7m1eF_ZCFp3cIjg/exec";

/* ════════════════════════════════
   END-TERM TEST CONFIG
════════════════════════════════ */
const ENDTERM_QUESTIONS_COUNT = 30;
const MAX_OT_FILES = 10; // Check OT1 through OT10

/* ════════════════════════════════
   LOAD ALL OT FILES FOR A LEVEL
════════════════════════════════ */
async function loadAllOTFiles(level) {
  const allQuestions = [];
  const loadedFiles = [];
  const failedFiles = [];

  for (let i = 1; i <= MAX_OT_FILES; i++) {
    const fileName = `OT${i}${level}.json`;
    const filePath = `Data/${level}/${fileName}`;

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        failedFiles.push(fileName);
        continue;
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        allQuestions.push(...data);
        loadedFiles.push(fileName);
        console.log(`✓ Loaded ${fileName}: ${data.length} questions`);
      }
    } catch (err) {
      failedFiles.push(fileName);
      console.log(`✗ Could not load ${fileName}`);
    }
  }

  console.log(`
📊 End-term Test Summary:
   Level: ${level}
   Files loaded: ${loadedFiles.join(", ")}
   Total questions available: ${allQuestions.length}
   Files not found: ${failedFiles.join(", ")}
  `);

  return allQuestions;
}

/* ════════════════════════════════
   SELECT 30 RANDOM QUESTIONS
════════════════════════════════ */
function selectQuestionsForEndterm(
  allQuestions,
  count = ENDTERM_QUESTIONS_COUNT,
) {
  if (allQuestions.length === 0) {
    throw new Error("No questions available for end-term test");
  }

  const toSelect = Math.min(count, allQuestions.length);
  const shuffled = [...allQuestions];

  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, toSelect);

  // Re-index with sequential IDs for this test
  selected.forEach((q, idx) => {
    q.originalId = q.id;
    q.id = idx + 1;
  });

  console.log(`✓ Selected ${selected.length} questions for end-term test`);
  return selected;
}

/* ════════════════════════════════
   INITIALIZATION
════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
  if (
    sessionStorage.getItem("auth") !== "true" ||
    !sessionStorage.getItem("quiz_userName") ||
    !sessionStorage.getItem("quiz_userClass")
  ) {
    exitToHome();
    return;
  }

  btnReset = document.getElementById("btnReset");
  btnMenuToggle = document.getElementById("btnMenuToggle");
  btnSubmit = document.getElementById("btnSubmit");
  btnPrev = document.getElementById("btnPrev");
  btnNext = document.getElementById("btnNext");
  btnBackToResult = document.getElementById("btnBackToResult");
  btnReview = document.getElementById("btnReview");
  btnQuit = document.getElementById("btnQuit");
  btnExit = document.getElementById("btnExit");
  btnExitFromResult = document.getElementById("btnExitFromResult");
  quizMainContent = document.getElementById("quizMainContent");

  name = sessionStorage.getItem("quiz_userName");
  className = sessionStorage.getItem("quiz_userClass");
  school = sessionStorage.getItem("quiz_userSchool");
  const level = sessionStorage.getItem("selectedLevel");

  btnReset.addEventListener("click", resetCurrentQuestion);
  btnMenuToggle.addEventListener("click", toggleMenuModal);
  btnSubmit.addEventListener("click", submitQuiz);
  btnPrev.addEventListener("click", () => changeQuestion(-1));
  btnNext.addEventListener("click", () => changeQuestion(1));
  btnBackToResult.addEventListener("click", backToResult);
  btnReview.addEventListener("click", reviewQuiz);
  btnExit.addEventListener("click", exitToHome);
  btnExitFromResult.addEventListener("click", exitToHome);
  btnQuit.addEventListener("click", exitToHome);
  document
    .getElementById("menuModalClose")
    .addEventListener("click", closeMenuModal);

  try {
    const allQuestions = await loadAllOTFiles(level);
    if (allQuestions.length === 0) {
      throw new Error(`No OT files found for level ${level}`);
    }

    questions = selectQuestionsForEndterm(
      allQuestions,
      ENDTERM_QUESTIONS_COUNT,
    );

    const savedSession =
      JSON.parse(localStorage.getItem("testSession") || "{}") || {};
    const savedOrder =
      JSON.parse(localStorage.getItem("testSessionOrder") || "{}") || {};
    const hasActiveSession =
      Object.keys(savedSession).length > 0 ||
      Boolean(localStorage.getItem("currentQuestion")) ||
      Boolean(localStorage.getItem("currentTime"));
    const shouldRestoreOrder =
      hasActiveSession &&
      savedOrder.questionOrder &&
      savedOrder.questionOrder.length === questions.length;

    if (!shouldRestoreOrder) {
      questions.forEach((q) => {
        if (q.options) {
          for (let i = q.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
          }
        }
      });

      const orderMeta = {
        questionOrder: questions.map((q) => q.id),
        optionOrder: {},
      };
      questions.forEach((q) => {
        if (q.options) {
          orderMeta.optionOrder[q.id] = q.options.map((opt) => opt.value);
        }
      });
      localStorage.setItem("testSessionOrder", JSON.stringify(orderMeta));
    } else if (
      savedOrder.questionOrder &&
      savedOrder.questionOrder.length === questions.length
    ) {
      const questionMap = new Map(questions.map((q) => [String(q.id), q]));
      questions = savedOrder.questionOrder
        .map((qid) => questionMap.get(String(qid)))
        .filter(Boolean);

      questions.forEach((q) => {
        const savedOptionOrder = savedOrder.optionOrder?.[String(q.id)];
        if (savedOptionOrder && q.options) {
          const optionMap = new Map(
            q.options.map((opt) => [String(opt.value), opt]),
          );
          q.options = savedOptionOrder
            .map((value) => optionMap.get(String(value)))
            .filter(Boolean);
        }
      });

      console.log("✓ Session restored");
    }

    totalQuestions = questions.length;
    console.log(`📝 End-term test ready: ${totalQuestions} questions`);
    startQuiz();
  } catch (err) {
    console.error("❌ Error:", err);
    alert(
      `Không thể tải bài kiểm tra cuối kỳ: ${err.message}\nVui lòng kiểm tra Console.`,
    );
    exitToHome();
  }
});

/* ════════════════════════════════
   RENDER QUESTIONS
════════════════════════════════ */
function renderQuestions() {
  quizMainContent
    .querySelectorAll(".question-container")
    .forEach((el) => el.remove());

  questions.forEach((q, idx) => {
    const container = document.createElement("div");
    container.className = "question-container" + (idx === 0 ? " active" : "");
    container.id = `qContainer${q.id}`;
    container.dataset.type = q.type;

    let inner = `<div class="question-text">${q.text}</div>`;

    if (q.image && q.type != "hotspot") {
      inner += `<img class="question-img" src="${q.image}" onerror="this.style.display='none'">`;
    }

    switch (q.type) {
      case "single":
        inner += renderSingle(q);
        break;
      case "multi":
        inner += renderMulti(q);
        break;
      case "tf":
        inner += renderTF(q);
        break;
      case "drag":
        inner += renderDrag(q);
        break;
      case "hotspot":
        inner += renderHotspot(q);
        break;
    }

    container.innerHTML = inner;
    quizMainContent.appendChild(container);
    if (q.type === "tf") {
      fillHidden(q);
    }
  });

  bindDragDrop();
  bindHotspot();
}

function renderSingle(q) {
  const inputName = `q${q.id}`;
  let html = `<div class="question-wraper" data-qtype="single" data-qid="${q.id}">`;
  html += '<ul class="options-list">';
  q.options.forEach((opt, i) => {
    const letter = (i + 10).toString(36).toUpperCase();
    const label = opt.label.replace(/^[A-J]\.\s*/, "");
    html += `
            <li data-ans="${opt.value}">
                <label>
                    <input type="radio" name="${inputName}" value="${opt.value}">
                    ${letter}. ${label}
                </label>
            </li>`;
  });
  html += "</ul></div>";
  return html;
}

function renderMulti(q) {
  const inputName = `q${q.id}`;
  let html = `<div class="question-wrapper" data-qtype="multi" data-qid="${q.id}">`;
  html += '<ul class="options-list">';
  q.options.forEach((opt, i) => {
    const letter = (i + 10).toString(36).toUpperCase();
    const label = opt.label.replace(/^[A-J]\.\s*/, "");
    html += `
            <li data-ans="${opt.value}">
                <label>
                    <input type="checkbox" name="${inputName}" value="${opt.value}">
                    ${letter}. ${label}
                </label>
            </li>`;
  });
  html += "</ul></div>";
  return html;
}

function renderTF(q) {
  let trueValue = "Đúng";
  let falseValue = "Sai";
  q.rows.forEach((row) => {
    if (
      row.correct !== "Đúng" &&
      trueValue === "Đúng" &&
      row.correct !== falseValue
    ) {
      trueValue = row.correct;
    } else if (row.correct !== "Sai" && row.correct !== trueValue) {
      falseValue = row.correct;
    }
  });

  let html = `
        <div class="question-wrapper" data-qtype="tf" data-qid="${q.id}">
        <table class="tf-table">
            <thead><tr><th>Phát biểu</th><th style="text-align: center;">${trueValue}</th><th style="text-align: center;">${falseValue}</th></tr></thead>
            <tbody>`;
  q.rows.forEach((row) => {
    const rowStyle = row.label === "Hidden" ? 'style="display: none;"' : "";
    html += `
          <tr data-row-name="${row.name}" ${rowStyle} data-correct="${row.correct}">
              <td>${row.label}</td>
              <td><input type="radio" name="${row.name}" value="${trueValue}"></td>
              <td><input type="radio" name="${row.name}" value="${falseValue}"></td>
          </tr>`;
  });
  html += "</tbody></table></div>";
  return html;
}

function fillHidden(q) {
  setTimeout(() => {
    const container = document.getElementById(`qContainer${q.id}`);
    if (!container) return;
    const rows = container.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const firstCell = row.querySelector("td");
      if (firstCell && firstCell.textContent.trim() === "Hidden") {
        const correctValue = row.getAttribute("data-correct");
        if (correctValue) {
          const targetRadio = row.querySelector(
            `input[type="radio"][value="${correctValue}"]`,
          );
          if (targetRadio) {
            targetRadio.checked = true;
          }
        }
      }
    });
  }, 0);
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderDrag(q) {
  let colAItems = shuffle(q.items)
    .map(
      (item) => `
        <div class="drag-item" draggable="true" id="${q.type}-${q.id}-${item.id}" data-target="${q.type}-${q.id}-${item.target}" data-item-id="${item.id}">
            ${item.label}
        </div>`,
    )
    .join("");

  let colBZones = q.zones
    .map(
      (zone) => `
        <div class="drop-zone-group">
            <div class="drop-label">${zone.label}</div>
            <div class="drop-zone" id="${q.type}-${q.id}-${zone.id}" data-zone-id="${zone.id}">Thả vào đây</div>
        </div>`,
    )
    .join("");

  return `
        <div class="matching-grid" data-qtype="drag" data-qid="${q.id}">
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

function renderHotspot(q) {
  const zones = q.zones
    .map(
      (z) => `
        <div class="hotspot-zone" 
            id="hz_${z.id}"
            data-id="${z.id}"
            data-correct="${z.correct}"
            style="left:${z.x}%; top:${z.y}%; width:${z.width}%; height:${z.height}%;">
        </div>
    `,
    )
    .join("");

  return `
        <div class="hotspot-wrapper" data-qtype="hotspot" data-qid="${q.id}">
            <img src="${q.image}" class="hotspot-img" data-qid="${q.id}">
            <div class="hotspot-overlay">
                ${zones}
            </div>
        </div>
    `;
}

/* ════════════════════════════════
   DRAG & DROP BINDING
════════════════════════════════ */
function bindDragDrop() {
  let draggedElement = null;
  let sourceContainerId = null;
  let lastValidDropZone = null;

  function getDropZoneFromPoint(x, y) {
    if (!draggedElement) return null;
    const originalDisplay = draggedElement.style.display;
    draggedElement.style.display = "none";
    const el = document.elementFromPoint(x, y);
    draggedElement.style.display = originalDisplay;
    return el ? el.closest(".drop-zone") : null;
  }

  function highlightDropZone(zone, highlight = true) {
    if (!zone) return;
    if (highlight) {
      zone.classList.add("over");
    } else {
      zone.classList.remove("over");
    }
  }

  document.querySelectorAll(".drag-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      if (isReviewMode) return e.preventDefault();
      draggedElement = e.target.closest(".drag-item");
      const qContainer = draggedElement.closest(".question-container");
      sourceContainerId = qContainer ? qContainer.id : null;
      draggedElement.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedElement.id);
    });

    item.addEventListener("dragend", (e) => {
      if (!draggedElement) return;
      draggedElement.classList.remove("dragging");
      highlightDropZone(lastValidDropZone, false);
      lastValidDropZone = null;
      draggedElement = null;
      sourceContainerId = null;
    });

    item.addEventListener(
      "touchstart",
      (e) => {
        if (isReviewMode) return;
        draggedElement = e.target.closest(".drag-item");
        if (!draggedElement) return;
        const qContainer = draggedElement.closest(".question-container");
        sourceContainerId = qContainer ? qContainer.id : null;
        draggedElement.classList.add("dragging");
        const rect = draggedElement.getBoundingClientRect();
        draggedElement.style.width = `${rect.width}px`;
        draggedElement.style.height = `${rect.height}px`;
      },
      { passive: true },
    );

    item.addEventListener(
      "touchmove",
      (e) => {
        if (!draggedElement) return;
        e.preventDefault();
        const touch = e.touches[0];
        draggedElement.style.position = "fixed";
        draggedElement.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
        draggedElement.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;
        draggedElement.style.zIndex = 1000;
        draggedElement.style.pointerEvents = "none";

        const detectY = touch.clientY + draggedElement.offsetHeight / 2;
        const dropZone = getDropZoneFromPoint(touch.clientX, detectY);

        if (dropZone !== lastValidDropZone) {
          highlightDropZone(lastValidDropZone, false);
          highlightDropZone(dropZone, true);
          lastValidDropZone = dropZone;
        }
      },
      { passive: false },
    );

    item.addEventListener("touchend", (e) => {
      if (!draggedElement) return;
      highlightDropZone(lastValidDropZone, false);
      lastValidDropZone = null;

      const touch = e.changedTouches[0];
      const detectY = touch.clientY + draggedElement.offsetHeight / 2;
      const target = getDropZoneFromPoint(touch.clientX, detectY);

      draggedElement.style.position = "";
      draggedElement.style.left = "";
      draggedElement.style.top = "";
      draggedElement.style.zIndex = "";
      draggedElement.style.pointerEvents = "";
      draggedElement.style.width = "";
      draggedElement.style.height = "";
      draggedElement.classList.remove("dragging");

      if (target) {
        const targetContainer = target.closest(".question-container");
        if (!targetContainer || targetContainer.id !== sourceContainerId) {
          draggedElement = null;
          return;
        }

        const currentQId = sourceContainerId.replace("qContainer", "");
        const colA = document.getElementById(`colA_${currentQId}`);

        if (
          target.children.length > 0 &&
          target.children[0] !== draggedElement
        ) {
          if (colA) {
            colA.appendChild(target.children[0]);
          }
        }

        if (target.innerText.trim() === "Thả vào đây") {
          target.innerText = "";
        }

        target.appendChild(draggedElement);
      } else {
        const currentQId = sourceContainerId?.replace("qContainer", "");
        const colA = currentQId
          ? document.getElementById(`colA_${currentQId}`)
          : null;
        if (colA) {
          colA.appendChild(draggedElement);
        }
      }

      draggedElement = null;
      sourceContainerId = null;
    });
  });

  document.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      if (!draggedElement) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      highlightDropZone(zone, true);
    });

    zone.addEventListener("dragleave", (e) => {
      highlightDropZone(zone, false);
    });

    zone.addEventListener("drop", (e) => {
      if (!draggedElement) return;
      e.preventDefault();

      const target = zone;
      const targetContainer = target.closest(".question-container");

      if (!targetContainer || targetContainer.id !== sourceContainerId) {
        draggedElement = null;
        return;
      }

      const currentQId = sourceContainerId.replace("qContainer", "");
      const colA = document.getElementById(`colA_${currentQId}`);

      if (target.children.length > 0 && target.children[0] !== draggedElement) {
        if (colA) {
          colA.appendChild(target.children[0]);
        }
      }

      if (target.innerText.trim() === "Thả vào đây") {
        target.innerText = "";
      }

      target.appendChild(draggedElement);
      draggedElement.classList.remove("dragging");
      draggedElement = null;
      sourceContainerId = null;
    });
  });
}

/* ════════════════════════════════
   HOTSPOT BINDING
════════════════════════════════ */
function bindHotspot() {
  document.querySelectorAll(".hotspot-zone").forEach((zone) => {
    zone.addEventListener("click", () => {
      if (isReviewMode) return;
      const container = zone.closest(".question-container");
      container.querySelectorAll(".hotspot-zone").forEach((z) => {
        z.classList.remove("selected");
      });
      zone.classList.add("selected");
    });
  });

  document.querySelectorAll(".hotspot-wrapper").forEach((wrapper) => {
    const overlay = wrapper.querySelector(".hotspot-overlay");
    overlay.addEventListener("click", (e) => {
      if (isReviewMode) return;
      const rect = overlay.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      overlay.querySelectorAll(".hotspot-marker").forEach((m) => m.remove());
      const marker = document.createElement("div");
      marker.className = "hotspot-marker";
      marker.style.left = xPercent + "%";
      marker.style.top = yPercent + "%";
      overlay.appendChild(marker);

      wrapper.dataset.clickX = xPercent;
      wrapper.dataset.clickY = yPercent;
    });
  });
}

/* ════════════════════════════════
   SCREEN & MENU
════════════════════════════════ */
function showScreen(screenId) {
  document.getElementById("menuModal").classList.remove("active");
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function toggleMenuModal() {
  const modal = document.getElementById("menuModal");
  if (modal.classList.contains("active")) {
    modal.classList.remove("active");
  } else {
    buildMenuGrid();
    modal.classList.add("active");
  }
}

function closeMenuModal() {
  document.getElementById("menuModal").classList.remove("active");
}

function buildMenuGrid() {
  const gridContainer = document.getElementById("menuGridBlock");
  gridContainer.innerHTML = "";

  const sessionData = JSON.parse(localStorage.getItem("testSession")) || {};
  const sessionResultData =
    JSON.parse(localStorage.getItem("resultSession")) || {};

  questions.forEach((q, index) => {
    const position = index + 1;
    const btn = document.createElement("button");
    btn.className = "menu-item-btn";
    btn.id = `menuBtn${position}`;
    btn.innerText = position;
    btn.dataset.qid = q.id;

    if (localStorage.getItem("isSubmited") !== "true") {
      if (sessionData[q.id]?.answered) {
        btn.classList.add("answered");
      }
    } else {
      if (sessionResultData[q.id]?.correct) {
        btn.classList.add("answered");
      } else {
        btn.classList.add("wrong");
      }
    }

    if (position === currentQuestion) btn.classList.add("active-current");

    btn.addEventListener("click", () => {
      saveCurrentQuestionAnswer();
      currentQuestion = position;
      saveCurrentQuestion();
      updateQuestionUI();
      closeMenuModal();
    });

    gridContainer.appendChild(btn);
  });
}

function resultMenuBtn(id, result) {
  const sessionKey = "resultSession";
  let sessionData = JSON.parse(localStorage.getItem(sessionKey)) || {};
  sessionData[id] = { correct: result };
  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
}

function updateProgressBar() {
  const sessionData = JSON.parse(localStorage.getItem("testSession")) || {};
  let answeredCount = 0;
  for (let i = 1; i <= totalQuestions; i++) {
    if (sessionData[i]?.answered) {
      answeredCount++;
    }
  }
  const progressPercent = (answeredCount / totalQuestions) * 100;
  const progressBar = document.querySelector(".progress-bar");
  const progressContainer = document.querySelector(".progress");
  progressBar.style.width = progressPercent + "%";
  progressContainer.setAttribute("aria-valuenow", Math.round(progressPercent));

  if (answeredCount === totalQuestions) {
    progressContainer.classList.add("success");
  } else {
    progressContainer.classList.remove("success");
  }
}

/* ════════════════════════════════
   START QUIZ
════════════════════════════════ */
function startQuiz() {
  document.getElementById("lbName").innerText = name;
  document.getElementById("lbClass").innerText = className;

  isReviewMode = false;
  currentQuestion = 1;

  quizMainContent.classList.remove("review-mode");
  btnSubmit.style.display = "block";
  btnReset.style.display = "block";
  btnBackToResult.style.display = "none";

  loadCurrentQuestion();
  renderQuestions();
  resetAllAnswers();

  timeInSeconds = 45 * 60;
  clearInterval(timerInterval);
  startTimer();

  updateQuestionUI();
  showScreen("screenQuiz");
  if (localStorage.getItem("isSubmited") === "true") submitQuiz();
}

/* ════════════════════════════════
   TIMER
════════════════════════════════ */
function startTimer() {
  timerInterval = setInterval(() => {
    const mins = Math.floor(timeInSeconds / 60);
    const secs = timeInSeconds % 60;
    document.getElementById("countdown").innerText =
      `${mins < 10 ? "0" + mins : mins} : ${secs < 10 ? "0" + secs : secs}`;
    if (timeInSeconds <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }
    timeInSeconds--;
  }, 1000);
  loadCurrentTime();
}

/* ════════════════════════════════
   QUIZ NAVIGATION
════════════════════════════════ */
function updateQuestionUI() {
  document.getElementById("questionCounter").innerText =
    `Câu ${currentQuestion}/${totalQuestions}`;

  document.querySelectorAll(".question-container").forEach((c) => {
    c.classList.remove("active");
    c.querySelectorAll(".drag-item").forEach((item) => {
      item.style.display = "none";
    });
  });

  const _currentQ = questions[currentQuestion - 1];
  const currentContainer = _currentQ
    ? document.getElementById(`qContainer${_currentQ.id}`)
    : null;
  if (currentContainer) {
    currentContainer.classList.add("active");
    currentContainer.querySelectorAll(".drag-item").forEach((item) => {
      item.style.display = "block";
    });
  }

  if (_currentQ) {
    loadQuestionAnswer(_currentQ.id);
  }

  btnSubmit.disabled = currentQuestion < totalQuestions;
  btnNext.disabled = currentQuestion == totalQuestions;
  btnPrev.disabled = currentQuestion == 1;
  updateProgressBar();
}

function changeQuestion(direction) {
  saveCurrentQuestionAnswer();
  currentQuestion = Math.max(
    1,
    Math.min(totalQuestions, currentQuestion + direction),
  );
  closeMenuModal();
  saveCurrentQuestion();
  updateQuestionUI();
}

function saveCurrentQuestion() {
  localStorage.setItem("currentQuestion", currentQuestion);
  localStorage.setItem(
    "currentTime",
    document.getElementById("countdown").innerText,
  );
}

function loadCurrentQuestion() {
  const saved = localStorage.getItem("currentQuestion");
  if (saved) {
    currentQuestion = parseInt(saved);
  }
}

function loadCurrentTime() {
  const savedTime = localStorage.getItem("currentTime");
  if (savedTime) {
    timeInSeconds = savedTime
      .split(":")
      .reduce((acc, time) => 60 * acc + +time);
    document.getElementById("countdown").innerText = savedTime;
  }
}

/* ════════════════════════════════
   ANSWER SAVE/LOAD
════════════════════════════════ */
function saveCurrentQuestionAnswer() {
  const container = document.querySelector(".question-container.active");
  const isSubmited = localStorage.getItem("isSubmited");
  if (!container || isSubmited === "true") return;

  const qid = container.id.replace("qContainer", "");
  const qtype = container.dataset.type;
  let answer = null;
  let answered = false;

  switch (qtype) {
    case "single": {
      const selected = container.querySelector(`input[name="q${qid}"]:checked`);
      if (selected) {
        answer = selected.value;
        answered = true;
      }
      break;
    }
    case "multi": {
      const selected = container.querySelectorAll(
        `input[name="q${qid}"]:checked`,
      );
      if (selected.length > 0) {
        answer = Array.from(selected).map((el) => el.value);
        answered = true;
      }
      break;
    }
    case "tf": {
      const rows = container.querySelectorAll("tr[data-row-name]");
      answer = {};
      let allAnswered = true;
      rows.forEach((row) => {
        const rowName = row.dataset.rowName;
        const selected = row.querySelector('input[type="radio"]:checked');
        if (selected) {
          answer[rowName] = selected.value;
        } else {
          allAnswered = false;
        }
      });
      answered = allAnswered;
      break;
    }
    case "drag": {
      const dropZones = container.querySelectorAll(".drop-zone");
      answer = {};
      dropZones.forEach((zone) => {
        const zoneId = zone.dataset.zoneId;
        const items = zone.querySelectorAll(".drag-item");
        items.forEach((item) => {
          const itemId = item.dataset.itemId;
          answer[itemId] = zoneId;
        });
      });
      const allItems = container.querySelectorAll(".drag-item");
      answered =
        allItems.length > 0 && Object.keys(answer).length === allItems.length;
      break;
    }
    case "hotspot": {
      const wrapper = container.querySelector(".hotspot-wrapper");
      const clickX = wrapper?.dataset.clickX;
      const clickY = wrapper?.dataset.clickY;
      if (clickX !== undefined && clickY !== undefined) {
        answer = { x: parseFloat(clickX), y: parseFloat(clickY) };
        answered = true;
      }
      break;
    }
  }

  const sessionKey = "testSession";
  let sessionData = JSON.parse(localStorage.getItem(sessionKey)) || {};
  sessionData[qid] = {
    type: qtype,
    answered: answered,
    answer: answer,
    timestamp: Date.now(),
  };
  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
}

function loadQuestionAnswer(qid) {
  const sessionKey = "testSession";
  const sessionData = JSON.parse(localStorage.getItem(sessionKey)) || {};
  const savedAnswer = sessionData[qid];

  if (!savedAnswer || !savedAnswer.answered) return;

  const container = document.querySelector(`#qContainer${qid}`);
  if (!container) return;

  const qtype = container.dataset.type;
  const answer = savedAnswer.answer;

  switch (qtype) {
    case "single": {
      const input = container.querySelector(
        `input[name="q${qid}"][value="${answer}"]`,
      );
      if (input) input.checked = true;
      break;
    }
    case "multi": {
      answer.forEach((value) => {
        const input = container.querySelector(
          `input[name="q${qid}"][value="${value}"]`,
        );
        if (input) input.checked = true;
      });
      break;
    }
    case "tf": {
      Object.entries(answer).forEach(([rowName, value]) => {
        const input = container.querySelector(
          `input[name="${rowName}"][value="${value}"]`,
        );
        if (input) input.checked = true;
      });
      break;
    }
    case "drag": {
      Object.entries(answer).forEach(([itemId, zoneId]) => {
        const item = container.querySelector(`[data-item-id="${itemId}"]`);
        const zone = container.querySelector(`[data-zone-id="${zoneId}"]`);

        if (item && zone) {
          const colA = container.querySelector('[id^="colA_"]');
          if (colA && item.parentElement === colA) {
            item.remove();
          }
          if (zone.innerText.trim() === "Thả vào đây") {
            zone.innerText = "";
          }
          zone.appendChild(item);
        }
      });
      break;
    }
    case "hotspot": {
      const wrapper = container.querySelector(".hotspot-wrapper");
      const overlay = wrapper?.querySelector(".hotspot-overlay");

      if (overlay && answer.x !== undefined && answer.y !== undefined) {
        overlay.querySelectorAll(".hotspot-marker").forEach((m) => m.remove());
        const marker = document.createElement("div");
        marker.className = "hotspot-marker";
        marker.style.left = answer.x + "%";
        marker.style.top = answer.y + "%";
        overlay.appendChild(marker);

        const zones = container.querySelectorAll(".hotspot-zone");
        zones.forEach((z) => z.classList.remove("selected"));

        for (let i = zones.length - 1; i >= 0; i--) {
          const z = zones[i];
          const zoneX = parseFloat(z.style.left);
          const zoneY = parseFloat(z.style.top);
          const zoneW = parseFloat(z.style.width);
          const zoneH = parseFloat(z.style.height);

          if (
            answer.x >= zoneX &&
            answer.x < zoneX + zoneW &&
            answer.y >= zoneY &&
            answer.y < zoneY + zoneH
          ) {
            z.classList.add("selected");
            break;
          }
        }
      }
      break;
    }
  }
}

function resetCurrentQuestion() {
  if (isReviewMode) return;
  const _resetQ = questions[currentQuestion - 1];
  const container = _resetQ
    ? document.getElementById(`qContainer${_resetQ.id}`)
    : null;
  if (!container) return;
  container.querySelectorAll("input").forEach((i) => (i.checked = false));

  const q = questions[currentQuestion - 1];
  if (q && q.type === "drag") {
    const colA = document.getElementById(`colA_${q.id}`);
    container
      .querySelectorAll(".drag-item")
      .forEach((item) => colA.appendChild(item));
    container
      .querySelectorAll(".drop-zone")
      .forEach((z) => (z.innerText = "Thả vào đây"));
  }
}

function resetAllAnswers() {
  quizMainContent.querySelectorAll("input").forEach((i) => (i.checked = false));
  quizMainContent.querySelectorAll("li, tr").forEach((el) => {
    el.classList.remove("correct-ans", "wrong-ans");
  });

  questions
    .filter((q) => q.type === "drag")
    .forEach((q) => {
      const container = document.getElementById(`qContainer${q.id}`);
      const colA = document.getElementById(`colA_${q.id}`);
      if (colA && container) {
        container.querySelectorAll(".drag-item").forEach((item) => {
          item.style.display = "none";
          colA.appendChild(item);
        });
        container.querySelectorAll(".drop-zone").forEach((z) => {
          z.innerText = "Thả vào đây";
          z.classList.remove("correct-ans", "wrong-ans");
        });
      }
    });
}

/* ════════════════════════════════
   GRADING
════════════════════════════════ */
function gradeQuestion(q) {
  switch (q.type) {
    case "single":
      return gradeSingle(q);
    case "multi":
      return gradeMulti(q);
    case "tf":
      return gradeTF(q);
    case "drag":
      return gradeDrag(q);
    case "hotspot":
      return gradeHotspot(q);
    default:
      return false;
  }
}

function gradeSingle(q) {
  const container = document.getElementById(`qContainer${q.id}`);
  const checked = container.querySelector(`input[name="q${q.id}"]:checked`);
  container.querySelectorAll("li").forEach((li) => {
    const val = li.getAttribute("data-ans");
    const isChecked = checked && checked.value === val;
    const isCorrect = val === q.correct;

    if (isCorrect && isChecked) {
      li.classList.add("correct-ans");
    } else if (isCorrect && !isChecked) {
      li.classList.add("missed-ans");
    } else if (!isCorrect && isChecked) {
      li.classList.add("wrong-ans");
    }
  });
  return checked && checked.value === q.correct;
}

function gradeMulti(q) {
  const correctSet = new Set(q.correct);
  let allCorrect = true;
  const container = document.getElementById(`qContainer${q.id}`);

  container.querySelectorAll("li").forEach((li) => {
    const val = li.getAttribute("data-ans");
    const cb = li.querySelector('input[type="checkbox"]');
    const isChecked = cb && cb.checked;
    const isCorrect = correctSet.has(val);

    if (isCorrect && isChecked) {
      li.classList.add("correct-ans");
    } else if (isCorrect && !isChecked) {
      li.classList.add("missed-ans");
      allCorrect = false;
    } else if (!isCorrect && isChecked) {
      li.classList.add("wrong-ans");
      allCorrect = false;
    }
  });

  return allCorrect;
}

function gradeTF(q) {
  let allCorrect = true;
  const container = document.getElementById(`qContainer${q.id}`);
  container.querySelectorAll("tbody tr").forEach((row) => {
    const corr = row.getAttribute("data-correct");
    const userSel = row.querySelector("input:checked");
    if (!userSel || userSel.value !== corr) {
      row.classList.add("wrong-ans");
      const cells = row.querySelectorAll("td");
      cells.forEach((cell) => {
        const input = cell.querySelector("input");
        if (input && input.value === corr) {
          cell.classList.add("missed-ans");
        }
      });
      allCorrect = false;
    } else {
      row.classList.add("correct-ans");
    }
  });

  const allAnswered = q.rows.every((row) =>
    document.querySelector(`input[name="${row.name}"]:checked`),
  );
  return allCorrect && allAnswered;
}

function gradeDrag(q) {
  let allCorrect = true;
  const container = document.getElementById(`qContainer${q.id}`);
  container.querySelectorAll(".drop-zone").forEach((zone) => {
    const child = zone.children[0];
    if (child && child.getAttribute("data-target") === zone.id) {
      zone.classList.add("correct-ans");
    } else {
      zone.classList.add("wrong-ans");
      allCorrect = false;
    }
  });
  return allCorrect;
}

function gradeHotspot(q) {
  const container = document.getElementById(`qContainer${q.id}`);
  const selected = container.querySelector(".hotspot-zone.selected");

  if (!selected) return false;

  const isCorrect = selected.dataset.correct === "true";

  container.querySelectorAll(".hotspot-zone").forEach((z) => {
    if (z.dataset.correct === "true") {
      z.style.background = "rgba(76, 175, 80, 0.5)";
      z.style.borderColor = "#4CAF50";
    }
  });

  if (!isCorrect) {
    selected.style.background = "rgba(244, 67, 54, 0.5)";
    selected.style.borderColor = "#f44336";
  }

  return isCorrect;
}

function submitQuiz() {
  clearInterval(timerInterval);
  saveCurrentQuestionAnswer();
  for (let i = 1; i <= totalQuestions; i++) {
    loadQuestionAnswer(i);
  }
  let correctCount = 0;

  questions.forEach((q) => {
    const isCorrect = gradeQuestion(q);
    resultMenuBtn(q.id, isCorrect);
    if (isCorrect) correctCount++;
  });

  // 📝 Build test name from level + exam (handles end-term case too)
  const level = sessionStorage.getItem("selectedLevel");
  const exam = sessionStorage.getItem("selectedExamName") || "OTTH"; // OTTH if no exam
  const testname = exam ? level + exam : level; // "LV1GM1" or just "LV1" for end-term

  const reward = (100 * correctCount) / totalQuestions;
  const roundedReward = Math.round(reward);

  document.getElementById("scoreText").innerText =
    `${correctCount} / ${totalQuestions} Câu Đúng`;

  // 📝 Save with all required parameters in correct order
  if (localStorage.getItem("isSubmited") !== "true") {
    saveRewardToStudent(
      name, // 1. studentName
      className, // 2. studentClass
      roundedReward, // 3. roundedReward (coin amount)
      correctCount, // 4. correctCount
      totalQuestions, // 5. totalCount
      school, // 6. schoolname
      testname, // 7. testname (e.g., "LV1GM1" or "LV1")
    );
    localStorage.setItem("isSubmited", true);
  }
  saveCurrentQuestion();
  showScreen("screenResult");
}

function saveRewardToStudent(
  studentName,
  studentClass,
  roundedReward,
  correctCount,
  totalCount,
  schoolname,
  testname,
) {
  // Validate school name
  if (!schoolname) {
    console.error("✗ Error: School name not found in sessionStorage");
    console.log("Available in sessionStorage:", {
      userName: sessionStorage.getItem("quiz_userName")?.trim(),
      userClass: sessionStorage.getItem("quiz_userClass")?.trim(),
      userSchool: sessionStorage.getItem("quiz_userSchool")?.trim(),
      auth: sessionStorage.getItem("auth"),
    });
    return;
  }

  console.log(`✓ Saving reward for: ${studentName} (${studentClass})`);
  console.log(
    `  Test: ${testname} | Score: ${correctCount}/${totalCount} | Coins: +${roundedReward} | School: ${schoolname}`,
  );

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "saveReward",
      hoten: studentName,
      lop: studentClass,
      reward: roundedReward, // ← Coin amount (number)
      correctCount: correctCount,
      totalCount: totalCount,
      testname: testname, // ← Test name (matches .gs payload)
      timestamp: new Date().toISOString(),
      truong: schoolname, // ← School name (matches .gs payload)
    }),
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.success) {
        console.log("✓ Reward saved successfully!");
        console.log(`  Test: ${testname}`);
        console.log(
          `  Score: ${correctCount}/${totalCount} (${roundedReward}%)`,
        );
        if (response.data?.newCoin !== undefined) {
          console.log(`  New coin balance: ${response.data.newCoin} xu`);
        }
      } else {
        console.error(
          `✗ Failed to save reward for ${studentName} (${studentClass}) - Test: ${testname}`,
          response.error,
        );
      }
    })
    .catch((err) => {
      console.error("✗ Network error saving reward:", err);
    });
}

function reviewQuiz() {
  isReviewMode = true;
  quizMainContent.classList.add("review-mode");
  btnSubmit.style.display = "none";
  btnReset.style.display = "none";
  btnBackToResult.style.display = "block";

  currentQuestion = 1;
  updateQuestionUI();
  showScreen("screenQuiz");
}

function backToResult() {
  showScreen("screenResult");
}

function exitToHome() {
  sessionStorage.removeItem("selectedExam");
  localStorage.removeItem("currentQuestion");
  localStorage.removeItem("currentTime");
  localStorage.removeItem("testSession");
  localStorage.removeItem("testSessionOrder");
  localStorage.removeItem("isSubmited");
  localStorage.removeItem("resultSession");
  window.location.href = "index.html";
}
