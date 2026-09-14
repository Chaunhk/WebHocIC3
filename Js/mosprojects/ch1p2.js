// File: JS/mosprojects/ch1p2.js
window.ch1p2 = function(
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
  const totalTasks = currentProject.tasks.length;
  console.log("========== PROJECT 2 (APPS) GRADING START ==========\n");

  // =========================================================================
  // Task 1: Shape (not text box) containing paragraph starting with "Note:"
  // =========================================================================
  let isShapeWithNoteCorrect = false;
  console.log("--- TASK 1: Check for shape with Note: ---");

  // Method 1: Check for w:pict (legacy shapes)
  const pictElements = studentXmlDoc.getElementsByTagName("w:pict");
  console.log(`Found ${pictElements.length} w:pict shape element(s)`);

  for (let i = 0; i < pictElements.length; i++) {
    const pictContent = pictElements[i].textContent.toLowerCase();
    console.log(
      `  Shape ${i}: "${pictContent.substring(0, 50)}${pictContent.length > 50 ? "..." : ""}"`,
    );

    if (pictContent.includes("note:")) {
      isShapeWithNoteCorrect = true;
      console.log("  ✅ Found shape with 'Note:' content in w:pict");
      break;
    }
  }

  // Method 2: Check for shapes in wpg (word processing group)
  if (!isShapeWithNoteCorrect) {
    const wpgElements = studentXmlDoc.getElementsByTagName("wpg:wgp");
    console.log(`Found ${wpgElements.length} wpg:wgp shape element(s)`);

    for (let i = 0; i < wpgElements.length; i++) {
      const wpgContent = wpgElements[i].textContent.toLowerCase();
      console.log(
        `  WPG Shape ${i}: "${wpgContent.substring(0, 50)}${wpgContent.length > 50 ? "..." : ""}"`,
      );

      if (wpgContent.includes("note:")) {
        isShapeWithNoteCorrect = true;
        console.log("  ✅ Found shape with 'Note:' content in wpg:wgp");
        break;
      }
    }
  }

  // Method 3: Check for any shape with text wrapping (wp:anchor)
  if (!isShapeWithNoteCorrect) {
    const anchorElements = studentXmlDoc.getElementsByTagName("wp:anchor");
    console.log(`Found ${anchorElements.length} wp:anchor element(s)`);

    for (let i = 0; i < anchorElements.length; i++) {
      const anchorContent = anchorElements[i].textContent.toLowerCase();
      console.log(
        `  Anchor ${i}: "${anchorContent.substring(0, 50)}${anchorContent.length > 50 ? "..." : ""}"`,
      );

      if (anchorContent.includes("note:")) {
        isShapeWithNoteCorrect = true;
        console.log("  ✅ Found shape with 'Note:' content in wp:anchor");
        break;
      }
    }
  }

  // Method 4: Check for inline shapes (wp:inline)
  if (!isShapeWithNoteCorrect) {
    const inlineElements = studentXmlDoc.getElementsByTagName("wp:inline");
    console.log(`Found ${inlineElements.length} wp:inline element(s)`);

    for (let i = 0; i < inlineElements.length; i++) {
      const inlineContent = inlineElements[i].textContent.toLowerCase();
      console.log(
        `  Inline ${i}: "${inlineContent.substring(0, 50)}${inlineContent.length > 50 ? "..." : ""}"`,
      );

      if (inlineContent.includes("note:")) {
        isShapeWithNoteCorrect = true;
        console.log("  ✅ Found shape with 'Note:' content in wp:inline");
        break;
      }
    }
  }

  if (isShapeWithNoteCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Đoạn văn Note: đã được đặt vào hộp văn bản (hình dạng) ở cuối trang.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Chưa tìm thấy hộp văn bản (hình dạng) chứa đoạn Note: ở cuối trang.</div>`;
  }

  // =========================================================================
  // Task 2: Margins - Top/Bottom 1.0" (1440 twips), Left/Right 1.5" (2160 twips)
  // =========================================================================
  let isMarginsCorrect = false;
  console.log("\n--- TASK 2: Check page margins ---");

  const sections = studentXmlDoc.getElementsByTagName("w:sectPr");
  const expectedTopBottom = "1440";
  const expectedLeftRight = "2160";

  for (let i = 0; i < sections.length; i++) {
    const sectPr = sections[i];
    const pgMarElements = sectPr.getElementsByTagName("w:pgMar");

    if (pgMarElements.length > 0) {
      const pgMar = pgMarElements[0];
      const top = pgMar.getAttribute("w:top");
      const bottom = pgMar.getAttribute("w:bottom");
      const left = pgMar.getAttribute("w:left");
      const right = pgMar.getAttribute("w:right");

      console.log(
        `  Section ${i}: top=${top}, bottom=${bottom}, left=${left}, right=${right}`,
      );

      if (
        top === expectedTopBottom &&
        bottom === expectedTopBottom &&
        left === expectedLeftRight &&
        right === expectedLeftRight
      ) {
        isMarginsCorrect = true;
        console.log(
          '  ✅ Margins are correct: 1.0" top/bottom, 1.5" left/right',
        );
        break;
      }
    }
  }

  if (isMarginsCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Lề trang đã được cấu hình chính xác (1.0" trên/dưới, 1.5" trái/phải).</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Lề trang không đúng. Cần: trên/dưới 1.0" (2.54cm), trái/phải 1.5" (3.81cm).</div>`;
  }

console.log(
  "studentThemeDoc:",
  studentThemeDoc
);

console.log(
  "answerThemeDoc:",
  answerThemeDoc
);
// =========================================================================
// Task 3: Lines (Simple)
// =========================================================================

function normalizeXml(xmlDoc) {
  if (!xmlDoc) return "";

  return new XMLSerializer()
    .serializeToString(xmlDoc)
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();
}

function compareXml(studentDoc, answerDoc) {
  return Boolean(studentDoc && answerDoc) &&
    normalizeXml(studentDoc) === normalizeXml(answerDoc);
}

function getRunFormatting(doc) {
  if (!doc) return null;

  return Array.from(doc.getElementsByTagName("w:r")).map((run) => {
    const runProperties = run.getElementsByTagName("w:rPr")[0];
    if (!runProperties) return "";

    return ["w:rFonts", "w:sz", "w:color"]
      .map((elementName) => {
        const element = runProperties.getElementsByTagName(elementName)[0];
        if (!element) return `${elementName}:`;

        return `${elementName}:${Array.from(element.attributes)
          .sort((first, second) => first.name.localeCompare(second.name))
          .map((attribute) => `${attribute.name}=${attribute.value}`)
          .join(",")}`;
      })
      .join("|");
  });
}

function compareWordFormatting(studentDoc, answerDoc) {
  const studentFormatting = getRunFormatting(studentDoc);
  const answerFormatting = getRunFormatting(answerDoc);

  return Boolean(studentFormatting && answerFormatting) &&
    studentFormatting.length === answerFormatting.length &&
    studentFormatting.every(
      (formatting, index) => formatting === answerFormatting[index],
    );
}

console.log("\n--- TASK 3: Compare Theme/Styles XML ---");

const studentTheme =
  normalizeXml(studentThemeDoc);

const answerTheme =
  normalizeXml(answerThemeDoc);

console.log(
  "Student Theme Length:",
  studentTheme.length
);

console.log(
  "Answer Theme Length:",
  answerTheme.length
);

const isLinesThemeCorrect =
  answerThemeDoc && studentThemeDoc
    ? studentTheme === answerTheme
    : compareXml(studentStylesDoc, answerStylesDoc);
const isWordFormattingCorrect = compareWordFormatting(
  studentXmlDoc,
  answerXmlDoc,
);
const isTask3Correct = isLinesThemeCorrect && isWordFormattingCorrect;

console.log(
  isTask3Correct
    ? "Theme/style XML and word formatting match answer"
    : "Theme/style XML or word formatting differs from answer or is unavailable",
);

if (isTask3Correct) {
  score++;
  resultsHTML += `
    <div class="status-success">
      <b>✓ Task 3 ĐÚNG:</b>
      Chủ đề Lines (Simple) đã được áp dụng.
    </div>`;
} else {
  resultsHTML += `
    <div class="status-error">
      <b>✗ Task 3 SAI:</b>
      Các thiết lập chủ đề/kiểu định dạng không khớp với đáp án.
    </div>`;
}

  // =========================================================================
  // Task 4: Page borders - Box, solid line, 1.5pt, Light Blue
  // =========================================================================
  let isPageBorderCorrect = false;
  console.log("\n--- TASK 4: Check page borders ---");

  for (let i = 0; i < sections.length; i++) {
    const sectPr = sections[i];
    const pgBordersElements = sectPr.getElementsByTagName("w:pgBorders");

    if (pgBordersElements.length > 0) {
      const pgBorders = pgBordersElements[0];
      const borderType = pgBorders.getAttribute("w:offsetFrom");
      console.log(`  Found pgBorders with offsetFrom: ${borderType}`);

      // Check individual borders (top, bottom, left, right)
      const borderElements = ["w:top", "w:bottom", "w:left", "w:right"];
      let allBordersCorrect = true;

      for (let borderTag of borderElements) {
        const borders = pgBorders.getElementsByTagName(borderTag);
        if (borders.length > 0) {
          const border = borders[0];
          const val = border.getAttribute("w:val");
          const sz = border.getAttribute("w:sz");
          const space = border.getAttribute("w:space");
          const color = border.getAttribute("w:color");

          console.log(
            `    ${borderTag}: val=${val}, sz=${sz} (1.5pt=12), color=${color}`,
          );

          // Check criteria: solid line (val=single), 1.5pt (sz=12), Light Blue (color=4472C4 or similar)
          if (val !== "single" || sz !== "12") {
            allBordersCorrect = false;
          }
        } else {
          allBordersCorrect = false;
        }
      }

      if (allBordersCorrect) {
        isPageBorderCorrect = true;
        console.log("  ✅ Page borders are correctly configured");
        break;
      }
    }
  }

  if (isPageBorderCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 4 ĐÚNG:</b> Đường viền Box đã được áp dụng đúng (đường liền, 1.5pt, Light Blue).</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 4 SAI:</b> Đường viền trang không đúng. Cần: Box, đường liền, 1.5pt width, Light Blue color.</div>`;
  }

  // =========================================================================
  // Task 5: Image (Apps.jpg) with Tight text wrapping
  // =========================================================================
  let isImageWithTightWrappingCorrect = false;
  console.log("\n--- TASK 5: Check for Apps.jpg image with Tight wrapping ---");

  // Check for images/drawings
  const drawings = studentXmlDoc.getElementsByTagName("w:drawing");
  console.log(`Found ${drawings.length} drawing element(s)`);

  let foundAppsImage = false;
  let hasCorrectWrapping = false;

  for (let i = 0; i < drawings.length; i++) {
    const drawing = drawings[i];
    const drawingXml = drawing.outerHTML.toLowerCase();

    // Check if this drawing references Apps.jpg
    if (drawingXml.includes("apps.jpg") || drawingXml.includes("apps")) {
      foundAppsImage = true;
      console.log(`  ✅ Found reference to Apps image`);

      // Check for wrapTight or similar wrapping element
      // In Word XML, tight wrapping is represented as wp:wrapTight
      const wrapElements = drawing.getElementsByTagName("wp:wrapTight");
      if (wrapElements.length > 0) {
        hasCorrectWrapping = true;
        console.log("  ✅ Found Tight text wrapping");
      } else {
        console.log("  ⚠️  Wrapping type not set to Tight");
      }

      if (foundAppsImage && hasCorrectWrapping) {
        isImageWithTightWrappingCorrect = true;
        break;
      }
    }
  }

  // Also check in rels file for Apps.jpg reference
  if (studentRelsDoc) {
    const relationships = studentRelsDoc.getElementsByTagName("Relationship");
    let foundInRels = false;
    for (let r = 0; r < relationships.length; r++) {
      const target = relationships[r].getAttribute("Target") || "";
      if (target.toLowerCase().includes("apps")) {
        console.log(`  Found in relationships: ${target}`);
        foundInRels = true;
        break;
      }
    }
  }

  if (isImageWithTightWrappingCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 5 ĐÚNG:</b> Tệp Apps.jpg đã được chèn với chế độ ngắt dòng văn bản Tight.</div>`;
  } else if (foundAppsImage) {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Tệp Apps.jpg được tìm thấy nhưng chế độ ngắt dòng văn bản không phải Tight. Hãy đặt nó thành Tight wrapping.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 5 SAI:</b> Chưa tìm thấy tệp Apps.jpg hoặc nó chưa được chèn đúng cách.</div>`;
  }

  console.log("\n========== PROJECT 2 GRADING END ==========\n");

  return { score: score, html: resultsHTML };
};