const RESULTS_KEY = "icResults";
function _readResults() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULTS_KEY));
  } catch {
    return null;
  }
}
function initResultsOwner(school, name, cls) {
  const owner = `${school}|${name}|${cls}`;
  const d = _readResults();
  if (!d || d.owner !== owner) {
    sessionStorage.setItem(
      RESULTS_KEY,
      JSON.stringify({ owner, attempts: [] }),
    );
  }
}
function addResult(test, score, total, mode = "Testing", marks = "") {
  const d = _readResults() || { owner: null, attempts: [] };
  d.attempts.push({ test, score, total, mode, marks });
  sessionStorage.setItem(RESULTS_KEY, JSON.stringify(d));
}
function hasAnswer(q) {
  if (!q) return false;
  const c = document.getElementById(`qContainer${q.id}`);
  if (!c) return false;
  switch (q.type) {
    case "single":
    case "multi":
    case "tf":
      return !!c.querySelector("input:checked");
    case "drag":
      return [...c.querySelectorAll(".drop-zone")].some(
        (z) => z.children.length > 0,
      );
    case "hotspot":
      return !!c.querySelector(".hotspot-zone.selected");
    default:
      return false;
  }
}
function buildMarks(questions, results, mode) {
  return questions
    .map((q, i) => {
      const c = document.getElementById(`qContainer${q.id}`);
      const attempted =
        mode === "Training"
          ? !!c && c.classList.contains("training-checked")
          : hasAnswer(q);
      return attempted ? (results[i] ? "c" : "w") : "n";
    })
    .join("");
}
function buildDots(marks) {
  const wrap = document.createElement("div");
  wrap.className = "result-dots";
  for (const m of marks || "") {
    const d = document.createElement("span");
    d.className = "dot dot-" + m;
    wrap.appendChild(d);
  }
  return wrap;
}
function renderResults(boxId, mode = null) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const d = _readResults();
  const panel = box.closest(".results-panel");
  box.innerHTML = "";

  const attempts = (d && d.attempts ? d.attempts : []).filter((a) => {
    if (!mode) return true;
    return (a.mode || "Testing") === mode;
  });

  if (!attempts.length) {
    if (panel) panel.style.display = "none";
    return;
  }

  if (panel) panel.style.display = "block";

  attempts.forEach((a) => {
    const row = document.createElement("div");
    row.className = "result-item";
    row.style.flexDirection = "column";
    row.style.gap = "4px";

    const ratio = a.total > 0 ? a.score / a.total : 0;
    if (ratio >= 0.8) row.classList.add("result-good");
    else if (ratio >= 0.5) row.classList.add("result-medium");
    else row.classList.add("result-low");

    const summary = document.createElement("div");
    summary.className = "result-summary";
    summary.textContent = `${a.test}: ${a.score}/${a.total}`;
    row.appendChild(summary);

    const dots = buildDots(a.marks);
    if (dots.childElementCount > 0) {
      row.appendChild(dots);
    }

    box.appendChild(row);
  });
}
function renderResultsByMode(currentMode = "Testing") {
  renderResults("results-box-training", "Training");
  renderResults("results-box-testing", "Testing");

  const trainingPanel = document.getElementById("results-panel-training");
  const testingPanel = document.getElementById("results-panel-testing");

  if (trainingPanel)
    trainingPanel.style.display = currentMode === "Training" ? "block" : "none";
  if (testingPanel)
    testingPanel.style.display = currentMode === "Testing" ? "block" : "none";
}
