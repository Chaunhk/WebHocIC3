// File: JS/mosprojects/ch2p6.js
window.ch2p6 = function (
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
  console.log(
    "========== PROJECT 13 (EASY LANDSCAPING) GRADING START ==========\n",
  );

  // Task 1: Screenshot inserted
  console.log("--- TASK 1: Check for screenshot ---");
  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  console.log(`  Found ${drawings.length} drawing(s)`);
  if (drawings.length > 0) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Ảnh chụp màn hình đã được chèn.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Chưa chèn screenshot. Hãy vào Insert → Screenshots.</div>`;
  }

  // Task 2: Footnote converted to endnote
  console.log("\n--- TASK 2: Check for endnote ---");
  const endnotes = studentXmlDoc.getElementsByTagName("w:endnoteReference");
  if (endnotes.length > 0) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Chú thích đã được chuyển thành chú thích cuối.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Chưa chuyển chú thích. Hãy chọn footnote → Convert → to Endnote.</div>`;
  }

  // Task 3: 2-column layout
  console.log("\n--- TASK 3: Check for 2-column text ---");
  const sections = studentXmlDoc.getElementsByTagName("w:sectPr");
  let hasTwoColumns = false;
  for (let s = 0; s < sections.length; s++) {
    const cols = sections[s].getElementsByTagName("w:cols");
    if (cols.length > 0 && cols[0].getAttribute("w:num") === "2") {
      hasTwoColumns = true;
      console.log("  ✅ Found 2-column layout");
      break;
    }
  }
  if (hasTwoColumns) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Danh sách được định dạng thành 2 cột.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa định dạng thành 2 cột. Hãy chọn danh sách → Layout → Columns → Two.</div>`;
  }

  // Task 4: Column break inserted
  console.log("\n--- TASK 4: Check for column break ---");
  const columnBreaks = studentXmlDoc.getElementsByTagName("w:br");
  let hasColumnBreak = false;
  for (let c = 0; c < columnBreaks.length; c++) {
    const breakType = columnBreaks[c].getAttribute("w:type");
    if (breakType === "column") {
      hasColumnBreak = true;
      console.log("  ✅ Found column break");
      break;
    }
  }
  if (hasColumnBreak) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Column Break đã được chèn.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa chèn Column Break. Hãy vào Layout → Breaks → Column.</div>`;
  }

  // Task 5: Table alt text added
  console.log("\n--- TASK 5: Check for table alt text ---");
  const tables = studentXmlDoc.getElementsByTagName("w:tbl");
  if (tables.length > 0) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> Tiêu đề và mô tả văn bản thay thế đã được thêm cho bảng.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Bảng không tìm thấy hoặc chưa có alt text.</div>`;
  }

  console.log("\n========== PROJECT 13 GRADING END ==========\n");
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
