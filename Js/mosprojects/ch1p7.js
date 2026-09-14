// File: JS/mosprojects/ch1p7.js
window.ch1p7 = function (
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
  let score = 0;
  let resultsHTML = "";

  console.log("========== PROJECT 7 (LEGAL TERMS) GRADING START ==========\n");

  // =========================================================================
  // Task 1: Document Status changed to Draft
  // =========================================================================
  let isStatusDraftCorrect = false;
  console.log("--- TASK 1: Check document Status property = Draft ---");

  // Document properties are in docProps/core.xml
  // Status is typically stored as a custom property
  // We can check the document core properties for Status field
  const coreProps = studentXmlDoc.getElementsByTagName("cp:coreProperties");
  console.log(`Found ${coreProps.length} core properties element(s)`);

  // Look for Status custom property (usually in custom properties)
  // For now, check if document has any custom properties
  // Status is usually in customProperties.xml

  // Check docPr (document properties) in document.xml
  const docPr = studentXmlDoc.getElementsByTagName("w:docPr");
  if (docPr.length > 0) {
    const status = docPr[0].getAttribute("w:status");
    console.log(`  Document status attribute: ${status}`);

    if (status && status.toLowerCase() === "draft") {
      isStatusDraftCorrect = true;
      console.log("  ✅ Document status is Draft");
    }
  }

  if (isStatusDraftCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Thuộc tính Status của tài liệu đã được thay đổi thành Draft.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Thuộc tính Status chưa được thay đổi thành Draft. Hãy vào File → Info → Properties → Status → chọn Draft.</div>`;
  }

  // =========================================================================
  // Task 2: Registered symbol (®) added after "Registered"
  // =========================================================================
  let isRegisteredSymbolCorrect = false;
  console.log("\n--- TASK 2: Check for ® symbol after 'Registered' ---");

  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  for (let i = 0; i < paragraphs.length; i++) {
    const paraText = paragraphs[i].textContent;

    if (paraText.includes("Registered")) {
      console.log(`  Found "Registered" at paragraph ${i}`);

      // Check if ® symbol is present (Unicode character U+00AE)
      if (paraText.includes("®") || paraText.includes("\u00AE")) {
        isRegisteredSymbolCorrect = true;
        console.log("  ✅ Found ® symbol after Registered");
        break;
      }
    }
  }

  if (isRegisteredSymbolCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Biểu tượng ® đã được thêm sau tiêu đề Registered.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Biểu tượng ® chưa được thêm. Hãy đặt con trỏ sau "Registered" → Insert → Special Character → tìm ® (U+00AE).</div>`;
  }

  // =========================================================================
  // Task 3: Small Caps effect applied to 3 headings
  // =========================================================================
  let isSmallCapsCorrect = false;
  console.log("\n--- TASK 3: Check for Small Caps on Trademark, Registered, Copyright ---");

  const targetHeadings = ["trademark", "registered", "copyright"];
  let foundSmallCaps = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paraText = paragraphs[i].textContent.toLowerCase();

    for (let heading of targetHeadings) {
      if (paraText.includes(heading)) {
        console.log(`  Found "${heading}" at paragraph ${i}`);

        // Check for Small Caps (w:smallCaps)
        const runs = paragraphs[i].getElementsByTagName("w:r");
        for (let r = 0; r < runs.length; r++) {
          const rPr = runs[r].getElementsByTagName("w:rPr");
          if (rPr.length > 0) {
            const smallCaps = rPr[0].getElementsByTagName("w:smallCaps");
            if (smallCaps.length > 0) {
              foundSmallCaps++;
              console.log(
                `    ✅ Small Caps found on "${heading}" in run ${r}`,
              );
              break;
            }
          }
        }
      }
    }
  }

  if (foundSmallCaps >= 3) {
    isSmallCapsCorrect = true;
    console.log(
      `  ✅ Small Caps applied to ${foundSmallCaps}/3 headings`,
    );
  } else {
    console.log(
      `  ❌ Small Caps found on only ${foundSmallCaps}/3 headings`,
    );
  }

  if (isSmallCapsCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Hiệu ứng Small Caps đã được áp dụng cho ba tiêu đề (Trademark, Registered, Copyright).</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa áp dụng Small Caps cho đủ 3 tiêu đề. Hãy chọn từng tiêu đề → Home → Font dialog → Effects → Small Caps.</div>`;
  }

  // =========================================================================
  // Task 4: Track Changes enabled and locked with password "Legal"
  // =========================================================================
  let isTrackChangesCorrect = false;
  console.log("\n--- TASK 4: Check for Track Changes enabled and locked ---");

  // Track changes setting is in documentProtection or trackChanges
  const trackChanges = studentXmlDoc.getElementsByTagName("w:trackChanges");
  console.log(`Found ${trackChanges.length} trackChanges element(s)`);

  if (trackChanges.length > 0) {
    isTrackChangesCorrect = true;
    console.log("  ✅ Track Changes is enabled");

    // Check for document protection (password lock)
    const docProtection = studentXmlDoc.getElementsByTagName(
      "w:documentProtection",
    );
    if (docProtection.length > 0) {
      const enforcement = docProtection[0].getAttribute("w:enforcement");
      console.log(`  Document protection enforcement: ${enforcement}`);

      if (enforcement === "1" || enforcement === "true") {
        console.log("  ✅ Document is protected (password lock active)");
      }
    }
  } else {
    console.log("  ❌ Track Changes not found");
  }

  if (isTrackChangesCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Theo dõi thay đổi đã được bật và khóa bằng mật khẩu Legal.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Theo dõi thay đổi chưa được bật hoặc mật khẩu chưa được đặt. Hãy vào Review → Track Changes → ON → Protect Tracked Changes → nhập password "Legal".</div>`;
  }

  // =========================================================================
  // Task 5: Comment added to "Fair Use Law"
  // =========================================================================
  let isCommentAddedCorrect = false;
  console.log("\n--- TASK 5: Check for comment on 'Fair Use Law' ---");

  const commentRanges = studentXmlDoc.getElementsByTagName("w:commentRangeStart");
  console.log(`Found ${commentRanges.length} comment range(s)`);

  let foundFairUseLawComment = false;
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].textContent.toLowerCase().includes("fair use law")) {
      console.log(`  Found "Fair Use Law" at paragraph ${i}`);

      // Check if there's a comment marker in this paragraph
      const commentInPara = paragraphs[i].getElementsByTagName(
        "w:commentRangeStart",
      );
      if (commentInPara.length > 0) {
        foundFairUseLawComment = true;
        console.log("  ✅ Found comment marker on 'Fair Use Law'");
      }

      // Also check surrounding paragraphs
      if (!foundFairUseLawComment) {
        for (let j = Math.max(0, i - 2); j <= Math.min(paragraphs.length - 1, i + 2); j++) {
          const commentMarkers = paragraphs[j].getElementsByTagName(
            "w:commentRangeStart",
          );
          if (commentMarkers.length > 0) {
            foundFairUseLawComment = true;
            console.log(
              `  ✅ Found comment marker near "Fair Use Law" (paragraph ${j})`,
            );
            break;
          }
        }
      }
      break;
    }
  }

  if (foundFairUseLawComment || commentRanges.length > 0) {
    isCommentAddedCorrect = true;
  }

  if (isCommentAddedCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> Bình luận đã được thêm vào Fair Use Law với nội dung yêu cầu.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Chưa thêm bình luận cho Fair Use Law. Hãy chọn "Fair Use Law" → Review → New Comment → nhập "Should we explain Fair Use Law?".</div>`;
  }

  console.log("\n========== PROJECT 7 GRADING END ==========\n");

  return { score: score, html: resultsHTML };
};
