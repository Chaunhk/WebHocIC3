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

  btnReset?.addEventListener("click", resetCurrentQuestion);
  btnMenuToggle?.addEventListener("click", toggleMenuModal);
  btnCheckAnswer?.addEventListener("click", checkAnswer);
  btnFinish?.addEventListener("click", finishTraining);
  btnBackToResult?.addEventListener("click", backToResult);
  btnReview?.addEventListener("click", reviewQuiz);
  btnExit?.addEventListener("click", exitToHome);
  btnExitFromResult?.addEventListener("click", exitToHome);
  btnQuit?.addEventListener("click", exitToHome);
  document
    .getElementById("menuModalClose")
    ?.addEventListener("click", closeMenuModal);

  loadQuestionData({ shuffleQuestions: false, shuffleOptions: false });
});

function startQuiz() {
  isReviewMode = false;
  currentQuestion = 1;

  quizMainContent?.classList.remove("review-mode");
  if (btnCheckAnswer) btnCheckAnswer.style.display = "block";
  if (btnFinish) btnFinish.style.display = "block";
  if (btnReset) btnReset.style.display = "block";
  if (btnBackToResult) btnBackToResult.style.display = "none";

  renderQuestions();
  resetAllAnswers();
  updateQuestionUI();
  showScreen("screenQuiz");
}

function updateQuestionUI() {
  document.getElementById("questionCounter").innerText =
    `Câu ${currentQuestion} / ${totalQuestions}`;

  document.querySelectorAll(".question-container").forEach((c) => {
    c.classList.remove("active");
    c.querySelectorAll(".drag-item").forEach((item) => {
      item.style.display = "none";
    });
  });

  const currentQ = questions[currentQuestion - 1];
  const currentContainer = currentQ
    ? document.getElementById(`qContainer${currentQ.id}`)
    : null;

  if (currentContainer) {
    currentContainer.classList.add("active");
    currentContainer.querySelectorAll(".drag-item").forEach((item) => {
      item.style.display = "block";
    });
    loadQuestionAnswer(currentQ.id);
  }

  updateProgressBar();
  updateCheckButtonState();
}

function checkAnswer() {
  const currentQ = questions[currentQuestion - 1];
  if (!currentQ) return;

  const container = document.getElementById(`qContainer${currentQ.id}`);
  if (!container) return;

  if (container.classList.contains("training-checked")) {
    alert("Bạn đã kiểm tra câu này rồi!");
    return;
  }

  const isCorrect = gradeQuestion(currentQ);
  let feedbackEl = container.querySelector(".training-feedback");
  if (!feedbackEl) {
    feedbackEl = createFeedbackElement();
    container.appendChild(feedbackEl);
  }

  feedbackEl.className = isCorrect
    ? "training-feedback correct"
    : "training-feedback incorrect";
  feedbackEl.innerHTML = isCorrect
    ? '<div class="feedback-text">✓ Đúng rồi!</div>'
    : '<div class="feedback-text">✗ Sai rồi. Xem lại bài để biết đáp án đúng!</div>';

  lockAnswer(currentQ);
  container.classList.add("training-checked");
  updateProgressBar();
  showNextButton();
}

function showNextButton() {
  const isLastQuestion = currentQuestion === totalQuestions;
  if (btnCheckAnswer) btnCheckAnswer.style.display = "none";

  if (isLastQuestion) {
    if (btnFinish) btnFinish.style.display = "block";
    return;
  }

  let nextButton = document.querySelector(".btn-next-question");
  if (!nextButton) {
    nextButton = createNextButton();
  }
  nextButton.style.display = "block";
}

function createNextButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-btn btn-dark btn btn-sm btn-secondary btn-next-question";
  btn.innerHTML =
    '<span class="d-none d-md-inline">Câu kế tiếp</span><span class="d-inline d-md-none">›</span>';
  btn.addEventListener("click", goToNextQuestion);

  const navContainer = document.querySelector(".right-nav.gap-1");
  navContainer?.appendChild(btn);
  return btn;
}

function goToNextQuestion() {
  currentQuestion = Math.min(totalQuestions, currentQuestion + 1);
  updateQuestionUI();
  const btnNext = document.querySelector(".btn-next-question");
  if (btnNext) btnNext.style.display = "none";
  if (btnCheckAnswer) btnCheckAnswer.style.display = "block";
}

function createFeedbackElement() {
  const div = document.createElement("div");
  div.className = "training-feedback";
  return div;
}

function lockAnswer(q) {
  const container = document.getElementById(`qContainer${q.id}`);
  if (!container) return;
  switch (q.type) {
    case "single":
    case "multi":
      container
        .querySelectorAll("input[type=radio], input[type=checkbox]")
        .forEach((input) => {
          input.disabled = true;
        });
      break;
    case "tf":
      container.querySelectorAll("input[type=radio]").forEach((input) => {
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
  const currentQ = questions[currentQuestion - 1];
  if (!currentQ) return;
  const container = document.getElementById(`qContainer${currentQ.id}`);
  const isChecked = container?.classList.contains("training-checked");
  if (btnCheckAnswer) {
    btnCheckAnswer.disabled = Boolean(isChecked);
    btnCheckAnswer.textContent = isChecked ? "Đã kiểm tra" : "Kiểm tra đáp án";
  }

  if (currentQuestion !== totalQuestions) {
    if (btnFinish) btnFinish.style.display = "none";
  }

  const btnNext = document.querySelector(".btn-next-question");
  if (btnNext) btnNext.style.display = "none";
}

function finishTraining() {
  if (!confirm("Bạn chắc chắn muốn hoàn thành luyện tập?")) {
    return;
  }

  clearInterval(timerInterval);
  let correctCount = 0;

  questions.forEach((q) => {
    const container = document.getElementById(`qContainer${q.id}`);
    if (container?.classList.contains("training-checked")) {
      const feedback = container.querySelector(".training-feedback");
      if (feedback?.classList.contains("correct")) {
        correctCount += 1;
      }
    }
  });

  document.getElementById("scoreText").innerText =
    `${correctCount} / ${totalQuestions} Câu Đúng\nHoàn thành luyện tập!`;

  showScreen("screenResult");
}

function reviewQuiz() {
  isReviewMode = true;
  quizMainContent?.classList.add("review-mode");
  if (btnCheckAnswer) btnCheckAnswer.style.display = "none";
  if (btnFinish) btnFinish.style.display = "none";
  if (btnReset) btnReset.style.display = "none";
  if (btnBackToResult) btnBackToResult.style.display = "block";

  const btnNext = document.querySelector(".btn-next-question");
  if (btnNext) btnNext.remove();

  currentQuestion = 1;
  updateQuestionUI();
  showScreen("screenQuiz");
}
