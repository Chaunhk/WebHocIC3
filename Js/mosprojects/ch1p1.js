// File: JS/mosprojects/ch1p1.js
window.ch1p1 = function (
  studentXmlDoc,
  studentRelsDoc,
  answerXmlDoc,
  answerRelsDoc,
  currentProject,
) {
  let score = 0;
  let resultsHTML = "";
  const totalTasks = currentProject.tasks.length;

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
            if (parent.nodeName === "w:tbl") {
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

  // Task 3: Continuous Section Break (NEW APPROACH: Find LAST sectPr after Affordable Pricing)
  let isContinuousBreakCorrect = false;
  console.log("========== TASK 3 DEBUG START ==========");

  let affordablePricingIndex = -1;
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].textContent.includes("Affordable Pricing")) {
      affordablePricingIndex = i;
      console.log(`✓ Found "Affordable Pricing" at paragraph index ${i}`);
      break;
    }
  }

  if (affordablePricingIndex === -1) {
    console.log(
      "❌ ERROR: Did not find 'Affordable Pricing' text anywhere in document",
    );
  } else {
    // Find ALL sectPr elements in the ENTIRE document and check the ones AFTER "Affordable Pricing"
    console.log(
      `\nSearching for section breaks AFTER "Affordable Pricing" (paragraph ${affordablePricingIndex})...`,
    );

    let allSectPrFound = [];
    for (let i = affordablePricingIndex; i < paragraphs.length; i++) {
      const pPrTags = paragraphs[i].getElementsByTagName("w:pPr");
      if (pPrTags.length > 0) {
        const pPr = pPrTags[0];
        for (let a = 0; a < pPr.children.length; a++) {
          if (pPr.children[a].localName === "sectPr") {
            const sectPr = pPr.children[a];

            // Find type element in this sectPr
            for (let b = 0; b < sectPr.children.length; b++) {
              if (sectPr.children[b].localName === "type") {
                const typeValue = sectPr.children[b].getAttribute("w:val");
                allSectPrFound.push({ paraIndex: i, typeValue: typeValue });
                console.log(
                  `  └─ Paragraph ${i}: Found sectPr with type = "${typeValue}"`,
                );
                break;
              }
            }
          }
        }
      }
    }

    if (allSectPrFound.length === 0) {
      console.log(
        "❌ ERROR: No section breaks found after 'Affordable Pricing'",
      );
    } else {
      // Check the LAST section break found (most recent)
      const lastSectPr = allSectPrFound[allSectPrFound.length - 1];
      console.log(
        `\n✓ LATEST section break: Paragraph ${lastSectPr.paraIndex}, type = "${lastSectPr.typeValue}"`,
      );

      if (lastSectPr.typeValue === "continuous") {
        console.log("✅ ACCEPTED: Latest break type is continuous");
        isContinuousBreakCorrect = true;
      } else {
        console.log(
          `❌ REJECTED: Latest break type is "${lastSectPr.typeValue}", not "continuous"`,
        );
      }
    }
  }

  console.log("========== TASK 3 DEBUG END ==========\n");

  if (isContinuousBreakCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Đã chèn Continuous Section Break thành công.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa tìm thấy dấu ngắt phần loại Continuous. (Bạn có thể đã dùng: Next Page, Odd Page, Even Page, v.v... - Phải dùng CONTINUOUS BREAK)</div>`;
  }

  // =========================================================================
  // --- TASK 4: KIỂM TRA ĐỔI BULLET THÀNH HÌNH ẢNH (Trees.png) - SỬA LỖI CHẤM NHẦM ---
  // =========================================================================
  let isPictureBulletCorrect = false;
  let hasTreesImageInRels = false;

  // Bước 1: Kiểm tra xem trong danh sách mối quan hệ tài liệu (.rels)
  // có xuất hiện tệp tin hình ảnh có tên chứa từ khóa "trees" hay không
  if (studentRelsDoc) {
    const relationships = studentRelsDoc.getElementsByTagName("Relationship");
    for (let r = 0; r < relationships.length; r++) {
      const targetAttr = relationships[r].getAttribute("Target") || "";
      const typeAttr = relationships[r].getAttribute("Type") || "";

      // Nếu mối quan hệ thuộc kiểu image và đường dẫn file chứa chữ "trees"
      if (
        typeAttr.includes("image") &&
        targetAttr.toLowerCase().includes("trees")
      ) {
        hasTreesImageInRels = true;
        break;
      }
    }
  }

  // Bước 2: Xác minh xem đoạn văn danh sách mục tiêu có thực sự được áp dụng định dạng list hay không
  if (hasTreesImageInRels) {
    for (let i = 0; i < paragraphs.length; i++) {
      // Định vị đoạn văn đầu tiên của danh sách
      if (paragraphs[i].textContent.includes("Living area with a couch")) {
        const pPrTags = paragraphs[i].getElementsByTagName("w:pPr");
        if (pPrTags.length > 0) {
          const numPrTags = pPrTags[0].getElementsByTagName("w:numPr");

          // Nếu đoạn văn thực sự có thẻ danh sách và file chứa ảnh trees -> Hợp lệ
          if (numPrTags.length > 0) {
            isPictureBulletCorrect = true;
            break;
          }
        }
      }
    }
  }

  if (isPictureBulletCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Ký hiệu danh sách đầu dòng đã được thay thế bằng hình ảnh Trees.png chính xác.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa thay thế các dấu đầu dòng của danh sách thành hình ảnh Trees.png (Hoặc bạn chèn sai file ảnh).</div>`;
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
