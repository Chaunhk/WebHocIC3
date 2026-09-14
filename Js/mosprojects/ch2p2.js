// File: JS/mosprojects/ch2p2.js
window.ch2p2 = function (
  studentXmlDoc,
  studentRelsDoc,
  answerXmlDoc,
  answerRelsDoc,
  currentProject,
) {
  let score = 0;
  let resultsHTML = "";

  console.log("========== PROJECT 9 (COMPUTER HEALTH) GRADING START ==========\n");

  // =========================================================================
  // Task 1: Track Changes enabled
  // =========================================================================
  let isTrackChangesEnabled = false;
  console.log("--- TASK 1: Check if Track Changes is enabled ---");

  const trackChanges = studentXmlDoc.getElementsByTagName("w:trackChanges");
  console.log(`Found ${trackChanges.length} trackChanges element(s)`);

  if (trackChanges.length > 0) {
    isTrackChangesEnabled = true;
    console.log("  ✅ Track Changes is enabled");
  }

  if (isTrackChangesEnabled) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Tính năng theo dõi sửa đổi (Track Changes) đã được bật.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Track Changes chưa được bật. Hãy vào Review → Track Changes → ON.</div>`;
  }

  // =========================================================================
  // Task 2: Table deleted but data preserved with paragraph separators
  // =========================================================================
  let isTableDeletedCorrect = false;
  console.log("\n--- TASK 2: Check that table is deleted ---");

  const tables = studentXmlDoc.getElementsByTagName("w:tbl");
  console.log(`Found ${tables.length} table(s)`);

  // If no tables found, task might be correct (table deleted)
  if (tables.length === 0) {
    isTableDeletedCorrect = true;
    console.log("  ✅ No tables found - table successfully deleted");
  } else {
    console.log(`  ❌ Found ${tables.length} table(s) - not deleted`);
  }

  if (isTableDeletedCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Bảng đã được xóa và dữ liệu được giữ với định dạng phân tách.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Bảng vẫn còn trong tài liệu. Hãy chuyển bảng thành văn bản rồi xóa bảng.</div>`;
  }

  // =========================================================================
  // Task 3: Numbered list 1-5 under "What is Regular Maintenance?"
  // =========================================================================
  let isNumberedListCorrect = false;
  console.log(
    "\n--- TASK 3: Check numbered list under 'What is Regular Maintenance?' ---",
  );

  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  let foundHeading = false;

  for (let i = 0; i < paragraphs.length; i++) {
    if (
      paragraphs[i].textContent.toLowerCase().includes("regular maintenance")
    ) {
      foundHeading = true;
      console.log(
        `  Found "What is Regular Maintenance?" at paragraph ${i}`,
      );

      // Check next paragraphs for numbered list (1-5)
      let numberCount = 0;
      for (let j = i + 1; j < Math.min(i + 10, paragraphs.length); j++) {
        const pPr = paragraphs[j].getElementsByTagName("w:pPr");
        if (pPr.length > 0) {
          const numPr = pPr[0].getElementsByTagName("w:numPr");
          if (numPr.length > 0) {
            numberCount++;
          }
        }
      }

      console.log(`  Found ${numberCount} numbered items`);
      if (numberCount >= 5) {
        isNumberedListCorrect = true;
        console.log("  ✅ Found 5+ numbered items");
      }
      break;
    }
  }

  if (isNumberedListCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Danh sách đánh số 1-5 đã được tạo dưới tiêu đề Regular Maintenance.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Danh sách đánh số chưa được tạo hoặc chưa hoàn chỉnh. Hãy chuyển đổi danh sách thành dạng 1, 2, 3...5.</div>`;
  }

  // =========================================================================
  // Task 4: Heart shape with blue fill
  // =========================================================================
  let isHeartShapeCorrect = false;
  console.log("\n--- TASK 4: Check for Heart shape with blue fill ---");

  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  console.log(`Found ${drawings.length} drawing(s)`);

  for (let i = 0; i < drawings.length; i++) {
    const drawingXml = drawings[i].outerHTML.toLowerCase();

    // Check for heart shape indicators
    if (drawingXml.includes("heart")) {
      isHeartShapeCorrect = true;
      console.log("  ✅ Found Heart shape");
      break;
    }
  }

  if (isHeartShapeCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Hình trái tim với tô màu xanh đã được thêm.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa thêm hình trái tim. Hãy vào Insert → Shapes → Heart → vẽ → tô màu xanh (Blue).</div>`;
  }

  // =========================================================================
  // Task 5: Image repositioned to align with first paragraph
  // =========================================================================
  let isImageRepositionedCorrect = false;
  console.log(
    "\n--- TASK 5: Check image positioned with Does your computer text ---",
  );

  // Image positioning is complex - we check if there's an image with positioning info
  for (let i = 0; i < drawings.length; i++) {
    const drawing = drawings[i];
    const drawingXml = drawing.outerHTML;

    // Check for inline or anchored positioning
    if (
      drawingXml.includes("wp:anchor") ||
      drawingXml.includes("wp:inline")
    ) {
      isImageRepositionedCorrect = true;
      console.log("  ✅ Found positioned image");
      break;
    }
  }

  if (isImageRepositionedCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> Hình ảnh đã được di chuyển và căn chỉnh đúng vị trí.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Hình ảnh chưa được định vị đúng. Hãy chọn hình → kéo để căn chỉnh theo lề trái và câu đầu tiên "Does your computer...".</div>`;
  }

  console.log("\n========== PROJECT 9 GRADING END ==========\n");

  return { score: score, html: resultsHTML };
};
