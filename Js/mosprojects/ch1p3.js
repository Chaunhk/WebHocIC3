// File: JS/mosprojects/ch1p3.js
window.ch1p3 = function (
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

  console.log("========== PROJECT 3 (ICE CREAM) GRADING START ==========\n");

  // =========================================================================
  // Task 1: Table sorted by Flavor column A-Z
  // =========================================================================
  let isTableSortedCorrect = false;
  console.log("--- TASK 1: Check table sorted by Flavor A-Z ---");

  const tables = studentXmlDoc.getElementsByTagName("w:tbl");
  console.log(`Found ${tables.length} table(s)`);

  for (let t = 0; t < tables.length; t++) {
    const rows = tables[t].getElementsByTagName("w:tr");
    console.log(`  Table ${t}: ${rows.length} rows`);

    // Find the column header that contains "Flavor"
    let flavorColIndex = -1;
    const headerRow = rows[0];
    if (headerRow) {
      const headerCells = headerRow.getElementsByTagName("w:tc");
      for (let c = 0; c < headerCells.length; c++) {
        if (headerCells[c].textContent.toLowerCase().includes("flavor")) {
          flavorColIndex = c;
          console.log(`    Flavor column found at index ${c}`);
          break;
        }
      }
    }

    // Extract flavor values from data rows (skip header)
    if (flavorColIndex >= 0) {
      let flavors = [];
      for (let r = 1; r < rows.length; r++) {
        const cells = rows[r].getElementsByTagName("w:tc");
        if (cells[flavorColIndex]) {
          const flavorText = cells[flavorColIndex].textContent.trim();
          if (flavorText) {
            flavors.push(flavorText);
            console.log(`    Row ${r}: "${flavorText}"`);
          }
        }
      }

      // Check if flavors are sorted A-Z
      if (flavors.length > 1) {
        const sortedFlavors = [...flavors].sort();
        console.log(`    Flavors in document: [${flavors.join(", ")}]`);
        console.log(`    Expected order (A-Z): [${sortedFlavors.join(", ")}]`);

        if (JSON.stringify(flavors) === JSON.stringify(sortedFlavors)) {
          isTableSortedCorrect = true;
          console.log("    ✅ Table is correctly sorted A-Z by Flavor");
          break;
        } else {
          console.log("    ❌ Table is NOT sorted A-Z");
        }
      }
    }
  }

  if (isTableSortedCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Bảng đã được sắp xếp theo Flavor từ A đến Z.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Bảng chưa được sắp xếp theo Flavor từ A đến Z.</div>`;
  }

  // =========================================================================
  // Task 2: Convert text to bullet list (default bullets)
  // =========================================================================
  let isBulletListCorrect = false;
  console.log("\n--- TASK 2: Check for bullet list below Key Clients ---");

  const paragraphs = studentXmlDoc.getElementsByTagName("w:p");
  let foundKeyClients = false;
  let foundBulletedItems = false;

  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].textContent.toLowerCase().includes("key clients")) {
      foundKeyClients = true;
      console.log(`  Found "Key Clients" at paragraph ${i}`);

      // Check next paragraphs for bullet list (numPr element)
      for (let j = i + 1; j < Math.min(i + 10, paragraphs.length); j++) {
        const pPr = paragraphs[j].getElementsByTagName("w:pPr");
        if (pPr.length > 0) {
          const numPr = pPr[0].getElementsByTagName("w:numPr");
          if (numPr.length > 0) {
            foundBulletedItems = true;
            const itemText = paragraphs[j].textContent.trim();
            console.log(
              `    Found bulleted item ${j - i}: "${itemText.substring(0, 40)}..."`,
            );

            // Check if this is one of the required items
            if (
              itemText.toLowerCase().includes("party") ||
              itemText.toLowerCase().includes("scream")
            ) {
              isBulletListCorrect = true;
              break;
            }
          }
        }
      }

      if (foundBulletedItems) {
        break;
      }
    }
  }

  if (isBulletListCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Văn bản Key Clients đã được chuyển thành danh sách đầu dòng.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Chưa tìm thấy danh sách đầu dòng cho Key Clients. Hãy chuyển đổi The Party People, I Scream, U Scream thành danh sách có dấu đầu dòng.</div>`;
  }

  // =========================================================================
  // Task 3: Text box with "Austin Quote"
  // =========================================================================
  let isTextBoxWithQuoteCorrect = false;
  console.log("\n--- TASK 3: Check for text box with Austin Quote ---");

  // Method 1: Check for w:pict (legacy shapes)
  const pictElements = studentXmlDoc.getElementsByTagName("w:pict");
  console.log(`Found ${pictElements.length} w:pict shape element(s)`);

  for (let i = 0; i < pictElements.length; i++) {
    const pictContent = pictElements[i].textContent.toLowerCase();
    if (pictContent.includes("austin") || pictContent.includes("salt lake")) {
      isTextBoxWithQuoteCorrect = true;
      console.log("  ✅ Found text box with Austin Quote in w:pict");
      break;
    }
  }

  // Method 2: Check for shapes in wpg (word processing group)
  if (!isTextBoxWithQuoteCorrect) {
    const wpgElements = studentXmlDoc.getElementsByTagName("wpg:wgp");
    console.log(`Found ${wpgElements.length} wpg:wgp shape element(s)`);

    for (let i = 0; i < wpgElements.length; i++) {
      const wpgContent = wpgElements[i].textContent.toLowerCase();
      if (wpgContent.includes("austin") || wpgContent.includes("salt lake")) {
        isTextBoxWithQuoteCorrect = true;
        console.log("  ✅ Found text box with Austin Quote in wpg:wgp");
        break;
      }
    }
  }

  // Method 3: Check for shapes with text wrapping
  if (!isTextBoxWithQuoteCorrect) {
    const anchorElements = studentXmlDoc.getElementsByTagName("wp:anchor");
    console.log(`Found ${anchorElements.length} wp:anchor element(s)`);

    for (let i = 0; i < anchorElements.length; i++) {
      const anchorContent = anchorElements[i].textContent.toLowerCase();
      if (
        anchorContent.includes("austin") ||
        anchorContent.includes("salt lake")
      ) {
        isTextBoxWithQuoteCorrect = true;
        console.log("  ✅ Found text box with Austin Quote in wp:anchor");
        break;
      }
    }
  }

  if (isTextBoxWithQuoteCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 3 ĐÚNG:</b> Hộp văn bản Austin Quote đã được chèn với câu trích dẫn.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 3 SAI:</b> Chưa tìm thấy hộp văn bản Austin Quote. Hãy chèn hộp văn bản và di chuyển câu trích dẫn vào trong.</div>`;
  }

  // =========================================================================
  // Task 4: Paint Brush Artistic Effect on Ice Cream image
  // =========================================================================
  let isPaintBrushEffectCorrect = false;
  console.log("\n--- TASK 4: Check Paint Brush Artistic Effect ---");

  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  console.log(`Found ${drawings.length} drawing element(s)`);

  for (let i = 0; i < drawings.length; i++) {
    const drawing = drawings[i];
    const drawingXml = drawing.outerHTML;

    // Paint Brush artistic effect is stored in Office 2010 drawing namespace (a14)
    // Structure: <a:blip> → <a:extLst> → <a:ext> → <a14:imgProps> → <a14:imgLayer> → <a14:imgEffect> → <a14:artisticPaintBrush/>
    // We check for the a14:artisticPaintBrush element (case-sensitive namespace prefix)
    const hasPaintBrush = drawingXml.includes("a14:artisticPaintBrush");

    if (hasPaintBrush) {
      console.log(
        `  Drawing ${i}: Found Paint Brush Artistic Effect (a14:artisticPaintBrush)`,
      );
      isPaintBrushEffectCorrect = true;
      console.log("  ✅ Found Paint Brush Artistic Effect on picture");
      break;
    }
  }

  if (isPaintBrushEffectCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Paint Brush Artistic Effect đã được áp dụng cho hình ảnh Ice Cream.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Chưa áp dụng Paint Brush Artistic Effect cho hình ảnh. Hãy chọn hình → Picture Format → Artistic Effects → Paint Brush.</div>`;
  }

  // =========================================================================
  // Task 5: 3-D Rotation (Parallel, Off Axis 1: Right) on Ice Cream image
  // =========================================================================
  let is3DRotationCorrect = false;
  console.log("\n--- TASK 5: Check 3-D Rotation Picture Effect ---");

  for (let i = 0; i < drawings.length; i++) {
    const drawing = drawings[i];
    const drawingXml = drawing.outerHTML;

    // Check for 3D rotation elements
    // 3D effects are stored in a:effectLst with 3D transformation data
    const effectElements = drawing.getElementsByTagName("a:effectLst");
    if (effectElements.length > 0) {
      console.log(`  Drawing ${i}: Checking for 3D rotation effects...`);

      // Look for rotation indicators: rotX, rotY, or similar
      const effectXml = effectElements[0].outerHTML.toLowerCase();
      if (
        effectXml.includes("rot") ||
        effectXml.includes("3d") ||
        effectXml.includes("parallel") ||
        effectXml.includes("perspective")
      ) {
        is3DRotationCorrect = true;
        console.log("  ✅ Found 3D rotation effect");
        break;
      }
    }

    // Check for camera/lighting elements that indicate 3D
    const cameraElements = drawing.getElementsByTagName("a:camera");
    if (cameraElements.length > 0) {
      console.log(`  Drawing ${i}: Found camera element (3D effect detected)`);
      is3DRotationCorrect = true;
      break;
    }

    // Check for lightRig (lighting rig indicates 3D)
    const lightRigElements = drawing.getElementsByTagName("a:lightRig");
    if (lightRigElements.length > 0) {
      console.log(
        `  Drawing ${i}: Found light rig element (3D effect detected)`,
      );
      is3DRotationCorrect = true;
      break;
    }
  }

  if (is3DRotationCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> 3-D Rotation (Parallel, Off Axis 1: Right) đã được áp dụng cho hình ảnh Ice Cream.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Chưa áp dụng 3-D Rotation Picture Effect cho hình ảnh. Hãy chọn hình → Picture Format → Picture Effects → 3-D Rotation → Parallel, Off Axis 1: Right.</div>`;
  }

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
