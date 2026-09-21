// File: JS/mosprojects/ch1p1.js [FIXED VERSION - Task 4 uses image title comparison]
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

  // --- Helper: Extract picture bullet image title from a paragraph
  // This is the FIX for Task 4 regeneration issue
  // Instead of checking XML paths, we compare by image title which is stable across regeneration
  function getPictureBulletImageTitle(paragraph, numberingDoc) {
    if (!numberingDoc) return null;

    // 1. Get paragraph's list marker (numPr)
    const pPr = paragraph.getElementsByTagName("w:pPr");
    if (pPr.length === 0) return null;

    const numPr = pPr[0].getElementsByTagName("w:numPr");
    if (numPr.length === 0) return null;

    // 2. Get the numId
    const numIdElems = numPr[0].getElementsByTagName("w:numId");
    if (numIdElems.length === 0) return null;
    const numId = numIdElems[0].getAttribute("w:val");
    if (!numId) return null;

    // 3. Find the <w:num> entry matching this numId
    const nums = numberingDoc.getElementsByTagName("w:num");
    let absId = null;
    for (let i = 0; i < nums.length; i++) {
      if (nums[i].getAttribute("w:numId") === numId) {
        const absElems = nums[i].getElementsByTagName("w:abstractNumId");
        if (absElems.length > 0) {
          absId = absElems[0].getAttribute("w:val");
          break;
        }
      }
    }
    if (!absId) return null;

    // 4. Find the <w:abstractNum> matching this abstractNumId
    const abss = numberingDoc.getElementsByTagName("w:abstractNum");
    let lvlPicBulletId = null;
    for (let i = 0; i < abss.length; i++) {
      if (abss[i].getAttribute("w:abstractNumId") === absId) {
        // Look for the first <w:lvl> with a <w:lvlPicBulletId>
        const lvls = abss[i].getElementsByTagName("w:lvl");
        for (let j = 0; j < lvls.length; j++) {
          const picIds = lvls[j].getElementsByTagName("w:lvlPicBulletId");
          if (picIds.length > 0) {
            lvlPicBulletId = picIds[0].getAttribute("w:val");
            break;
          }
        }
        break;
      }
    }
    if (!lvlPicBulletId) return null;

    // 5. Find the <w:numPicBullet> matching this ID and extract image title
    const picBullets = numberingDoc.getElementsByTagName("w:numPicBullet");
    for (let i = 0; i < picBullets.length; i++) {
      if (picBullets[i].getAttribute("w:numPicBulletId") === lvlPicBulletId) {
        // Look for <v:imagedata o:title="..."/>
        const imageTags = picBullets[i].getElementsByTagName("v:imagedata");
        if (imageTags.length > 0) {
          const title = imageTags[0].getAttribute("o:title");
          if (title) {
            console.log(
              `DEBUG Task4: Found picture bullet title="${title}" for numId=${numId}`,
            );
            return title;
          }
        }
      }
    }

    return null;
  }

  // --- Helper: Task 4 checker (uses image title comparison, immune to regeneration)
  function checkTask4PictureBullet(
    paragraphs,
    studentNumberingDoc,
    answerNumberingDoc,
  ) {
    console.log(
      "\n--- TASK 4: Picture bullet list for Living area...dryer ---",
    );

    const listKeywords = [
      "living area",
      "dryer",
      "bedroom",
      "bathroom",
      "kitchen",
      "fireplace",
    ];

    // Get expected image title from answer file
    let expectedImageTitle = null;
    if (answerNumberingDoc) {
      for (let i = 0; i < paragraphs.length; i++) {
        const paraText = paragraphs[i].textContent.toLowerCase();
        if (listKeywords.some((kw) => paraText.includes(kw))) {
          expectedImageTitle = getPictureBulletImageTitle(
            paragraphs[i],
            answerNumberingDoc,
          );
          if (expectedImageTitle) {
            console.log(`✓ Answer uses image title: "${expectedImageTitle}"`);
            break;
          }
        }
      }
    }

    // Default fallback
    if (!expectedImageTitle) {
      expectedImageTitle = "Trees";
      console.log(
        `ℹ Defaulting to expected image title: "${expectedImageTitle}"`,
      );
    }

    // Check student's list
    if (!studentNumberingDoc) {
      console.log("✗ Student numbering.xml not available");
      return false;
    }

    let matchCount = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      const paraText = paragraphs[i].textContent.toLowerCase();
      if (!listKeywords.some((kw) => paraText.includes(kw))) {
        continue;
      }

      const studentImageTitle = getPictureBulletImageTitle(
        paragraphs[i],
        studentNumberingDoc,
      );

      if (studentImageTitle === expectedImageTitle) {
        matchCount++;
      }
    }

    const success = matchCount >= 2;
    console.log(
      `Result: ${matchCount} paragraphs with correct picture bullet (need ≥2)`,
    );
    return success;
  }

  // Task 1: Convert table to text with tabs
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

  // Task 2: Hyperlink
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
    "--- TASK 3: Continuous Section Break immediately before Affordable Pricing ---",
  );

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
  } else if (affordablePricingIndex > 0) {
    const breakParagraph = paragraphs[affordablePricingIndex - 1];
    const breakSectPrs = breakParagraph.getElementsByTagName("w:sectPr");
    let breakType = null;

    if (breakSectPrs.length > 0) {
      const typeElems = breakSectPrs[0].getElementsByTagName("w:type");
      if (typeElems.length > 0) {
        breakType = (typeElems[0].getAttribute("w:val") || "")
          .toLowerCase()
          .trim();
      }
    }

    console.log(
      `DEBUG: paragraph before Affordable Pricing: index=${affordablePricingIndex - 1}, breakType=${breakType}`,
    );

    if (breakType === "continuous") {
      isContinuousBreakCorrect = true;
      console.log(
        "  ✅ Found a Continuous section break immediately before Affordable Pricing",
      );
    } else {
      console.log(
        `  ❌ The paragraph immediately before Affordable Pricing is not a Continuous section break (found: ${breakType || "none"})`,
      );
    }
  }

  if (isContinuousBreakCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Đã chèn Continuous Section Break ngay trước tiêu đề "Affordable Pricing".</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Cần chèn Section Break loại Continuous ngay trước "Affordable Pricing". Không chấp nhận các loại ngắt phần khác.</div>`;
  }

  // Task 4: Picture bullet list (FIXED VERSION - compares by image title)
  let isPictureBulletCorrect = checkTask4PictureBullet(
    paragraphs,
    studentNumberingDoc,
    answerNumberingDoc,
  );

  if (isPictureBulletCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Danh sách đầu tiên đã sử dụng hình ảnh bullet (Trees) cho các mục từ "Living area" đến "dryer".</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa tạo danh sách đầu dòng kiểu hình ảnh cho các mục như "Living area ... dryer". Cần dùng picture bullet trong định dạng Lists.</div>`;
  }

  // Task 5: Image frame style (Simple Frame, Black)
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

  // Task 6: Final document comparison (using external comparator if available)
  let isFinalDocumentMatch = false;

  if (
    window.MOSComparator &&
    typeof window.MOSComparator.compareStudentAnswer === "function"
  ) {
    const comparisonResult = window.MOSComparator.compareStudentAnswer(
      studentXmlDoc,
      answerXmlDoc,
      { includeFormatting: true },
    );
    isFinalDocumentMatch = Boolean(comparisonResult && comparisonResult.passed);
  } else if (studentXmlDoc && answerXmlDoc) {
    const exactXmlMatch =
      window.MOS &&
      typeof window.MOS.compareXml === "function" &&
      window.MOS.compareXml(studentXmlDoc, answerXmlDoc);
    const formattingMatch =
      window.MOS &&
      typeof window.MOS.compareWordFormatting === "function" &&
      window.MOS.compareWordFormatting(studentXmlDoc, answerXmlDoc);
    isFinalDocumentMatch = Boolean(exactXmlMatch && formattingMatch);
  }

  if (isFinalDocumentMatch) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 6 ĐÚNG:</b> Tệp học sinh khớp với đáp án chuẩn theo bộ so sánh MOS XML.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 6 SAI:</b> Tệp học sinh chưa khớp với file đáp án chuẩn. Hệ thống đã so sánh XML và định dạng nội dung.</div>`;
  }

  return { score: score, html: resultsHTML };
};
