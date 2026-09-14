// File: JS/mosprojects/ch1p1.js
window.ch1p1 = function (
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
  const totalTasks = currentProject.tasks.length;

  // --- Helper: normalize node local name safely
  function nodeLocalName(node) {
    return (
      node &&
      (node.localName || (node.nodeName && node.nodeName.split(":").pop()))
    );
  }

  // --- Helper: find section type near a paragraph index
  function findSectTypeNearParagraph(paragraphs, doc, paraIndex, lookback = 5) {
    const normalize = (v) => (v ? v.trim().toLowerCase() : null);
    const start = Math.max(0, paraIndex - lookback);
    for (let i = paraIndex; i >= start; i--) {
      const p = paragraphs[i];
      if (!p) continue;
      const pPr = p.getElementsByTagName("w:pPr");
      if (pPr.length === 0) continue;
      const sectPrs = pPr[0].getElementsByTagName("w:sectPr");
      if (sectPrs.length === 0) continue;
      const typeElems = sectPrs[0].getElementsByTagName("w:type");
      if (typeElems.length > 0) {
        const val = normalize(typeElems[0].getAttribute("w:val"));
        console.log(`DEBUG: paragraph ${i} has sectPr with type='${val}'`);
        return val;
      } else {
        console.log(
          `DEBUG: paragraph ${i} has sectPr but no w:type (unspecified)`,
        );
        return "unspecified";
      }
    }

    // fallback: check body/sectPr
    const bodies = doc.getElementsByTagName("w:body");
    if (bodies.length > 0) {
      const bodySect = bodies[0].getElementsByTagName("w:sectPr");
      if (bodySect.length > 0) {
        const typeElems = bodySect[0].getElementsByTagName("w:type");
        if (typeElems.length > 0) {
          const val = normalize(typeElems[0].getAttribute("w:val"));
          console.log(`DEBUG: body sectPr type='${val}'`);
          return val;
        }
        console.log("DEBUG: body sectPr exists but no w:type (unspecified)");
        return "unspecified";
      }
    }
    console.log("DEBUG: no sectPr found near paragraph or in body");
    return null;
  }

  // --- Helper: determine if a paragraph uses picture bullets by mapping numId -> abstractNum -> numPicBullet
  function paragraphUsesPictureBullet(paragraph, numberingDoc) {
    if (!numberingDoc) return false;
    const pPr = paragraph.getElementsByTagName("w:pPr");
    if (pPr.length === 0) return false;
    const numPr = pPr[0].getElementsByTagName("w:numPr");
    if (numPr.length === 0) return false;
    const numIdElems = numPr[0].getElementsByTagName("w:numId");
    if (numIdElems.length === 0) return false;
    const numId = numIdElems[0].getAttribute("w:val");
    if (!numId) return false;

    // find <w:num w:numId="numId">
    const nums = numberingDoc.getElementsByTagName("w:num");
    for (let i = 0; i < nums.length; i++) {
      if (nums[i].getAttribute("w:numId") === numId) {
        const absElems = nums[i].getElementsByTagName("w:abstractNumId");
        if (absElems.length === 0) continue;
        const absId = absElems[0].getAttribute("w:val");
        if (!absId) continue;
        // find abstractNum with that id
        const abs = numberingDoc.getElementsByTagName("w:abstractNum");
        for (let j = 0; j < abs.length; j++) {
          if (abs[j].getAttribute("w:abstractNumId") === absId) {
            // check for numPicBullet anywhere inside this abstractNum
            if (abs[j].getElementsByTagName("w:numPicBullet").length > 0) {
              console.log(
                `DEBUG: paragraph uses picture bullet via numId=${numId} abstractNumId=${absId}`,
              );
              return true;
            }
          }
        }
      }
    }
    console.log(
      `DEBUG: paragraph numId=${numId} does not map to a numPicBullet`,
    );
    return false;
  }

  // Task 1: Chuyển bảng thành văn bản
  let isTableConvertedToTabs = false;
  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  const tables = studentXmlDoc.getElementsByTagName("w:tbl");
  let isOldTableStillExists = false;

  for (let t = 0; t < tables.length; t++) {
    if (
      tables[t].textContent.includes("Weekly Rental") ||
      tables[t].textContent.includes("Wasatch")
    ) {
      isOldTableStillExists = true;
      break;
    }
  }

  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].textContent.includes("Weekly Rental")) {
      let scanIndex = i + 1;
      let tabMatchedRows = 0;
      while (scanIndex < paragraphs.length && scanIndex <= i + 15) {
        const targetPara = paragraphs[scanIndex];
        if (
          targetPara.getElementsByTagName("w:tab").length > 0 &&
          (targetPara.textContent.includes("Aspen") ||
            targetPara.textContent.includes("Wasatch"))
        ) {
          let isInsideTable = false;
          let parent = targetPara.parentNode;
          while (parent) {
            if (nodeLocalName(parent) === "tbl") {
              isInsideTable = true;
              break;
            }
            parent = parent.parentNode;
          }
          if (!isInsideTable) tabMatchedRows++;
        }
        scanIndex++;
      }
      if (tabMatchedRows >= 2 && !isOldTableStillExists) {
        isTableConvertedToTabs = true;
        break;
      }
    }
  }

  if (isTableConvertedToTabs) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Bảng dưới Weekly Rental đã được chuyển thành văn bản dạng Tabs.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Chưa chuyển đổi bảng thành văn bản bằng dấu Tabs.</div>`;
  }

  // Task 2: Siêu liên kết Hyperlink
  let isHyperlinkCorrect = false;
  let expectedUrl = "";
  if (answerXmlDoc && answerRelsDoc) {
    const ansHyperlinks = answerXmlDoc.getElementsByTagName("w:hyperlink");
    if (ansHyperlinks.length > 0) {
      const ansRId = ansHyperlinks[0].getAttribute("r:id");
      const ansRelationships =
        answerRelsDoc.getElementsByTagName("Relationship");
      for (let r = 0; r < ansRelationships.length; r++) {
        if (ansRelationships[r].getAttribute("Id") === ansRId) {
          expectedUrl = ansRelationships[r]
            .getAttribute("Target")
            .toLowerCase()
            .trim();
          break;
        }
      }
    }
  }
  if (!expectedUrl) expectedUrl = "https://wikipedia.org";

  const studentHyperlinks = studentXmlDoc.getElementsByTagName("w:hyperlink");
  if (studentRelsDoc && studentHyperlinks.length > 0) {
    for (let h = 0; h < studentHyperlinks.length; h++) {
      if (studentHyperlinks[h].textContent.toLowerCase().includes("cabin")) {
        const studRId = studentHyperlinks[h].getAttribute("r:id");
        const studRelationships =
          studentRelsDoc.getElementsByTagName("Relationship");
        for (let r = 0; r < studRelationships.length; r++) {
          if (studRelationships[r].getAttribute("Id") === studRId) {
            if (
              studRelationships[r]
                .getAttribute("Target")
                .toLowerCase()
                .trim() === expectedUrl
            ) {
              isHyperlinkCorrect = true;
              break;
            }
          }
        }
      }
      if (isHyperlinkCorrect) break;
    }
  }

  if (isHyperlinkCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Siêu liên kết đã được chèn chính xác khớp với file đáp án.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Từ khóa chưa được chèn siêu liên kết hoặc sai URL.</div>`;
  }

  // Task 3: Continuous Section Break BEFORE "Affordable Pricing"
  let isContinuousBreakCorrect = false;
  console.log(
    "--- TASK 3: Continuous Section Break near Affordable Pricing ---",
  );

  // Find "Affordable Pricing"
  let affordablePricingIndex = -1;
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].textContent.includes("Affordable Pricing")) {
      affordablePricingIndex = i;
      console.log(`✓ Found "Affordable Pricing" at paragraph ${i}`);
      break;
    }
  }

  if (affordablePricingIndex === -1) {
    console.log("❌ Could not find 'Affordable Pricing' in document");
  } else {
    // Use helper to find sectPr type near the heading (lookback up to 5 paragraphs)
    const typeFound = findSectTypeNearParagraph(
      paragraphs,
      studentXmlDoc,
      affordablePricingIndex,
      5,
    );
    console.log(`DEBUG: section type found = ${typeFound}`);
    if (typeFound === "continuous") {
      isContinuousBreakCorrect = true;
      console.log(
        "  ✅ Found continuous section break near Affordable Pricing",
      );
    } else {
      console.log(`  ❌ Section break not continuous (found: ${typeFound})`);
    }
  }

  if (isContinuousBreakCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Đã chèn Continuous Section Break thành công.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa tìm thấy dấu ngắt phần loại Continuous trước tiêu đề "Affordable Pricing". (I checked nearby paragraphs and body sectPr; ensure an explicit Continuous section break was inserted.)</div>`;
  }

  // =========================================================================
  // --- TASK 4: KIỂM TRA ĐỔI BULLET THÀNH HÌNH ẢNH (Trees.png) ---
  // =========================================================================
  let isPictureBulletCorrect = false;
  console.log("\n--- TASK 4: Picture Bullets (Trees.png) ---");

  if (studentNumberingDoc) {
    // scan paragraphs for relevant list items and check mapping
    for (let i = 0; i < paragraphs.length; i++) {
      const paraText = paragraphs[i].textContent.toLowerCase();
      if (
        paraText.includes("living") ||
        paraText.includes("dryer") ||
        paraText.includes("bedroom") ||
        paraText.includes("bathroom") ||
        paraText.includes("kitchen") ||
        paraText.includes("fireplace")
      ) {
        console.log(
          `DEBUG: checking paragraph ${i} for picture bullet: "${paraText.substring(0, 40)}..."`,
        );
        if (paragraphUsesPictureBullet(paragraphs[i], studentNumberingDoc)) {
          isPictureBulletCorrect = true;
          break;
        }
      }
    }
  } else {
    console.log("DEBUG: numbering.xml not present in student file");
  }

  if (isPictureBulletCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Ký hiệu danh sách đầu dòng đã được thay thế bằng hình ảnh Trees.png chính xác.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa thay thế các dấu đầu dòng của danh sách thành hình ảnh Trees.png. Hệ thống đã kiểm tra mapping numId -> abstractNum -> numPicBullet và không tìm thấy liên kết hợp lệ.</div>`;
  }

  // Task 5: Kiểu khung ảnh Simple Frame, Black
  let isImageStyleCorrect = false;
  const studentPictures = studentXmlDoc.getElementsByTagName("pic:pic");
  if (studentPictures.length > 0) {
    for (let p = 0; p < studentPictures.length; p++) {
      const lnTags = studentPictures[p].getElementsByTagName("a:ln");
      if (lnTags.length > 0) {
        const colorTags = lnTags[0].getElementsByTagName("a:srgbClr");
        if (
          colorTags.length > 0 &&
          colorTags[0].getAttribute("val") === "000000"
        ) {
          isImageStyleCorrect = true;
          break;
        }
      }
    }
  }

  if (isImageStyleCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> Đã áp dụng kiểu khung viền Simple Frame, Black.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Hình ảnh sơ đồ mặt bằng chưa được đổi đúng kiểu viền.</div>`;
  }

  return { score: score, html: resultsHTML };
};
