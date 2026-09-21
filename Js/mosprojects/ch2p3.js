// File: JS/mosprojects/ch2p3.js
window.ch2p3 = function (
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
  console.log("========== PROJECT 10 (GAME OVER) GRADING START ==========\n");

  // Task 1: 3D Model Visor inserted
  console.log("--- TASK 1: Check for 3D Model ---");
  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  let has3DModel = false;
  for (let i = 0; i < drawings.length; i++) {
    if (
      drawings[i].outerHTML.toLowerCase().includes("3d") ||
      drawings[i].outerHTML.includes("model")
    ) {
      has3DModel = true;
      console.log("  ✅ Found 3D model");
      break;
    }
  }
  if (has3DModel) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Mô hình 3D Visor.glb đã được chèn.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Chưa chèn mô hình 3D. Hãy chèn Visor.glb từ GMetrixTemplates.</div>`;
  }

  // Task 2: Trademark (M) symbol
  console.log("\n--- TASK 2: Check for ™ symbol ---");
  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  let hasTrademarkSymbol = false;
  for (let i = 0; i < paragraphs.length; i++) {
    if (
      paragraphs[i].textContent.includes("Game Over") &&
      (paragraphs[i].textContent.includes("™") ||
        paragraphs[i].textContent.includes("\u2122"))
    ) {
      hasTrademarkSymbol = true;
      console.log("  ✅ Found ™ symbol");
      break;
    }
  }
  if (hasTrademarkSymbol) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Ký hiệu Trademark ™ đã được thêm.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Chưa thêm ™ sau Game Over.</div>`;
  }

  // Task 3: Table cells merged
  console.log("\n--- TASK 3: Check for merged cells in table ---");
  const tables = studentXmlDoc.getElementsByTagName("w:tbl");
  let hasMergedCells = false;
  for (let t = 0; t < tables.length; t++) {
    const vmerges = tables[t].getElementsByTagName("w:vMerge");
    if (vmerges.length > 0) {
      hasMergedCells = true;
      console.log("  ✅ Found merged cells");
      break;
    }
  }
  if (hasMergedCells) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Các ô trong bảng đã được hợp nhất.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa hợp nhất các ô. Hãy chọn tất cả ô → Merge Cells.</div>`;
  }

  // Task 4: Numbered list continued
  console.log("\n--- TASK 4: Check continued numbering ---");
  let hasNumberedItems = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    const pPr = paragraphs[i].getElementsByTagName("w:pPr");
    if (pPr.length > 0) {
      const numPr = pPr[0].getElementsByTagName("w:numPr");
      if (numPr.length > 0) hasNumberedItems++;
    }
  }
  console.log(`  Found ${hasNumberedItems} numbered items`);
  if (hasNumberedItems > 0) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Danh sách đánh số đã được tiếp tục.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Danh sách đánh số chưa được thiết lập đúng.</div>`;
  }

  // Task 5: Background removed from image
  console.log("\n--- TASK 5: Check image with transparency ---");
  let hasTransparentImage = false;
  for (let i = 0; i < drawings.length; i++) {
    const drawingXml = drawings[i].outerHTML.toLowerCase();
    if (
      drawingXml.includes("alphamodfix") ||
      drawingXml.includes("transparent")
    ) {
      hasTransparentImage = true;
      console.log("  ✅ Found image with transparency");
      break;
    }
  }
  if (hasTransparentImage) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> Nền đã được xóa từ hình minh họa.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Nền chưa được xóa. Hãy chọn hình → Picture Format → Remove Background.</div>`;
  }

  console.log("\n========== PROJECT 10 GRADING END ==========\n");
  // Task 6: Final document comparison (reusable external helper)
  const finalComparison =
    window.MOSComparator &&
    typeof window.MOSComparator.compareFinalDocument === "function"
      ? window.MOSComparator.compareFinalDocument(studentXmlDoc, answerXmlDoc, {
          includeFormatting: true,
        })
      : window.MOS && typeof window.MOS.compareFinalDocument === "function"
        ? window.MOS.compareFinalDocument(studentXmlDoc, answerXmlDoc, {
            includeFormatting: true,
          })
        : { passed: false, message: "Final comparator not available." };

  const isFinalDocumentMatch = Boolean(
    finalComparison && finalComparison.passed,
  );

  if (isFinalDocumentMatch) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 6 ĐÚNG:</b> Tệp học sinh khớp với đáp án chuẩn.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 6 SAI:</b> Tệp học sinh chưa khớp với file đáp án chuẩn.</div>`;
  }
  return { score: score, html: resultsHTML };
};
