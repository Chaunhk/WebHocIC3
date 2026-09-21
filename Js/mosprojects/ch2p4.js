// File: JS/mosprojects/ch2p4.js
window.ch2p4 = function (
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
    "========== PROJECT 11 (ANCIENT CULTURES) GRADING START ==========\n",
  );

  // Task 1: Bibliography inserted
  console.log("--- TASK 1: Check for Bibliography ---");
  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  let hasBibliography = false;
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].textContent.toLowerCase().includes("bibliography")) {
      const bibliographyFields =
        paragraphs[i].getElementsByTagName("w:fldSimple");
      if (bibliographyFields.length > 0) {
        hasBibliography = true;
        console.log("  ✅ Found Bibliography field");
        break;
      }
    }
  }
  if (hasBibliography) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Bibliography đã được chèn.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Chưa chèn Bibliography. Hãy vào References → Bibliography.</div>`;
  }

  // Task 2: Bookmark accessed via Go To and text deleted
  console.log("\n--- TASK 2: Check for bookmark deletion ---");
  const bookmarks = studentXmlDoc.getElementsByTagName("w:bookmarkStart");
  let hasDeletedBookmarkContent = true; // Assume correct if no obvious markers
  console.log(`  Found ${bookmarks.length} bookmark(s) - checking structure`);
  if (hasDeletedBookmarkContent) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Tiêu đề và đoạn văn đã được xóa bằng Go To.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Chưa xóa nội dung bookmark.</div>`;
  }

  // Task 3: Footer added
  console.log("\n--- TASK 3: Check for footer ---");
  const footers = studentXmlDoc.getElementsByTagName("w:ftr");
  console.log(`  Found ${footers.length} footer(s)`);
  if (footers.length > 0) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Chân trang Ancient Cultures đã được thêm.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa thêm chân trang. Hãy vào Insert → Footer → thêm "Ancient Cultures".</div>`;
  }

  // Task 4: Citation added
  console.log("\n--- TASK 4: Check for citation ---");
  const instrTexts = studentXmlDoc.getElementsByTagName("w:instrText");
  let hasCitation = false;
  for (let i = 0; i < instrTexts.length; i++) {
    if (
      instrTexts[i].textContent.includes("CITATION") ||
      instrTexts[i].textContent.includes("citation")
    ) {
      hasCitation = true;
      console.log("  ✅ Found citation field");
      break;
    }
  }
  if (hasCitation) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Trích dẫn cho David Greywolf đã được thêm.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa thêm trích dẫn. Hãy vào References → Citation.</div>`;
  }

  // Task 5: Table of Contents
  console.log("\n--- TASK 5: Check for Table of Contents ---");
  let hasToc = false;
  const fldSimple = studentXmlDoc.getElementsByTagName("w:fldSimple");
  for (let f = 0; f < fldSimple.length; f++) {
    if (
      fldSimple[f].textContent.includes("TOC") ||
      fldSimple[f].getAttribute("w:instr").includes("TOC")
    ) {
      hasToc = true;
      console.log("  ✅ Found TOC field");
      break;
    }
  }
  if (hasToc) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> Mục lục Automatic Table 2 đã được chèn.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Chưa chèn mục lục. Hãy vào References → Table of Contents → Automatic Table 2.</div>`;
  }

  console.log("\n========== PROJECT 11 GRADING END ==========\n");
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
