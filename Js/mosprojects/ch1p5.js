// File: JS/mosprojects/ch1p5.js
window.ch1p5 = function (
  studentXmlDoc,
  studentRelsDoc,
  studentStylesDoc,
  studentThemeDoc,
  studentNumberingDoc,
  answerXmlDoc,
  answerRelsDoc,
  answerStylesDoc,
  answerThemeDoc,
  answerNumberingDoc,
  currentProject,
) {
  let score = 0;
  let resultsHTML = "";

  console.log("========== PROJECT 5 (JOURNALISM) GRADING START ==========\n");

  // =========================================================================
  // Task 1: Document formatted into 2 columns from specific heading
  // =========================================================================
  let isColumnFormatCorrect = false;
  console.log("--- TASK 1: Check for 2-column layout ---");

  const sections = studentXmlDoc.getElementsByTagName("w:sectPr");
  console.log(`Found ${sections.length} section(s)`);

  for (let i = 0; i < sections.length; i++) {
    const cols = sections[i].getElementsByTagName("w:cols");
    if (cols.length > 0) {
      const numAttr = cols[0].getAttribute("w:num");
      console.log(`  Section ${i}: columns = ${numAttr}`);

      if (numAttr === "2") {
        isColumnFormatCorrect = true;
        console.log("  ✅ Found 2-column layout");
        break;
      }
    }
  }

  if (isColumnFormatCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Tài liệu đã được định dạng thành hai cột từ tiêu đề 1.1 SEEK TRUTH.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Chưa định dạng tài liệu thành hai cột. Hãy chọn Layout → Columns → Two.</div>`;
  }

  // =========================================================================
  // Task 2: Endnote added with URL content
  // =========================================================================
  let isEndnoteCorrect = false;
  console.log("\n--- TASK 2: Check for endnote with URL ---");

  // Endnotes are stored in endnotes.xml, but we can look for endnote markers
  const footnoteRefs = studentXmlDoc.getElementsByTagName("w:endnoteReference");
  console.log(`Found ${footnoteRefs.length} endnote reference(s)`);

  if (footnoteRefs.length > 0) {
    isEndnoteCorrect = true;
    console.log("  ✅ Found endnote reference");
  } else {
    console.log("  ❌ No endnote found");
  }

  if (isEndnoteCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Chú thích cuối tài liệu với URL đã được chèn và định dạng chính xác.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Chưa chèn chú thích cuối tài liệu. Hãy chèn endnote → References → Insert Endnote với nội dung http://www.spj.org/index.asp.</div>`;
  }

  // =========================================================================
  // Task 3: SmartArt colors changed to Colorful Range - Accent Colors 5-6
  // =========================================================================
  let isSmartArtColorsCorrect = false;
  console.log("\n--- TASK 3: Check SmartArt color scheme ---");

  // SmartArt is embedded as DrawingML
  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  console.log(`Found ${drawings.length} drawing(s)`);

  for (let i = 0; i < drawings.length; i++) {
    const drawing = drawings[i];
    const drawingXml = drawing.outerHTML;

    // Check for SmartArt indicator (contains cgvData for data model)
    if (drawingXml.includes("p:cSld") || drawingXml.includes("dgm:")) {
      console.log(`  Drawing ${i}: Possible SmartArt detected`);

      // Check for color scheme references - Colorful Range typically uses accent colors 5-6
      if (
        drawingXml.includes("accent5") ||
        drawingXml.includes("accent6") ||
        drawingXml.toLowerCase().includes("colorful")
      ) {
        isSmartArtColorsCorrect = true;
        console.log("  ✅ Found SmartArt with Colorful Range colors");
        break;
      }
    }
  }

  if (isSmartArtColorsCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> SmartArt đã được tô màu Colorful Range - Accent Colors 5 to 6.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa thay đổi màu SmartArt. Hãy chọn SmartArt → Design → Change Colors → Colorful Range - Accent Colors 5 to 6.</div>`;
  }

  // =========================================================================
  // Task 4: New shape added to SmartArt with text
  // =========================================================================
  let isShapeAddedCorrect = false;
  console.log(
    "\n--- TASK 4: Check for SmartArt shape with 'Be Accountable' text ---",
  );

  for (let i = 0; i < drawings.length; i++) {
    const drawing = drawings[i];
    const drawingText = drawing.textContent.toLowerCase();

    if (
      drawingText.includes("accountable") &&
      drawingText.includes("transparent")
    ) {
      isShapeAddedCorrect = true;
      console.log(
        "  ✅ Found shape with 'Be Accountable and Transparent' text",
      );
      break;
    }
  }

  if (isShapeAddedCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Hình dạng mới với văn bản 'Be Accountable and Transparent' đã được thêm vào SmartArt.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa thêm hình dạng mới vào SmartArt. Hãy chọn SmartArt → Design → Add Shape → nhập 'Be Accountable and Transparent'.</div>`;
  }

  // =========================================================================
  // Task 5: SmartArt moved from page 2 to page 1
  // =========================================================================
  let isSmartArtMovedCorrect = false;
  console.log("\n--- TASK 5: Check SmartArt position on page 1 ---");

  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  let foundCodeOfEthics = false;
  let smartArtBetweenTitleAndCode = false;

  for (let i = 0; i < paragraphs.length; i++) {
    const paraText = paragraphs[i].textContent;

    if (paraText.includes("Code of Ethics")) {
      foundCodeOfEthics = true;
      console.log(`  Found "Code of Ethics" at paragraph ${i}`);

      // Look backwards for SmartArt before "Code of Ethics"
      for (let j = i - 1; j >= Math.max(0, i - 20); j--) {
        const paraDrawings = paragraphs[j].getElementsByTagName("w:drawing");
        if (paraDrawings.length > 0) {
          smartArtBetweenTitleAndCode = true;
          console.log(
            `  ✅ Found SmartArt at paragraph ${j} (before Code of Ethics)`,
          );
          break;
        }
      }
      break;
    }
  }

  if (smartArtBetweenTitleAndCode) {
    isSmartArtMovedCorrect = true;
  }

  if (isSmartArtMovedCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> SmartArt đã được di chuyển lên trang 1 và đặt giữa tiêu đề và Code of Ethics.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> SmartArt chưa được di chuyển đúng vị trí. Hãy cắt SmartArt từ trang 2 → dán vào trang 1 giữa tiêu đề và "Code of Ethics".</div>`;
  }

  console.log("\n========== PROJECT 5 GRADING END ==========\n");
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
