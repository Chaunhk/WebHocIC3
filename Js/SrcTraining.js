let questions = [];
let totalQuestions = 0;
let currentQuestion = 1;
let isReviewMode = false;
let timerInterval;
let timeInSeconds = 45 * 60;
let btnQuit, btnReset, btnMenuToggle, btnCheckAnswer, btnFinish;
let btnBackToResult, btnReview, btnExit, btnExitFromResult, quizMainContent;
let name, className, school;
let examString;
document.addEventListener("DOMContentLoaded", () => {
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
  btnCheckAnswer = document.getElementById("btnCheckAnswer");
  btnFinish = document.getElementById("btnFinish");
  btnBackToResult = document.getElementById("btnBackToResult");
  btnReview = document.getElementById("btnReview");
  btnQuit = document.getElementById("btnQuit");
  btnExit = document.getElementById("btnExit");
  btnExitFromResult = document.getElementById("btnExitFromResult");
  quizMainContent = document.getElementById("quizMainContent");
  name = sessionStorage.getItem("quiz_userName");
  className = sessionStorage.getItem("quiz_userClass");
  school = sessionStorage.getItem("quiz_userSchool");
  const exam = sessionStorage.getItem("selectedExam");
  if (exam != null) {
    examString = "Data/" + exam + ".json";
    console.log(examString);
  } else examString = "Data/Quizzs.json";
  btnReset.addEventListener("click", resetCurrentQuestion);
  btnReset.addEventListener("click", resetCurrentQuestion);
  btnMenuToggle.addEventListener("click", toggleMenuModal);
  btnCheckAnswer.addEventListener("click", checkAnswer);
  btnFinish.addEventListener("click", finishTraining);
  btnBackToResult.addEventListener("click", backToResult);
  document.getElementById("btnReview").addEventListener("click", reviewQuiz);
  btnExit.addEventListener("click", exitToHome);
  btnExitFromResult.addEventListener("click", exitToHome);
  btnQuit.addEventListener("click", exitToHome);
  document
    .getElementById("menuModalClose")
    .addEventListener("click", closeMenuModal);
  btnReview.addEventListener("click", reviewQuiz);
  btnExit.addEventListener("click", exitToHome);
  btnExitFromResult.addEventListener("click", exitToHome);
  btnQuit.addEventListener("click", exitToHome);
  fetch(examString)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      questions = data;
      questions.forEach((q) => {
        if (q.options) {
          for (let i = q.options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
          }
        }
      });
      totalQuestions = questions.length;
      totalQuestions = data.length;
      console.log("Dữ liệu đã tải thành công:", questions);
      startQuiz();
    })
    .catch((err) => {
      console.error("Lỗi khi tải .json:", err);
      alert(
        "Không thể tải dữ liệu câu hỏi. Vui lòng kiểm tra Console (F12) và đảm bảo bạn đang chạy qua Live Server.",
      );
    });
});
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
        fillHidden(q);
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
}
function renderSingle(q) {
  const inputName = `q${q.id}`;
  let html = `<div class="question-wraper" data-qtype="single" data-qid="${q.id}">`;
  html += '<ul class="options-list">';
  q.options.forEach((opt, i) => {
    const letter = (i + 10).toString(36).toUpperCase(); // 0→A, 1→B, 2→C...
    const label = opt.label.replace(/^[A-J]\.\s*/, "");
    html += `
            <li data-ans="${opt.value}">
                <label>
                    <input type="radio" name="${inputName}" value="${opt.value}">
                    ${letter}. ${label}
                </label>
            </li>`;
  });
  html += "</ul>";
  html += "</div>";
  return html;
}
function renderMulti(q) {
  const inputName = `q${q.id}`;
  const correctSet = new Set(q.correct);
  let html = `<div class="question-wrapper" data-qtype="multi" data-qid="${q.id}">`;
  html += '<ul class="options-list">';
  q.options.forEach((opt, i) => {
    const letter = (i + 10).toString(36).toUpperCase(); // 0→A, 1→B, 2→C...
    const label = opt.label.replace(/^[A-J]\.\s*/, "");
    const isCorrect = correctSet.has(opt.value);
    html += `
            <li data-ans="${opt.value}"${isCorrect ? ' class="correct-target"' : ""}>
                <label>
                    <input type="checkbox" name="${inputName}" value="${opt.value}">
                    ${letter}. ${label}
                    ${isCorrect ? '<span class="review-badge">✓</span>' : ""}
                </label>
            </li>`;
  });
  html += "</ul>";
  html += "</div>";
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
  q.rows.forEach((row, i) => {
    const rowStyle = row.label === "Hidden" ? 'style="display: none;"' : "";
    html += `
          <tr data-row-name="${row.name}" ${rowStyle} data-correct="${row.correct}">
              <td>${row.label}</td>
              <td><input type="radio" name="${row.name}" value="${trueValue}"></td>
              <td><input type="radio" name="${row.name}" value="${falseValue}"></td>
          </tr>`;
  });
  html += "</tbody></table>";
  html += "</div>";
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
            const event = new Event("change", { bubbles: true });
            targetRadio.dispatchEvent(event);
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
      if (qContainer) {
        e.dataTransfer.setData("parent-container-id", qContainer.id);
      }
      console.log("✓ Desktop drag started");
    });
    item.addEventListener("dragend", (e) => {
      if (!draggedElement) return;
      draggedElement.classList.remove("dragging");
      highlightDropZone(lastValidDropZone, false);
      lastValidDropZone = null;
      draggedElement = null;
      sourceContainerId = null;

      console.log("✓ Desktop drag ended");
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
          console.log("✗ Drop in wrong container");
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
            console.log("✓ Moved existing item back to colA");
          }
        }
        if (target.innerText.trim() === "Thả vào đây") {
          target.innerText = "";
        }
        target.appendChild(draggedElement);
        draggedElement.classList.remove("dragging");
        console.log("✓ Item dropped successfully (desktop)");

        draggedElement = null;
        sourceContainerId = null;
      });
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

        console.log("✓ Mobile touch started");
      },
      { passive: true },
    );
    item.addEventListener(
      "touchmove",
      (e) => {
        if (!draggedElement) return;
        e.preventDefault();
        const touch = e.touches[0];
        const touchY = touch.clientY;
        const windowHeight = window.innerHeight;
        draggedElement.style.position = "fixed";
        draggedElement.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
        draggedElement.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;
        draggedElement.style.zIndex = 1000;
        draggedElement.style.pointerEvents = "none";
        AutoScroll.handleScroll(touchY, windowHeight);
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
      AutoScroll.stop();
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
          console.log("✗ Drop in wrong container");
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
            console.log("✓ Moved existing item back to colA");
          }
        }
        if (target.innerText.trim() === "Thả vào đây") {
          target.innerText = "";
        }
        target.appendChild(draggedElement);
        console.log("✓ Item dropped successfully (mobile)");
      } else {
        const currentQId = sourceContainerId?.replace("qContainer", "");
        const colA = currentQId
          ? document.getElementById(`colA_${currentQId}`)
          : null;

        if (colA) {
          colA.appendChild(draggedElement);
          console.log("✓ Item returned to colA");
        }
      }

      draggedElement = null;
      sourceContainerId = null;
    });
  });
}
document.querySelectorAll(".drop-zone").forEach((zone) => {
  zone.addEventListener("dragover", (e) => e.preventDefault());
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    if (isReviewMode) return;
    const id = e.dataTransfer.getData("text");
    const sourceContainerId = e.dataTransfer.getData("parent-container-id");
    const draggedElement = document.getElementById(id);
    const target = e.target.closest(".drop-zone");
    if (!target || !draggedElement) return;
    const targetContainer = target.closest(".question-container");
    if (!targetContainer || targetContainer.id !== sourceContainerId) {
      console.warn("Không được kéo thả phần tử sang câu hỏi khác!");
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
  });
});

/* hotspot */
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
    const qContainer = wrapper.closest(".question-container");
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

  for (let i = 1; i <= totalQuestions; i++) {
    const btn = document.createElement("button");
    btn.className = "menu-item-btn";
    btn.id = `menuBtn${i}`;
    btn.innerText = i;
    const container = document.getElementById(`qContainer${i}`);
    if (container?.classList.contains("training-checked")) {
      const feedback = container.querySelector(".training-feedback");
      if (feedback?.classList.contains("correct")) {
        btn.classList.add("answered");
      } else {
        btn.classList.add("wrong");
      }
    }

    if (i === currentQuestion) btn.classList.add("active-current");

    btn.addEventListener("click", () => {
      currentQuestion = i;
      updateQuestionUI();
      document.getElementById("menuModal").classList.remove("active");
    });
    gridContainer.appendChild(btn);
  }
}
function resultMenuBtn(id, result) {
  const sessionKey = "resultSession";
  let sessionData = JSON.parse(localStorage.getItem(sessionKey)) || {};

  sessionData[id] = {
    correct: result,
  };
  console.log(`Result for question ${id}: ${sessionData[id].correct}`);
  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
}
function updateProgressBar() {
  let checkedCount = 0;
  document
    .querySelectorAll(".question-container.training-checked")
    .forEach(() => {
      checkedCount++;
    });
  const progressPercent = (checkedCount / totalQuestions) * 100;
  const progressBar = document.querySelector(".progress-bar");
  const progressContainer = document.querySelector(".progress");
  progressBar.style.width = progressPercent + "%";
  progressContainer.setAttribute("aria-valuenow", Math.round(progressPercent));
  progressBar.innerHTML = `<span class="progress-text">${checkedCount}/${totalQuestions}</span>`;
  if (checkedCount === totalQuestions) {
    progressContainer.classList.add("success");
    progressContainer.setAttribute("aria-label", "Success example");
  } else {
    progressContainer.classList.remove("success");
    progressContainer.setAttribute("aria-label", "Basic example");
  }
}
function startQuiz() {
  isReviewMode = false;
  currentQuestion = 1;

  quizMainContent.classList.remove("review-mode");
  btnCheckAnswer.style.display = "block";
  btnFinish.style.display = "block";
  btnReset.style.display = "block";
  btnBackToResult.style.display = "none";
  renderQuestions();
  bindHotspot();
  resetAllAnswers();
  updateQuestionUI();
  showScreen("screenQuiz");
  if (localStorage.getItem("isSubmited") === "true") submitQuiz();
}

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
  updateProgressBar();
  updateCheckButtonState();
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
function checkAnswer() {
  const _currentQ = questions[currentQuestion - 1];
  if (!_currentQ) return;

  const container = document.getElementById(`qContainer${_currentQ.id}`);
  if (!container) return;

  if (container.classList.contains("training-checked")) {
    alert("Bạn đã kiểm tra câu này rồi!");
    return;
  }

  const isCorrect = gradeQuestion(_currentQ);

  const feedbackEl =
    container.querySelector(".training-feedback") || createFeedbackElement();
  feedbackEl.className = isCorrect
    ? "training-feedback correct"
    : "training-feedback incorrect";
  feedbackEl.innerHTML = isCorrect
    ? '<div class="feedback-text">✓ Đúng rồi!</div>'
    : '<div class="feedback-text">✗ Sai rồi. Xem lại bài để biết đáp án đúng!</div>';

  if (!container.querySelector(".training-feedback")) {
    container.appendChild(feedbackEl);
  }
  lockAnswer(_currentQ);
  container.classList.add("training-checked");
  updateProgressBar();
  showNextButton();
}
function showNextButton() {
  const isLastQuestion = currentQuestion === totalQuestions;

  btnCheckAnswer.style.display = "none";

  if (isLastQuestion) {
    btnFinish.style.display = "block";
  } else {
    const btnNext =
      document.querySelector(".btn-next-question") || createNextButton();
    btnNext.style.display = "block";
  }
}
function createNextButton() {
  const btn = document.createElement("button");
  btn.className = "nav-btn btn-dark btn btn-sm btn-secondary btn-next-question";
  btn.innerHTML =
    '<span class="d-none d-md-inline">Câu kế tiếp</span><span class="d-inline d-md-none">›</span>';
  btn.addEventListener("click", goToNextQuestion);

  const navContainer = document.querySelector(".right-nav.gap-1");
  navContainer.appendChild(btn);

  return btn;
}
function goToNextQuestion() {
  currentQuestion++;
  updateQuestionUI();
  const btnNext = document.querySelector(".btn-next-question");
  if (btnNext) btnNext.style.display = "none";
  btnCheckAnswer.style.display = "block";
}
function createFeedbackElement() {
  const div = document.createElement("div");
  div.className = "training-feedback";
  return div;
}
function lockAnswer(q) {
  const container = document.getElementById(`qContainer${q.id}`);

  switch (q.type) {
    case "single":
    case "multi":
      container
        .querySelectorAll('input[type="radio"], input[type="checkbox"]')
        .forEach((input) => {
          input.disabled = true;
        });
      break;

    case "tf":
      container.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.disabled = true;
      });
      break;

    case "drag":
      container.querySelectorAll(".drag-item").forEach((item) => {
        item.draggable = false;
        item.style.opacity = "0.6";
        item.style.cursor = "default";
      });
      break;

    case "hotspot":
      container.querySelector(".hotspot-overlay").style.pointerEvents = "none";
      break;
  }
}
function updateCheckButtonState() {
  const _currentQ = questions[currentQuestion - 1];
  if (!_currentQ) return;
  const container = document.getElementById(`qContainer${_currentQ.id}`);
  const isChecked = container?.classList.contains("training-checked");
  btnCheckAnswer.disabled = isChecked;
  btnCheckAnswer.textContent = isChecked ? "Đã kiểm tra" : "Kiểm tra đáp án";
  if (currentQuestion !== totalQuestions) {
    btnFinish.style.display = "none";
  }
  const btnNext = document.querySelector(".btn-next-question");
  if (btnNext) btnNext.style.display = "none";
}
function finishTraining() {
  if (confirm("Bạn chắc chắn muốn hoàn thành luyện tập?")) {
    clearInterval(timerInterval);
    let checkedCount = 0;
    let correctCount = 0;

    questions.forEach((q) => {
      const container = document.getElementById(`qContainer${q.id}`);
      if (container?.classList.contains("training-checked")) {
        checkedCount++;
        const feedback = container.querySelector(".training-feedback");
        if (feedback?.classList.contains("correct")) {
          correctCount++;
        }
      }
    });
    document.getElementById("scoreText").innerText =
      `${correctCount} / ${checkedCount} Câu Đúng\nHoàn thành luyện tập!`;

    showScreen("screenResult");
  }
}

function submitQuiz() {
  let correctCount = 0;
  questions.forEach((q) => {
    const isCorrect = gradeQuestion(q);
    resultMenuBtn(q.id, isCorrect);
    if (isCorrect) correctCount++;
  });
  const reward = (100 * correctCount) / totalQuestions;
  const roundedReward = Math.round(reward);
  document.getElementById("scoreText").innerText =
    `${correctCount} / ${totalQuestions} Câu Đúng \nBạn nhận được ${roundedReward} xu`;
  if (localStorage.getItem("isSubmited") !== "true") {
    saveRewardToStudent(
      name,
      className,
      roundedReward,
      correctCount,
      totalQuestions,
      school,
    );
    localStorage.setItem("isSubmited", true);
  }
  saveCurrentQuestion();
  showScreen("screenResult");
}
function gradeSingle(q) {
  const container = document.getElementById(`qContainer${q.id}`);
  const checked = container.querySelector(`input[name="q${q.id}"]:checked`);
  container.querySelectorAll("li").forEach((li) => {
    const val = li.getAttribute("data-ans");
    const isChecked = checked && checked.value === val;
    const isCorrect = val === q.correct;

    if (isCorrect && isChecked) {
      li.classList.add("correct-ans"); // green + ✓
    } else if (isCorrect && !isChecked) {
      li.classList.add("missed-ans"); // blue — user picked wrong, highlight correct
    } else if (!isCorrect && isChecked) {
      li.classList.add("wrong-ans"); // red + ✗
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
      li.classList.add("correct-ans"); // green + ✓
    } else if (isCorrect && !isChecked) {
      li.classList.add("missed-ans"); // blue, no tick
      allCorrect = false;
    } else if (!isCorrect && isChecked) {
      li.classList.add("wrong-ans"); // red + ✗
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
      z.style.background = "rgba(76, 175, 80, 0.5)"; // green = correct zone
      z.style.borderColor = "#4CAF50";
    }
  });
  if (!isCorrect) {
    selected.style.background = "rgba(244, 67, 54, 0.5)"; // red = wrong pick
    selected.style.borderColor = "#f44336";
  }
  return isCorrect;
}
function reviewQuiz() {
  isReviewMode = true;
  quizMainContent.classList.add("review-mode");
  btnCheckAnswer.style.display = "none";
  btnFinish.style.display = "none";
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
  localStorage.removeItem("testSession");
  localStorage.removeItem("isSubmited");
  localStorage.removeItem("currentTime");
  window.location.href = "index.html";
}
function exitQuiz() {}
