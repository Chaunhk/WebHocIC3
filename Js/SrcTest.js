/* ════════════════════════════════
   STATE
════════════════════════════════ */
let questions = []; // dữ liệu load từ JSON
let totalQuestions = 0;
let currentQuestion = 1;
let isReviewMode = false;
let timerInterval;
let timeInSeconds = 45 * 60;
let btnQuit, btnReset, btnMenuToggle, btnSubmit, btnPrev, btnNext;
let btnBackToResult, btnReview, btnExit, btnExitFromResult, quizMainContent;
let name, className, school;
let examString;
/* ════════════════════════════════
   API CONFIGURATION
════════════════════════════════ */
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxJrs4tYEIGasSsjEcS4bMg3A7HZOyT_ImOzBmJg3wqPTZ5fWPVrxBL7GfmWSlJxxkdUw/exec";
/* ════════════════════════════════
   DOM REFS
════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  if (
    sessionStorage.getItem("auth") !== "true" ||
    !sessionStorage.getItem("quiz_userName") ||
    !sessionStorage.getItem("quiz_userClass")
  ) {
    exitToHome();
    return;
  }

  //console.log(localStorage.getItem("isSubmited"));
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
  const exam = sessionStorage.getItem("selectedExam");
  if (exam != null) {
    examString = "Data/" + exam + ".json";
    console.log(examString);
  } else examString = "Data/Quizzs.json";

  btnReset.addEventListener("click", resetCurrentQuestion);
  btnMenuToggle.addEventListener("click", toggleMenuModal);
  btnSubmit.addEventListener("click", submitQuiz);
  btnPrev.addEventListener("click", () => changeQuestion(-1));
  btnNext.addEventListener("click", () => changeQuestion(1));
  btnBackToResult.addEventListener("click", backToResult);
  document.getElementById("btnReview").addEventListener("click", reviewQuiz);
  btnExit.addEventListener("click", exitToHome);
  btnExitFromResult.addEventListener("click", exitToHome);
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
      //đảo câu hỏi
      // for (let i = questions.length - 1; i > 0; i--) {
      //   const j = Math.floor(Math.random() * (i + 1));
      //   [questions[i], questions[j]] = [questions[j], questions[i]];
      // }
      //đảo đáp án
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

/* ════════════════════════════════
   RENDER CÂU HỎI ĐỘNG
════════════════════════════════ */

/** Tạo toàn bộ question-container cho mọi câu rồi chèn vào DOM */
function renderQuestions() {
  // Xóa các container câu hỏi cũ (giữ lại nút btnReset)
  quizMainContent
    .querySelectorAll(".question-container")
    .forEach((el) => el.remove());

  questions.forEach((q, idx) => {
    const container = document.createElement("div");
    container.className = "question-container" + (idx === 0 ? " active" : "");
    container.id = `qContainer${q.id}`;
    container.dataset.type = q.type;

    let inner = `<div class="question-text">${q.text}</div>`;

    // Hình ảnh (nếu có) hay bỏ hình nếu là dạng chọn trên hình ảnh
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

  // Gắn drag-drop sau khi render xong
  bindDragDrop();
}

/* ── Dạng chọn MỘT đáp án ── */
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

/* ── Dạng chọn NHIỀU đáp án ── */
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

/* ── Dạng ĐÚNG / SAI ── */
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

    // Xóa bỏ biến checked cũ tại đây, giao việc check cho hàm fillHidden dưới đây làm
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
  // Bọc vào setTimeout để đẩy logic này chạy bất đồng bộ ngay sau khi DOM hoàn tất render
  setTimeout(() => {
    // Tìm container chứa câu hỏi hiện tại
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
            // 1. Ép hiển thị dấu tích xanh trên màn hình (Đảm bảo 100%)
            targetRadio.checked = true;

            // 2. Kích hoạt sự kiện change báo hiệu hệ thống ghi nhận "Đã trả lời"
            const event = new Event("change", { bubbles: true });
            targetRadio.dispatchEvent(event);
          }
        }
      }
    });
  }, 0);
}
/* ── Dạng KÉO THẢ ── */
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
   DRAG & DROP
════════════════════════════════ */

/**
 * ════════════════════════════════════════════════════════════
 * DRAG-DROP WITH AUTO-SCROLL (Desktop + Mobile)
 * Fixed: Desktop drag-drop now works + Mobile touch works
 * ════════════════════════════════════════════════════════════
 */

function bindDragDrop() {
  let draggedElement = null;
  let sourceContainerId = null;
  let lastValidDropZone = null;

  function getDropZoneFromPoint(x, y) {
    if (!draggedElement) return null;

    // Temporarily hide dragged element so elementFromPoint works
    const originalDisplay = draggedElement.style.display;
    draggedElement.style.display = "none";
    const el = document.elementFromPoint(x, y);
    draggedElement.style.display = originalDisplay;

    return el ? el.closest(".drop-zone") : null;
  }

  /**
   * Visual feedback for drop zone
   */
  function highlightDropZone(zone, highlight = true) {
    if (!zone) return;
    if (highlight) {
      zone.classList.add("over");
    } else {
      zone.classList.remove("over");
    }
  }

  document.querySelectorAll(".drag-item").forEach((item) => {
    // ════════════════════════════════════════════════════════
    // DESKTOP DRAG-DROP (Mouse)
    // ════════════════════════════════════════════════════════

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

    // ════════════════════════════════════════════════════════
    // DESKTOP DROP ZONES (Mouse)
    // ════════════════════════════════════════════════════════

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

        // Move existing item back to colA if drop zone has one
        if (
          target.children.length > 0 &&
          target.children[0] !== draggedElement
        ) {
          if (colA) {
            colA.appendChild(target.children[0]);
            console.log("✓ Moved existing item back to colA");
          }
        }

        // Clear placeholder text
        if (target.innerText.trim() === "Thả vào đây") {
          target.innerText = "";
        }

        // Drop item
        target.appendChild(draggedElement);
        draggedElement.classList.remove("dragging");
        console.log("✓ Item dropped successfully (desktop)");

        draggedElement = null;
        sourceContainerId = null;
      });
    });

    // ════════════════════════════════════════════════════════
    // MOBILE TOUCH (Touch Events)
    // ════════════════════════════════════════════════════════

    item.addEventListener(
      "touchstart",
      (e) => {
        if (isReviewMode) return;

        draggedElement = e.target.closest(".drag-item");
        if (!draggedElement) return;

        const qContainer = draggedElement.closest(".question-container");
        sourceContainerId = qContainer ? qContainer.id : null;
        draggedElement.classList.add("dragging");

        // Lock the size before positioning
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
        e.preventDefault(); // Prevent page scroll while dragging

        const touch = e.touches[0];
        const touchY = touch.clientY;
        const windowHeight = window.innerHeight;

        // Update dragged element position
        draggedElement.style.position = "fixed";
        draggedElement.style.left = `${touch.clientX - draggedElement.offsetWidth / 2}px`;
        draggedElement.style.top = `${touch.clientY - draggedElement.offsetHeight / 2}px`;
        draggedElement.style.zIndex = 1000;
        draggedElement.style.pointerEvents = "none";

        // ⭐ AUTO-SCROLL
        AutoScroll.handleScroll(touchY, windowHeight);

        // ⭐ HIGHLIGHT DROP ZONE
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

      // Stop auto-scroll
      AutoScroll.stop();

      // Clear highlight
      highlightDropZone(lastValidDropZone, false);
      lastValidDropZone = null;

      const touch = e.changedTouches[0];

      // Better drop zone detection - check below the drag item
      const detectY = touch.clientY + draggedElement.offsetHeight / 2;
      const target = getDropZoneFromPoint(touch.clientX, detectY);

      // Reset styles
      draggedElement.style.position = "";
      draggedElement.style.left = "";
      draggedElement.style.top = "";
      draggedElement.style.zIndex = "";
      draggedElement.style.pointerEvents = "";
      draggedElement.style.width = "";
      draggedElement.style.height = "";
      draggedElement.classList.remove("dragging");

      // Process drop
      if (target) {
        const targetContainer = target.closest(".question-container");

        // Verify drop is in same question container
        if (!targetContainer || targetContainer.id !== sourceContainerId) {
          console.log("✗ Drop in wrong container");
          draggedElement = null;
          return;
        }

        const currentQId = sourceContainerId.replace("qContainer", "");
        const colA = document.getElementById(`colA_${currentQId}`);

        // Move existing item back to colA if drop zone has one
        if (
          target.children.length > 0 &&
          target.children[0] !== draggedElement
        ) {
          if (colA) {
            colA.appendChild(target.children[0]);
            console.log("✓ Moved existing item back to colA");
          }
        }

        // Clear placeholder text
        if (target.innerText.trim() === "Thả vào đây") {
          target.innerText = "";
        }

        // Drop item
        target.appendChild(draggedElement);
        console.log("✓ Item dropped successfully (mobile)");
      } else {
        // Dropped outside any zone — return to colA
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

    // Chặn tuyệt đối không cho kéo thả phần tử từ câu này sang câu khác
    const targetContainer = target.closest(".question-container");
    if (!targetContainer || targetContainer.id !== sourceContainerId) {
      console.warn("Không được kéo thả phần tử sang câu hỏi khác!");
      return;
    }

    // Tìm chính xác Cột A động của câu hỏi hiện tại (Ví dụ: colA_1, colA_6...)
    const currentQId = sourceContainerId.replace("qContainer", "");
    const colA = document.getElementById(`colA_${currentQId}`);

    // Nếu ô đích đã có sẵn thẻ khác -> Đẩy thẻ cũ về đúng Cột A của câu hỏi đó
    if (target.children.length > 0 && target.children[0] !== draggedElement) {
      if (colA) {
        colA.appendChild(target.children[0]);
      }
    }

    // Xóa chữ hướng dẫn mặc định và gắn thẻ mới vào ô thả
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

      // Deselect all zones in same question
      const container = zone.closest(".question-container");
      container.querySelectorAll(".hotspot-zone").forEach((z) => {
        z.classList.remove("selected");
      });

      // Select clicked zone
      zone.classList.add("selected");
    });
  });
  document.querySelectorAll(".hotspot-wrapper").forEach((wrapper) => {
    const overlay = wrapper.querySelector(".hotspot-overlay");
    const qContainer = wrapper.closest(".question-container");

    overlay.addEventListener("click", (e) => {
      if (isReviewMode) return;

      const rect = overlay.getBoundingClientRect();

      // Calculate % position relative to overlay
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

      // Remove old marker in this question
      overlay.querySelectorAll(".hotspot-marker").forEach((m) => m.remove());

      // Create new marker
      const marker = document.createElement("div");
      marker.className = "hotspot-marker";
      marker.style.left = xPercent + "%";
      marker.style.top = yPercent + "%";
      overlay.appendChild(marker);

      // Store click position on the wrapper for grading
      wrapper.dataset.clickX = xPercent;
      wrapper.dataset.clickY = yPercent;
    });
  });
}
/* ════════════════════════════════
   CHUYỂN ĐỔI MÀN HÌNH
════════════════════════════════ */
function showScreen(screenId) {
  document.getElementById("menuModal").classList.remove("active");
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

/* ════════════════════════════════
   BẢNG MỤC LỤC POPUP VÀ PROGRESS BAR
════════════════════════════════ */
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

  // Load session data once
  const sessionData = JSON.parse(localStorage.getItem("testSession")) || {};
  const sessionResultData =
    JSON.parse(localStorage.getItem("resultSession")) || {};
  for (let i = 1; i <= totalQuestions; i++) {
    const btn = document.createElement("button");
    btn.className = "menu-item-btn";
    btn.id = `menuBtn${i}`;
    btn.innerText = i;

    // Check if answered
    if (localStorage.getItem("isSubmited") !== "true") {
      if (sessionData[i]?.answered) {
        btn.classList.add("answered"); // Visual indicator
      }
    } else {
      if (sessionResultData[i]?.correct) {
        btn.classList.add("answered");
      } else {
        btn.classList.add("wrong");
      }
    }

    if (i === currentQuestion) btn.classList.add("active-current");

    btn.addEventListener("click", () => {
      saveCurrentQuestionAnswer();
      currentQuestion = i;
      saveCurrentQuestion();
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
  const sessionData = JSON.parse(localStorage.getItem("testSession")) || {};

  // Count answered questions
  let answeredCount = 0;
  for (let i = 1; i <= totalQuestions; i++) {
    if (sessionData[i]?.answered) {
      answeredCount++;
    }
  }

  const progressPercent = (answeredCount / totalQuestions) * 100;
  const progressBar = document.querySelector(".progress-bar");
  const progressContainer = document.querySelector(".progress");

  // Update width with smooth animation
  progressBar.style.width = progressPercent + "%";

  // Update aria attributes
  progressContainer.setAttribute("aria-valuenow", Math.round(progressPercent));

  // All answered = success!
  if (answeredCount === totalQuestions) {
    progressContainer.classList.add("success");
    progressContainer.setAttribute("aria-label", "Success example");
    //progressBar.innerHTML = `<span class="progress-checkmark">✓</span>`;
  } else {
    progressContainer.classList.remove("success");
    progressContainer.setAttribute("aria-label", "Basic example");
    //progressBar.innerHTML = `<span class="progress-text">${answeredCount}/${totalQuestions}</span>`;
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

  document.getElementById("lbName").innerText = name;
  document.getElementById("lbClass").innerText = className;

  isReviewMode = false;
  currentQuestion = 1;

  quizMainContent.classList.remove("review-mode");
  btnSubmit.style.display = "block";
  btnReset.style.display = "block";
  btnBackToResult.style.display = "none";

  // Render câu hỏi từ JSON mỗi lần bắt đầu (đảm bảo reset sạch)
  loadCurrentQuestion();

  renderQuestions();
  bindHotspot();
  resetAllAnswers();

  timeInSeconds = 45 * 60;
  clearInterval(timerInterval);
  startTimer();

  updateQuestionUI();
  showScreen("screenQuiz");
  if (localStorage.getItem("isSubmited") === "true") submitQuiz();
}

/* ════════════════════════════════
   ĐỒNG HỒ ĐẾM NGƯỢC
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
   2. TRONG KHI LÀM BÀI
════════════════════════════════ */
function updateQuestionUI() {
  document.getElementById("questionCounter").innerText =
    `Câu ${currentQuestion}/${totalQuestions}`;

  // 1. Ẩn tất cả các container câu hỏi
  document.querySelectorAll(".question-container").forEach((c) => {
    c.classList.remove("active");
    // Ẩn tất cả các thẻ kéo thả thuộc câu hỏi này để tránh bị tràn sang câu khác
    c.querySelectorAll(".drag-item").forEach((item) => {
      item.style.display = "none";
    });
  });

  // 2. Kích hoạt container của câu hỏi hiện tại
  const _currentQ = questions[currentQuestion - 1];
  const currentContainer = _currentQ
    ? document.getElementById(`qContainer${_currentQ.id}`)
    : null;
  if (currentContainer) {
    currentContainer.classList.add("active");
    // Chỉ hiển thị các thẻ kéo thả thuộc riêng câu hỏi hiện tại này
    currentContainer.querySelectorAll(".drag-item").forEach((item) => {
      item.style.display = "block";
    });
  }

  // 3. Load saved answer if exists
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
function saveCurrentQuestionAnswer() {
  // Get active question container
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
      let allAnswered = true;

      dropZones.forEach((zone) => {
        const zoneId = zone.dataset.zoneId;
        const items = zone.querySelectorAll(".drag-item");

        items.forEach((item) => {
          const itemId = item.dataset.itemId;
          answer[itemId] = zoneId;
        });
      });

      // Check if all items are placed
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
        answer = {
          x: parseFloat(clickX),
          y: parseFloat(clickY),
        };
        answered = true;
      }
      break;
    }
  }

  // Save to localStorage
  const sessionKey = "testSession";
  let sessionData = JSON.parse(localStorage.getItem(sessionKey)) || {};

  sessionData[qid] = {
    type: qtype,
    answered: answered,
    answer: answer,
    timestamp: Date.now(),
  };

  localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  console.log(`✓ Saved Q${qid} (${qtype}):`, sessionData[qid]);
}
function loadQuestionAnswer(qid) {
  // Get saved data from localStorage
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
      // answer = { item1: "zone2", item2: "zone1" }
      Object.entries(answer).forEach(([itemId, zoneId]) => {
        const item = container.querySelector(`[data-item-id="${itemId}"]`);
        const zone = container.querySelector(`[data-zone-id="${zoneId}"]`);

        if (item && zone) {
          // Remove from colA if it's there
          const colA = container.querySelector('[id^="colA_"]');
          if (colA && item.parentElement === colA) {
            item.remove();
          }

          // Move to correct zone
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
        // Remove old marker if exists
        overlay.querySelectorAll(".hotspot-marker").forEach((m) => m.remove());

        // Create new marker at saved position
        const marker = document.createElement("div");
        marker.className = "hotspot-marker";
        marker.style.left = answer.x + "%";
        marker.style.top = answer.y + "%";
        overlay.appendChild(marker);

        // Find the HIGHEST LAYER zone (last in DOM) that contains this click
        const zones = container.querySelectorAll(".hotspot-zone");
        zones.forEach((z) => z.classList.remove("selected"));

        let topZone = null;

        // Check zones in reverse order (highest layer first)
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
            topZone = z;
            break;
          }
        }

        if (topZone) {
          topZone.classList.add("selected");
        }
      }
      break;
    }
  }
  console.log(`✓ Loaded Q${qid} answer:`, answer);
}
function resetCurrentQuestion() {
  if (isReviewMode) return;
  const _resetQ = questions[currentQuestion - 1];
  const container = _resetQ
    ? document.getElementById(`qContainer${_resetQ.id}`)
    : null;
  if (!container) return;
  container.querySelectorAll("input").forEach((i) => (i.checked = false));

  // Nếu là câu drag → trả tất cả item về colA
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

  // Khôi phục chính xác trạng thái kéo thả theo từng ID câu hỏi riêng biệt
  questions
    .filter((q) => q.type === "drag")
    .forEach((q) => {
      const container = document.getElementById(`qContainer${q.id}`);
      const colA = document.getElementById(`colA_${q.id}`); // Lấy chuẩn ID động colA_1, colA_6...
      if (colA && container) {
        container.querySelectorAll(".drag-item").forEach((item) => {
          item.style.display = "none"; // Ẩn mặc định, hàm updateQuestionUI sẽ mở lại sau
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
   3. CHẤM ĐIỂM ĐỘNG
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

function submitQuiz() {
  clearInterval(timerInterval);
  saveCurrentQuestionAnswer();
  for (let i = 1; i <= totalQuestions; i++) {
    loadQuestionAnswer(i);
  }
  let correctCount = 0;

  questions.forEach((q) => {
    const isCorrect = gradeQuestion(q);
    //console.log(document.getElementById(`menuBtn${q.id}`));
    resultMenuBtn(q.id, isCorrect);
    if (isCorrect) correctCount++;
  });

  const reward = (100 * correctCount) / totalQuestions;
  const roundedReward = Math.round(reward);
  document.getElementById("scoreText").innerText =
    `${correctCount} / ${totalQuestions} Câu Đúng \nBạn nhận được ${roundedReward} xu`;

  // Save reward to student data via API
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

/**
 * Save reward score to student's data in Google Sheets
 * ⭐ Now includes school name for multi-sheet support
 */
function saveRewardToStudent(
  studentName,
  studentClass,
  rewardPoints,
  correctCount,
  totalCount,
  schoolname,
) {
  // ⭐ Get school name from sessionStorage

  // ⭐ Validate school exists
  if (!schoolname) {
    console.error("✗ Error: School name not found in sessionStorage");
    console.log("Available in sessionStorage:", {
      userName: sessionStorage.getItem("quiz_userName").trim(),
      userClass: sessionStorage.getItem("quiz_userClass").trim(),
      userSchool: sessionStorage.getItem("quiz_userSchool").trim(),
      auth: sessionStorage.getItem("auth"),
    });
    return;
  }

  console.log("✓ Saving reward to school:", schoolname);

  fetch(APPS_SCRIPT_URL, {
    method: "POST",
    redirect: "follow",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "saveReward",
      hoten: studentName,
      lop: studentClass,
      reward: rewardPoints,
      correctCount: correctCount,
      totalCount: totalCount,
      timestamp: new Date().toISOString(),
      truong: schoolname, // ⭐ ADDED: Include school name for multi-sheet support
    }),
  })
    .then((res) => res.json())
    .then((response) => {
      if (response.success) {
        console.log("✓ Reward saved successfully!");
        console.log("Response:", response);
        if (response.data?.newCoin !== undefined) {
          console.log("New coin count:", response.data.newCoin);
        }
      } else {
        console.error(
          "✗ Failed to save reward:" + studentName + studentClass + schoolname,
          response.error,
        );
      }
    })
    .catch((err) => {
      console.error("✗ Error saving reward:", err);
    });
}

/** Chấm điểm + tô màu một câu, trả về true/false */
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
      // Highlight correct answer in blue by applying missed-ans to the correct cell
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
  // Tất cả rows phải có đáp án mới tính đúng
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

  // No answer selected
  if (!selected) return false;

  const isCorrect = selected.dataset.correct === "true";

  // Color feedback
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
/* ════════════════════════════════
   4. XEM LẠI / THOÁT
════════════════════════════════ */
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
  localStorage.removeItem("testSession");
  localStorage.removeItem("isSubmited");
  localStorage.removeItem("currentTime");
  window.location.href = "index.html";
}
function exitQuiz() {}
