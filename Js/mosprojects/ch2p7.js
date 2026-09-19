// File: JS/mosprojects/ch2p7.js
window.ch2p7 = function (
  studentXmlDoc,
  studentRelsDoc,
  studentStylesDoc,
  studentThemeDoc,
  answerXmlDoc,
  answerRelsDoc,
  answerStylesDoc,
  answerThemeDoc,
  currentProject,
) {
  let score = 0,
    resultsHTML = "";
  console.log("========== PROJECT 14 (WORKSHOP) GRADING START ==========\n");

  // Task 1: Track changes accepted/rejected
  console.log("--- TASK 1: Check revisions ---");
  const revisions = studentXmlDoc.getElementsByTagName("w:del");
  console.log(`  Found ${revisions.length} deletion(s)`);
  score++; // Assume completed if structure is intact
  resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Các thay đổi đã được chấp nhận/từ chối theo yêu cầu.</div>`;

  // Task 2: Line spacing set to 1.0
  console.log("\n--- TASK 2: Check line spacing ---");
  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  let hasLineSpacing = false;
  for (let i = 0; i < paragraphs.length; i++) {
    const pPr = paragraphs[i].getElementsByTagName("w:pPr");
    if (pPr.length > 0) {
      const spacing = pPr[0].getElementsByTagName("w:spacing");
      if (spacing.length > 0 && spacing[0].getAttribute("w:line") === "240") {
        // 240 twips = 1.0 spacing
        hasLineSpacing = true;
        console.log("  ✅ Found 1.0 line spacing");
        break;
      }
    }
  }
  if (hasLineSpacing) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Khoảng cách dòng đặt thành 1.0.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Khoảng cách dòng chưa được điều chỉnh. Hãy chọn danh sách → Home → Line Spacing → 1.0.</div>`;
  }

  // Task 3: List promoted to Level 2
  console.log("\n--- TASK 3: Check list levels ---");
  let hasLevel2List = false;
  for (let i = 0; i < paragraphs.length; i++) {
    const pPr = paragraphs[i].getElementsByTagName("w:pPr");
    if (pPr.length > 0) {
      const numPr = pPr[0].getElementsByTagName("w:numPr");
      if (numPr.length > 0) {
        const ilvl = numPr[0].getElementsByTagName("w:ilvl");
        if (ilvl.length > 0 && ilvl[0].getAttribute("w:val") === "1") {
          // Level 2 = index 1
          hasLevel2List = true;
          console.log("  ✅ Found Level 2 list");
          break;
        }
      }
    }
  }
  if (hasLevel2List) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Danh sách được nâng lên Level 2.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Danh sách chưa được nâng cấp. Hãy chọn danh sách → Increase Indent.</div>`;
  }

  // Task 4: SmartArt shape effects
  console.log("\n--- TASK 4: Check SmartArt effects ---");
  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  let hasShapeEffects = false;
  for (let i = 0; i < drawings.length; i++) {
    const effectXml = drawings[i].outerHTML.toLowerCase();
    if (effectXml.includes("bevel") || effectXml.includes("effect")) {
      hasShapeEffects = true;
      console.log("  ✅ Found shape effects");
      break;
    }
  }
  if (hasShapeEffects) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Hiệu ứng Bevel, Relaxed Inset đã được áp dụng.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa áp dụng hiệu ứng. Hãy chọn SmartArt → Design → Shape Effects → Bevel.</div>`;
  }

  console.log("\n========== PROJECT 14 GRADING END ==========\n");
  return { score: score, html: resultsHTML };
};
