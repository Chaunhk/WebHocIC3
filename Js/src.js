/* Shared quiz runtime for srcTest.html and srcTraining.html */
let questions = [];
let totalQuestions = 0;
let currentQuestion = 1;
let isReviewMode = false;
let timerInterval;
let timeInSeconds = 45 * 60;

const STORAGE_KEYS = {
  currentQuestion: "currentQuestion",
  currentTime: "currentTime",
  testSession: "testSession",
  isSubmited: "isSubmited",
  resultSession: "resultSession",
};

let btnQuit,
  btnReset,
  btnMenuToggle,
  btnBackToResult,
  btnReview,
  btnSubmit,
  btnCheckAnswer,
  btnFinish,
  btnPrev,
  btnNext;
let btnExit, btnExitFromResult, quizMainContent;
let name, className, school, examString;

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxJrs4tYEIGasSsjEcS4bMg3A7HZOyT_ImOzBmJg3wqPTZ5fWPVrxBL7GfmWSlJxxkdUw/exec";

function setupExamString() {
  const exam = sessionStorage.getItem("selectedExam");
  examString = exam ? `Data/${exam}.json` : "Data/Quizzs.json";
}

function loadQuestionData({
  shuffleQuestions = false,
  shuffleOptions = false,
} = {}) {
  setupExamString();
  const savedSession = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.testSession) || "{}",
  );
  const hasSavedSession = Object.keys(savedSession).length > 0;

  fetch(examString)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      questions = data;
      if (hasSavedSession) {
        shuffleQuestions = false;
      }
      if (shuffleQuestions) {
        questions = shuffle(questions);
      }
      if (shuffleOptions) {
        questions.forEach((q) => {
          if (q.options) {
            q.options = shuffle(q.options);
          }
        });
      }
      totalQuestions = questions.length;
      startQuiz();
    })
    .catch((err) => {
      console.error("Lỗi khi tải .json:", err);
      alert(
        "Không thể tải dữ liệu câu hỏi. Vui lòng kiểm tra Console (F12) và đảm bảo bạn đang chạy qua Live Server.",
      );
    });
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderQuestions() {
  if (!quizMainContent) return;
  quizMainContent
    .querySelectorAll(".question-container")
    .forEach((el) => el.remove());

  questions.forEach((q, idx) => {
    const container = document.createElement("div");
    container.className = "question-container" + (idx === 0 ? " active" : "");
    container.id = `qContainer${q.id}`;
    container.dataset.type = q.type;
    container.dataset.originalIndex = idx;

    let inner = `<div class="question-text">${q.text}</div>`;
    if (q.image && q.type !== "hotspot") {
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
      default:
        inner += "<div>Loại câu hỏi không hỗ trợ.</div>";
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
  let html = `<div class="question-wrapper" data-qtype="single" data-qid="${q.id}">`;
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
  html += "</ul>";
  html += "</div>";
  return html;
}

function renderMulti(q) {
  const inputName = `q${q.id}`;
  const correctSet = new Set(q.correct || []);
  let html = `<div class="question-wrapper" data-qtype="multi" data-qid="${q.id}">`;
  html += '<ul class="options-list">';
  q.options.forEach((opt, i) => {
    const letter = (i + 10).toString(36).toUpperCase();
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
  q.rows.forEach((row) => {
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

function renderDrag(q) {
  const colAItems = shuffle(q.items || [])
    .map(
      (item) => `
        <div class="drag-item" draggable="true" id="${q.type}-${q.id}-${item.id}" data-target="${q.type}-${q.id}-${item.target}" data-item-id="${item.id}">
            ${item.label}
        </div>`,
    )
    .join("");

  const colBZones = (q.zones || [])
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
  const zones = (q.zones || [])
    .map(
      (z) => `
        <div class="hotspot-zone" 
            id="hz_${z.id}"
            data-id="${z.id}"
            data-correct="${z.correct}"
            style="left:${z.x}%; top:${z.y}%; width:${z.width}%; height:${z.height}%;">
        </div>`,
    )
    .join("");

  return `
        <div class="hotspot-wrapper" data-qtype="hotspot" data-qid="${q.id}">
            <img src="${q.image}" class="hotspot-img" data-qid="${q.id}">
            <div class="hotspot-overlay">
                ${zones}
            </div>
        </div>`;
}

function bindDragDrop() {
  let draggedElement = null;
  let sourceContainerId = null;
  let lastValidDropZone = null;

  function highlightDropZone(zone, highlight = true) {
    if (!zone) return;
    zone.classList.toggle("over", highlight);
  }

  document.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      if (!draggedElement) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      highlightDropZone(zone, true);
    });

    zone.addEventListener("dragleave", () => {
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
      saveCurrentQuestionAnswer();
      updateProgressBar(true);
    });
  });

  document.querySelectorAll(".drag-item").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
      if (isReviewMode) {
        e.preventDefault();
        return;
      }
      draggedElement = e.target.closest(".drag-item");
      const qContainer = draggedElement.closest(".question-container");
      sourceContainerId = qContainer ? qContainer.id : null;
      draggedElement.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedElement.id);
    });

    item.addEventListener("dragend", () => {
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
        e.preventDefault();
        draggedElement = e.target.closest(".drag-item");
        if (!draggedElement) return;
        const qContainer = draggedElement.closest(".question-container");
        sourceContainerId = qContainer ? qContainer.id : null;
        draggedElement.classList.add("dragging");
        const rect = draggedElement.getBoundingClientRect();
        draggedElement.style.width = `${rect.width}px`;
        draggedElement.style.height = `${rect.height}px`;
        lastValidDropZone = null;
      },
      { passive: false },
    );

    item.addEventListener(
      "touchmove",
      (e) => {
        if (!draggedElement) return;
        e.preventDefault();
        const touch = e.touches[0];
        const detectY = touch.clientY + draggedElement.offsetHeight / 2;
        draggedElement.style.position = "fixed";
        draggedElement.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
        draggedElement.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;
        draggedElement.style.zIndex = "1000";
        draggedElement.style.pointerEvents = "none";
        const target = document.elementFromPoint(touch.clientX, detectY);
        const dropZone = target ? target.closest(".drop-zone") : null;
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
      const touch = e.changedTouches[0];
      const detectY = touch.clientY + draggedElement.offsetHeight / 2;
      const target = document.elementFromPoint(touch.clientX, detectY);
      draggedElement.style.position = "";
      draggedElement.style.left = "";
      draggedElement.style.top = "";
      draggedElement.style.zIndex = "";
      draggedElement.style.pointerEvents = "";
      draggedElement.classList.remove("dragging");
      highlightDropZone(lastValidDropZone, false);
      lastValidDropZone = null;

      if (target) {
        const dropZone = target.closest(".drop-zone");
        if (dropZone) {
          const targetContainer = dropZone.closest(".question-container");
          if (targetContainer && targetContainer.id === sourceContainerId) {
            const currentQId = sourceContainerId.replace("qContainer", "");
            const colA = document.getElementById(`colA_${currentQId}`);
            if (
              dropZone.children.length > 0 &&
              dropZone.children[0] !== draggedElement
            ) {
              if (colA) {
                colA.appendChild(dropZone.children[0]);
              }
            }
            if (dropZone.innerText.trim() === "Thả vào đây") {
              dropZone.innerText = "";
            }
            dropZone.appendChild(draggedElement);
            saveCurrentQuestionAnswer();
            updateProgressBar(true);
          }
        }
      }

      draggedElement = null;
      sourceContainerId = null;
    });
  });
}

function bindHotspot() {
  document.querySelectorAll(".hotspot-zone").forEach((zone) => {
    zone.addEventListener("click", () => {
      if (isReviewMode) return;
      const container = zone.closest(".question-container");
      container
        ?.querySelectorAll(".hotspot-zone")
        .forEach((z) => z.classList.remove("selected"));
      zone.classList.add("selected");
      saveCurrentQuestionAnswer();
      updateProgressBar(true);
    });
  });

  document.querySelectorAll(".hotspot-wrapper").forEach((wrapper) => {
    const overlay = wrapper.querySelector(".hotspot-overlay");
    overlay?.addEventListener("click", (e) => {
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

function isQuestionAnswered(container) {
  if (!container) return false;
  if (container.classList.contains("training-checked")) return true;
  if (container.querySelectorAll("input:checked").length > 0) return true;
  if (
    Array.from(container.querySelectorAll(".drop-zone")).some(
      (zone) => zone.children.length > 0,
    )
  )
    return true;
  if (container.querySelector(".hotspot-zone.selected")) return true;
  return false;
}

function isQuestionWrongInTraining(container) {
  return Boolean(container?.querySelector(".training-feedback.incorrect"));
}

function buildMenuGrid() {
  const grid = document.getElementById("menuGridBlock");
  if (!grid) return;
  grid.innerHTML = "";
  const results = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.resultSession) || "{}",
  );

  questions.forEach((q, idx) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "menu-grid-item";
    item.textContent = String(idx + 1);

    if (idx + 1 === currentQuestion) {
      item.classList.add("active-current");
    }

    const container = document.getElementById(`qContainer${q.id}`);
    if (isQuestionAnswered(container)) {
      item.classList.add("answered");
    }

    const savedResult = results[q.id];
    if (savedResult) {
      if (savedResult.correct === false) {
        item.classList.add("wrong");
      } else if (savedResult.correct === true) {
        item.classList.add("answered");
      }
    } else if (isQuestionWrongInTraining(container)) {
      item.classList.add("wrong");
      item.classList.add("answered");
    }

    item.addEventListener("click", () => {
      saveCurrentQuestionAnswer();
      currentQuestion = idx + 1;
      saveCurrentQuestion();
      updateQuestionUI();
      closeMenuModal();
    });
    grid.appendChild(item);
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? "0" + mins : mins}:${secs < 10 ? "0" + secs : secs}`;
}

function showScreen(screenId) {
  document.getElementById("menuModal")?.classList.remove("active");
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId)?.classList.add("active");
}

function toggleMenuModal() {
  const modal = document.getElementById("menuModal");
  if (!modal) return;
  if (modal.classList.contains("active")) {
    modal.classList.remove("active");
  } else {
    buildMenuGrid();
    modal.classList.add("active");
  }
}

function closeMenuModal() {
  document.getElementById("menuModal")?.classList.remove("active");
}

function getAnsweredQuestionCount() {
  return questions.filter((q) => {
    const container = document.getElementById(`qContainer${q.id}`);
    if (!container) return false;

    switch (q.type) {
      case "single":
      case "multi":
        return Boolean(container.querySelector("input:checked"));
      case "tf":
        return Array.from(container.querySelectorAll("tbody tr")).every((row) =>
          Boolean(row.querySelector("input:checked")),
        );
      case "drag":
        return Array.from(container.querySelectorAll(".drop-zone")).some(
          (zone) => zone.children.length > 0,
        );
      case "hotspot":
        return Boolean(container.querySelector(".hotspot-zone.selected"));
      default:
        return false;
    }
  }).length;
}

function updateProgressBar(useAnsweredCount = false) {
  const bar = document.querySelector(".progress-bar");
  if (!bar || totalQuestions === 0) return;
  const value = useAnsweredCount ? getAnsweredQuestionCount() : currentQuestion;
  const percent = Math.round((value / totalQuestions) * 100);
  bar.style.width = `${percent}%`;
  bar.setAttribute("aria-valuenow", percent);
}

function resetCurrentQuestion() {
  if (isReviewMode) return;
  const currentQ = questions[currentQuestion - 1];
  if (!currentQ) return;
  const container = document.getElementById(`qContainer${currentQ.id}`);
  if (!container) return;

  container.querySelectorAll("input").forEach((input) => {
    if (input.type === "radio" || input.type === "checkbox") {
      input.checked = false;
    }
  });

  if (currentQ.type === "drag") {
    const colA = document.getElementById(`colA_${currentQ.id}`);
    container.querySelectorAll(".drag-item").forEach((item) => {
      colA?.appendChild(item);
    });
    container.querySelectorAll(".drop-zone").forEach((zone) => {
      zone.innerText = "Thả vào đây";
      zone.classList.remove("correct-ans", "wrong-ans");
    });
  }

  if (currentQ.type === "hotspot") {
    container.querySelectorAll(".hotspot-zone").forEach((zone) => {
      zone.classList.remove("selected");
    });
    container
      .querySelectorAll(".hotspot-marker")
      .forEach((marker) => marker.remove());
  }
}

function resetAllAnswers() {
  if (!quizMainContent) return;
  quizMainContent.querySelectorAll("input").forEach((input) => {
    if (input.type === "radio" || input.type === "checkbox") {
      input.checked = false;
    }
  });
  quizMainContent.querySelectorAll("li, tr").forEach((el) => {
    el.classList.remove(
      "correct-ans",
      "wrong-ans",
      "missed-ans",
      "selected",
      "training-checked",
    );
  });
  questions
    .filter((q) => q.type === "drag")
    .forEach((q) => {
      const container = document.getElementById(`qContainer${q.id}`);
      const colA = document.getElementById(`colA_${q.id}`);
      if (!container || !colA) return;
      container.querySelectorAll(".drag-item").forEach((item) => {
        item.style.display = "block";
        colA.appendChild(item);
      });
      container.querySelectorAll(".drop-zone").forEach((zone) => {
        zone.innerText = "Thả vào đây";
        zone.classList.remove("correct-ans", "wrong-ans");
      });
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

function resultMenuBtn(id, result) {
  const sessionData = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.resultSession) || "{}",
  );
  sessionData[id] = { correct: result };
  localStorage.setItem(STORAGE_KEYS.resultSession, JSON.stringify(sessionData));
}

function gradeSingle(q) {
  const container = document.getElementById(`qContainer${q.id}`);
  if (!container) return false;
  const checked = container.querySelector(`input[name="q${q.id}"]:checked`);
  container.querySelectorAll("li").forEach((li) => {
    const val = li.getAttribute("data-ans");
    const isChecked = checked && checked.value === val;
    const isCorrect = val === q.correct;
    li.classList.remove("correct-ans", "wrong-ans", "missed-ans");
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
  const container = document.getElementById(`qContainer${q.id}`);
  if (!container) return false;
  const correctSet = new Set(q.correct || []);
  let allCorrect = true;
  container.querySelectorAll("li").forEach((li) => {
    const val = li.getAttribute("data-ans");
    const cb = li.querySelector('input[type="checkbox"]');
    const isChecked = cb && cb.checked;
    const isCorrect = correctSet.has(val);
    li.classList.remove("correct-ans", "wrong-ans", "missed-ans");
    if (isCorrect && isChecked) {
      li.classList.add("correct-ans");
    } else if (isCorrect && !isChecked) {
      li.classList.add("missed-ans");
      allCorrect = false;
    } else if (!isCorrect && isChecked) {
      li.classList.add("wrong-ans");
      allCorrect = false;
    }
    if (!isChecked && isCorrect) {
      allCorrect = false;
    }
  });
  return allCorrect;
}

function gradeTF(q) {
  const container = document.getElementById(`qContainer${q.id}`);
  if (!container) return false;
  let allCorrect = true;
  container.querySelectorAll("tbody tr").forEach((row) => {
    const corr = row.getAttribute("data-correct");
    const userSel = row.querySelector("input:checked");
    row.classList.remove("correct-ans", "wrong-ans", "missed-ans");
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
    container.querySelector(`input[name="${row.name}"]:checked`),
  );
  return allCorrect && allAnswered;
}

function gradeDrag(q) {
  const container = document.getElementById(`qContainer${q.id}`);
  if (!container) return false;
  let allCorrect = true;
  container.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.classList.remove("correct-ans", "wrong-ans");
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
  if (!container) return false;
  const selected = container.querySelector(".hotspot-zone.selected");
  const isCorrect = selected?.dataset.correct === "true";
  container.querySelectorAll(".hotspot-zone").forEach((z) => {
    if (z.dataset.correct === "true") {
      z.style.background = "rgba(76, 175, 80, 0.5)";
      z.style.borderColor = "#4CAF50";
    } else {
      z.style.background = "";
      z.style.borderColor = "";
    }
  });
  if (selected && !isCorrect) {
    selected.style.background = "rgba(244, 67, 54, 0.5)";
    selected.style.borderColor = "#f44336";
  }
  return Boolean(selected && isCorrect);
}

function backToResult() {
  showScreen("screenResult");
}

function exitToHome() {
  sessionStorage.removeItem("selectedExam");
  localStorage.removeItem(STORAGE_KEYS.currentQuestion);
  localStorage.removeItem(STORAGE_KEYS.testSession);
  localStorage.removeItem(STORAGE_KEYS.isSubmited);
  localStorage.removeItem(STORAGE_KEYS.currentTime);
  window.location.href = "index.html";
}

function saveRewardToStudent(
  studentName,
  studentClass,
  rewardPoints,
  correctCount,
  totalCount,
  schoolname,
) {
  if (!schoolname) {
    console.error("✗ Error: School name not found in sessionStorage");
    return;
  }

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "saveReward",
      hoten: studentName,
      lop: studentClass,
      reward: rewardPoints,
      correctCount,
      totalCount,
      timestamp: new Date().toISOString(),
      truong: schoolname,
    }),
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.success) {
        console.log("✓ Reward saved successfully!");
      } else {
        console.error("✗ Failed to save reward:", response.error);
      }
    })
    .catch((err) => {
      console.error("✗ Error saving reward:", err);
    });
}

function saveCurrentQuestion() {
  localStorage.setItem(
    STORAGE_KEYS.currentQuestion,
    currentQuestion.toString(),
  );
  localStorage.setItem(
    "currentTime",
    document.getElementById("countdown")?.innerText || "",
  );
}

function loadCurrentQuestion() {
  const saved = localStorage.getItem(STORAGE_KEYS.currentQuestion);
  if (saved) {
    currentQuestion = parseInt(saved, 10) || 1;
  }
}

function loadCurrentTime() {
  const savedTime = localStorage.getItem("currentTime");
  if (!savedTime) return;
  const parts = savedTime.split(":");
  if (parts.length !== 2) return;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (!Number.isNaN(mins) && !Number.isNaN(secs)) {
    timeInSeconds = mins * 60 + secs;
    document.getElementById("countdown").innerText = savedTime;
  }
}

function updateTimerDisplay() {
  const countdown = document.getElementById("countdown");
  if (!countdown) return;
  countdown.innerText = formatTime(timeInSeconds);
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    if (timeInSeconds <= 0) {
      clearInterval(timerInterval);
      timeInSeconds = 0;
      updateTimerDisplay();
      return;
    }
    timeInSeconds -= 1;
    updateTimerDisplay();
  }, 1000);
}

function saveCurrentQuestionAnswer() {
  const container = document.querySelector(".question-container.active");
  if (!container || localStorage.getItem(STORAGE_KEYS.isSubmited) === "true")
    return;

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
      answer = {};
      let allAnswered = true;
      container.querySelectorAll("tbody tr").forEach((row) => {
        const rowName = row.dataset.rowName;
        const selected = row.querySelector(`input[name="${rowName}"]:checked`);
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
      answer = {};
      const allItems = container.querySelectorAll(".drag-item");
      allItems.forEach((item) => {
        const parentZone = item.closest(".drop-zone");
        if (parentZone) {
          answer[item.dataset.itemId] = parentZone.dataset.zoneId;
        }
      });
      if (
        allItems.length > 0 &&
        Object.keys(answer).length === allItems.length
      ) {
        answered = true;
      }
      break;
    }
    case "hotspot": {
      const selected = container.querySelector(".hotspot-zone.selected");
      if (selected) {
        answer = { selected: selected.dataset.id };
        answered = true;
      }
      break;
    }
  }

  const sessionData = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.testSession) || "{}",
  );
  sessionData[qid] = {
    type: qtype,
    answered,
    answer,
    timestamp: Date.now(),
  };
  localStorage.setItem(STORAGE_KEYS.testSession, JSON.stringify(sessionData));
}

function loadQuestionAnswer(qid) {
  const container = document.getElementById(`qContainer${qid}`);
  if (!container) return;
  const sessionData = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.testSession) || "{}",
  );
  const savedAnswer = sessionData[qid];
  if (!savedAnswer || !savedAnswer.answered) return;

  const qtype = container.dataset.type;
  const answer = savedAnswer.answer;

  switch (qtype) {
    case "single": {
      if (typeof answer === "string") {
        const input = container.querySelector(
          `input[name="q${qid}"][value="${answer}"]`,
        );
        if (input) input.checked = true;
      }
      break;
    }
    case "multi": {
      if (Array.isArray(answer)) {
        answer.forEach((value) => {
          const input = container.querySelector(
            `input[name="q${qid}"][value="${value}"]`,
          );
          if (input) input.checked = true;
        });
      }
      break;
    }
    case "tf": {
      if (answer && typeof answer === "object") {
        Object.entries(answer).forEach(([rowName, value]) => {
          const input = container.querySelector(
            `input[name="${rowName}"][value="${value}"]`,
          );
          if (input) input.checked = true;
        });
      }
      break;
    }
    case "drag": {
      if (answer && typeof answer === "object") {
        Object.entries(answer).forEach(([itemId, zoneId]) => {
          const item = container.querySelector(
            `.drag-item[data-item-id="${itemId}"]`,
          );
          const zone = container.querySelector(
            `.drop-zone[data-zone-id="${zoneId}"]`,
          );
          if (item && zone) {
            if (zone.innerText.trim() === "Thả vào đây") {
              zone.innerText = "";
            }
            zone.appendChild(item);
          }
        });
      }
      break;
    }
    case "hotspot": {
      if (answer && answer.selected) {
        container
          .querySelectorAll(".hotspot-zone")
          .forEach((z) => z.classList.remove("selected"));
        const selectedZone = container.querySelector(
          `.hotspot-zone[data-id="${answer.selected}"]`,
        );
        if (selectedZone) {
          selectedZone.classList.add("selected");
        }
      }
      break;
    }
  }
}
