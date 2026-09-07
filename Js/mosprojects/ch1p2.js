// Cập nhật file JS/mosprojects/ch1p1.js tích hợp Task 1 và Task 2
window.ch1p1 = function (xmlDoc, currentProject) {
  let score = 0;
  let resultsHTML = "";
  const totalTasks = currentProject.tasks.length;
  const textContent = xmlDoc.documentElement.textContent;

  // =========================================================================
  // --- TASK 1: KIỂM TRA CHUYỂN BẢNG THÀNH TEXT PHÂN TÁCH BẰNG TAB ---
  // =========================================================================
  let isTableConvertedToTabs = false;
  const paragraphs = xmlDoc.getElementsByTagName("w:p");
  const tables = xmlDoc.getElementsByTagName("w:tbl");
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
    const pText = paragraphs[i].textContent;
    if (pText.includes("Weekly Rental")) {
      let scanIndex = i + 1;
      let tabMatchedRows = 0;

      while (scanIndex < paragraphs.length && scanIndex <= i + 15) {
        const targetPara = paragraphs[scanIndex];
        const hasTabTags = targetPara.getElementsByTagName("w:tab").length > 0;
        const hasTableData =
          targetPara.textContent.includes("Aspen") ||
          targetPara.textContent.includes("Wasatch") ||
          targetPara.textContent.includes("Family Lodge");

        let isInsideTable = false;
        let parent = targetPara.parentNode;
        while (parent) {
          if (parent.nodeName === "w:tbl") {
            isInsideTable = true;
            break;
          }
          parent = parent.parentNode;
        }

        if (hasTabTags && hasTableData && !isInsideTable) {
          tabMatchedRows++;
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
    resultsHTML += `<div class="status-success"><b>✓ Task 1 ĐÚNG:</b> Bảng dưới tiêu đề 'Weekly Rental' đã được chuyển đổi thành văn bản phân tách bằng ký tự Tabs thành công.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 1 SAI:</b> Chưa chuyển đổi bảng dưới tiêu đề 'Weekly Rental' thành văn bản bằng dấu Tabs.</div>`;
  }

  // =========================================================================
  // --- TASK 2: KIỂM TRA SIÊU LIÊN KẾT (HYPERLINK) CHO TỪ "log cabin" ---
  // =========================================================================
  let isHyperlinkCorrect = false;
  console.log("Thực hiện kiểm tra task 2");
  // Bước 1: Tìm tất cả các thẻ <w:hyperlink> trong file XML
  const hyperlinkTags = xmlDoc.getElementsByTagName("w:hyperlink");

  for (let h = 0; h < hyperlinkTags.length; h++) {
    const linkText = hyperlinkTags[h].textContent.toLowerCase();

    // Bước 2: Kiểm tra xem thẻ hyperlink này có bọc chữ "log cabin" hoặc "cabin" không
    if (linkText.includes("log cabin") || linkText.includes("cabin")) {
      // Bước 3: Xác minh xem học sinh có nhập đúng URL yêu cầu không
      // Vì URL lưu ở file cấu trúc nền, khi JSZip giải nén toàn bộ file Word,
      // chuỗi URL đích sẽ xuất hiện trong luồng dữ liệu text tổng thể.
      const targetUrl = "https://wikipedia.org";

      // So khớp không phân biệt chữ hoa chữ thường
      if (
        textContent.toLowerCase().includes(targetUrl) ||
        xmlDoc.documentElement.innerHTML.toLowerCase().includes(targetUrl)
      ) {
        isHyperlinkCorrect = true;
        break;
      }
    }
  }

  if (isHyperlinkCorrect) {
    score++;
    resultsHTML += `<div class="status-success"><b>✓ Task 2 ĐÚNG:</b> Văn bản 'log cabin' đã được chèn liên kết chính xác đến trang Wikipedia yêu cầu.</div>`;
  } else {
    resultsHTML += `<div class="status-error"><b>✗ Task 2 SAI:</b> Từ khóa 'log cabin' chưa được chèn siêu liên kết, hoặc đường dẫn URL nhập vào chưa chính xác.</div>`;
  }

  // =========================================================================
  // --- CÁC TASK CÒN LẠI (Tạm thời báo lỗi chờ viết thuật toán) ---
  // =========================================================================
  for (let i = 3; i <= totalTasks; i++) {
    resultsHTML += `<div class="status-error"><b>✗ Task ${i} SAI:</b> Hệ thống đang chờ cập nhật thuật toán chấm điểm.</div>`;
  }

  // Trả kết quả về cho file app.js hiển thị lên trang web
  return {
    score: score,
    html: resultsHTML,
  };
};
