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

  btnReset?.addEventListener("click", resetCurrentQuestion);
  btnMenuToggle?.addEventListener("click", toggleMenuModal);
  btnSubmit?.addEventListener("click", submitQuiz);
  btnPrev?.addEventListener("click", () => changeQuestion(-1));
  btnNext?.addEventListener("click", () => changeQuestion(1));
  btnBackToResult?.addEventListener("click", backToResult);
  btnReview?.addEventListener("click", reviewQuiz);
  btnExit?.addEventListener("click", exitToHome);
  btnExitFromResult?.addEventListener("click", exitToHome);
  btnQuit?.addEventListener("click", exitToHome);
  document
    .getElementById("menuModalClose")
    ?.addEventListener("click", closeMenuModal);

  loadQuestionData({ shuffleQuestions: true, shuffleOptions: true });
});

function startQuiz() {
  document.getElementById("lbName").innerText = name || "";
  document.getElementById("lbClass").innerText = className || "";

  isReviewMode = false;
  currentQuestion = 1;

  quizMainContent?.classList.remove("review-mode");
  if (btnSubmit) btnSubmit.style.display = "block";
  if (btnReset) btnReset.style.display = "block";
  if (btnBackToResult) btnBackToResult.style.display = "none";

  loadCurrentQuestion();
  loadCurrentTime();
  renderQuestions();
  resetAllAnswers();

  if (!timeInSeconds || timeInSeconds <= 0) {
    timeInSeconds = 45 * 60;
  }
  clearInterval(timerInterval);
  startTimer();

  updateQuestionUI();
  showScreen("screenQuiz");

  if (localStorage.getItem("isSubmited") === "true") {
    submitQuiz();
  }
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

  if (btnSubmit) btnSubmit.disabled = currentQuestion < totalQuestions;
  if (btnNext) btnNext.disabled = currentQuestion === totalQuestions;
  if (btnPrev) btnPrev.disabled = currentQuestion === 1;
  updateProgressBar(true);
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

function submitQuiz() {
  clearInterval(timerInterval);
  saveCurrentQuestionAnswer();

  let correctCount = 0;
  questions.forEach((q) => {
    const isCorrect = gradeQuestion(q);
    resultMenuBtn(q.id, isCorrect);
    if (isCorrect) correctCount += 1;
  });

  const reward =
    totalQuestions > 0 ? Math.round((100 * correctCount) / totalQuestions) : 0;
  document.getElementById("scoreText").innerText =
    `${correctCount} / ${totalQuestions} Câu Đúng\nBạn nhận được ${reward} xu`;

  if (localStorage.getItem("isSubmited") !== "true") {
    saveRewardToStudent(
      name,
      className,
      reward,
      correctCount,
      totalQuestions,
      school,
    );
    localStorage.setItem("isSubmited", "true");
  }

  saveCurrentQuestion();
  showScreen("screenResult");
}

function reviewQuiz() {
  isReviewMode = true;
  quizMainContent?.classList.add("review-mode");
  if (btnSubmit) btnSubmit.style.display = "none";
  if (btnReset) btnReset.style.display = "none";
  if (btnBackToResult) btnBackToResult.style.display = "block";

  currentQuestion = 1;
  updateQuestionUI();
  showScreen("screenQuiz");
}
