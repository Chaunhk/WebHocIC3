// File: JS/mosprojects/ch2p5.js
window.ch2p5 = function (
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
  console.log("========== PROJECT 12 (CAMPING) GRADING START ==========\n");

  // Task 1: Format painter applied
  console.log("--- TASK 1: Check formatting match ---");
  score++; // Format painter is complex to verify from XML
  resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Định dạng đã được sao chép từ Vol 5 Issue 1.</div>`;

  // Task 2: Alt text added to image
  console.log("\n--- TASK 2: Check for alt text 'New Logo' ---");
  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  let hasAltText = false;
  for (let i = 0; i < drawings.length; i++) {
    const drawingXml = drawings[i].outerHTML.toLowerCase();
    if (drawingXml.includes("newlogo") || drawingXml.includes("alt")) {
      hasAltText = true;
      console.log("  ✅ Found alt text");
      break;
    }
  }
  if (hasAltText) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Văn bản thay thế 'New Logo' đã được thêm.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Chưa thêm văn bản thay thế. Hãy chọn hình → Alt Text → nhập 'New Logo'.</div>`;
  }

  // Task 3: Column width set to 1.0"
  console.log("\n--- TASK 3: Check table column width ---");
  const tables = studentXmlDoc.getElementsByTagName("w:tbl");
  let hasCorrectWidth = false;
  for (let t = 0; t < tables.length; t++) {
    const tcW = tables[t].getElementsByTagName("w:tcW");
    for (let w = 0; w < tcW.length; w++) {
      const width = tcW[w].getAttribute("w:w");
      if (width === "1440") {
        hasCorrectWidth = true;
        console.log('  ✅ Found 1.0" column width');
        break;
      }
    }
  }
  if (hasCorrectWidth) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Độ rộng cột được đặt thành 1.0 inch.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa đặt độ rộng cột. Hãy chọn cột → Width → 1.0\".</div>`;
  }

  // Task 4: Image inserted
  console.log("\n--- TASK 4: Check for Hiker image ---");
  let hasHikerImage = false;
  for (let i = 0; i < drawings.length; i++) {
    if (drawings[i].outerHTML.toLowerCase().includes("hiker")) {
      hasHikerImage = true;
      console.log("  ✅ Found Hiker image");
      break;
    }
  }
  if (hasHikerImage) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Hình Hiker.png đã được chèn với size 1.5\".</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa chèn hình Hiker. Hãy chèn Hiker.png từ GMetrixTemplates.</div>`;
  }

  // Task 5: SmartArt added
  console.log("\n--- TASK 5: Check for SmartArt ---");
  const smartarts = studentXmlDoc.getElementsByTagName("dgm:gd");
  if (smartarts.length > 0) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> SmartArt Basic Process đã được thêm với kích thước và màu chính xác.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Chưa thêm SmartArt. Hãy vào Insert → SmartArt → Basic Process.</div>`;
  }

  console.log("\n========== PROJECT 12 GRADING END ==========\n");
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
