// ==========================================
// ĐIỀU KHIỂN LOGIC DỰ ÁN MÔ PHỎNG MOS WORD 2019
// ==========================================

// Khai báo các biến DOM Elements
const chapterDropdown = document.getElementById("chapterDropdown");
const projectTabs = document.getElementById("projectTabs");
const projectScenario = document.getElementById("projectScenario");
const downloadBtn = document.getElementById("downloadBtn");
const taskList = document.getElementById("taskList");

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const fileName = document.getElementById("fileName");
const submitBtn = document.getElementById("submitBtn");
const resultBox = document.getElementById("resultBox");
const totalScore = document.getElementById("totalScore");
const taskResults = document.getElementById("taskResults");

let courseData = null; // Lưu trữ toàn bộ dữ liệu từ manifest.json
let currentProject = null; // Lưu trữ project đang được chọn hiện tại
let selectedFile = null; // Lưu trữ file docx học sinh tải lên

// 1. TỰ ĐỘNG ĐỌC FILE MANIFEST.JSON KHI TRANG WEB KHỞI ĐỘNG
window.addEventListener("DOMContentLoaded", () => {
  fetch("Data/mosmanifest.json")
    .then((response) => {
      if (!response.ok) throw new Error("Không thể tải file mosmanifest.json");
      return response.json();
    })
    .then((data) => {
      courseData = data;
      initMenu(); // Khởi tạo menu sau khi đọc xong dữ liệu
    })
    .catch((error) => {
      console.error(error);
      projectScenario.textContent =
        "Lỗi: Không thể tải danh mục bài tập (manifest.json). Hãy kiểm tra file.";
    });
});

// 2. KHỞI TẠO MENU CHƯƠNG VÀ PROJECT
function initMenu() {
  if (!courseData || !courseData.chapters) return;

  chapterDropdown.innerHTML = "";
  const activeChapters = courseData.chapters.filter(
    (ch) => ch.projects && ch.projects.length > 0,
  );

  if (activeChapters.length === 0) {
    projectScenario.textContent = "Hiện chưa có bài tập nào được cấu hình.";
    return;
  }

  activeChapters.forEach((chapter) => {
    const option = document.createElement("option");
    option.value = chapter.chapter_id;
    option.textContent = chapter.chapter_name;
    chapterDropdown.appendChild(option);
  });

  chapterDropdown.addEventListener("change", (e) => {
    renderProjectsMenu(e.target.value);
  });

  // Mặc định hiển thị chương đầu tiên
  renderProjectsMenu(activeChapters[0].chapter_id);
}

// 3. RENDER CÁC NÚT TABS CHO PROJECT THUỘC CHƯƠNG ĐƯỢC CHỌN
function renderProjectsMenu(chapterId) {
  projectTabs.innerHTML = "";
  const chapter = courseData.chapters.find((ch) => ch.chapter_id === chapterId);

  if (!chapter || !chapter.projects || !chapter.projects.length) return;

  chapter.projects.forEach((project, index) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = project.project_name;
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadProjectDetails(project);
    });
    projectTabs.appendChild(btn);

    if (index === 0) {
      btn.classList.add("active");
      loadProjectDetails(project);
    }
  });
}

// 4. HIỂN THỊ NỘI DUNG CHI TIẾT CỦA PROJECT ĐƯỢC CHỌN
function loadProjectDetails(project) {
  currentProject = project;

  // Reset vùng nộp bài và kết quả cũ
  selectedFile = null;
  fileStatus.style.display = "none";
  submitBtn.style.display = "none";
  resultBox.style.display = "none";
  fileInput.value = "";

  // Cập nhật bối cảnh và link tải file
  projectScenario.innerHTML = `<strong>Bối cảnh (Scenario):</strong> ${project.scenario}`;
  downloadBtn.href = project.data_file_url;

  // Cập nhật danh sách Tasks
  taskList.innerHTML = "";
  project.tasks.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";
    li.innerHTML = `
            <div class="task-title">Task ${task.task_id.replace("t", "")}</div>
            <div>${task.description}</div>
        `;
    taskList.appendChild(li);
  });
}

// 5. CÁC SỰ KIỆN KÉO THẢ VÀ CHỌN TẬP TIN
dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("active");
});
dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("active");
});
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("active");
  if (e.dataTransfer.files.length > 0) {
    saveFileReference(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    saveFileReference(e.target.files[0]);
  }
});

function saveFileReference(file) {
  if (!file.name.endsWith(".docx")) {
    alert("Vui lòng chỉ nộp file có định dạng đuôi .docx");
    return;
  }
  selectedFile = file;
  fileName.textContent = file.name;
  fileStatus.style.display = "flex";
  submitBtn.style.display = "flex";
  resultBox.style.display = "none";
}

// 6. XỬ LÝ TRIGGER CHẤM BÀI CHỦ ĐỘNG (ĐÃ NÂNG CẤP TẢI FILE ĐÁP ÁN LAI)
submitBtn.addEventListener("click", () => {
  if (!selectedFile || !currentProject) return;

  // Hiển thị trạng thái đang xử lý
  submitBtn.disabled = true;
  submitBtn.textContent = "⏳ Đang chấm bài, vui lòng đợi...";

  const reader = new FileReader();
  reader.onload = async function (event) {
    try {
      // A. GIẢI NÉN FILE CỦA HỌC SINH TẢI LÊN
      const studentZip = await JSZip.loadAsync(event.target.result);
      const studentDocXmlText = await studentZip
        .file("word/document.xml")
        .async("text");
      const studentRelsXmlText = studentZip.file("word/_rels/document.xml.rels")
        ? await studentZip.file("word/_rels/document.xml.rels").async("text")
        : "";

      const parser = new DOMParser();
      const studentXmlDoc = parser.parseFromString(
        studentDocXmlText,
        "text/xml",
      );
      const studentRelsDoc = studentRelsXmlText
        ? parser.parseFromString(studentRelsXmlText, "text/xml")
        : null;

      // B. TỰ ĐỘNG TẢI FILE ĐÁP ÁN CHUẨN TỪ SERVER (GITHUB PAGES)
      // Quy ước đặt tên file đáp án: Thêm chữ '_dapan.docx' vào sau tên file gốc trong manifest
      const answerFileUrl = currentProject.data_file_url.replace(
        "Data/Mos/",
        "Data/MosAns/",
      );

      let answerXmlDoc = null;
      let answerRelsDoc = null;

      try {
        const response = await fetch(answerFileUrl);
        if (response.ok) {
          const answerBuffer = await response.arrayBuffer();
          const answerZip = await JSZip.loadAsync(answerBuffer);

          const answerDocXmlText = await answerZip
            .file("word/document.xml")
            .async("text");
          const answerRelsXmlText = answerZip.file(
            "word/_rels/document.xml.rels",
          )
            ? await answerZip.file("word/_rels/document.xml.rels").async("text")
            : "";

          answerXmlDoc = parser.parseFromString(answerDocXmlText, "text/xml");
          answerRelsDoc = answerRelsXmlText
            ? parser.parseFromString(answerRelsXmlText, "text/xml")
            : null;
        }
      } catch (fetchErr) {
        console.warn(
          "Không tìm thấy file đáp án mẫu để đối sánh nâng cao. Hệ thống sẽ chuyển sang chấm bằng XML thuần.",
          fetchErr,
        );
      }

      // C. TIẾN HÀNH ĐIỀU PHỐI CHẤM ĐIỂM LAI
      executeScoring(
        studentXmlDoc,
        studentRelsDoc,
        answerXmlDoc,
        answerRelsDoc,
      );
    } catch (err) {
      alert("Lỗi đọc cấu trúc file Word.");
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Bắt đầu chấm bài";
    }
  };
  reader.readAsArrayBuffer(selectedFile);
});

// 7. ĐIỀU PHỐI CHẤM ĐIỂM ĐỘNG QUA PLUGIN NGOÀI
function executeScoring(
  studentXmlDoc,
  studentRelsDoc,
  answerXmlDoc,
  answerRelsDoc,
) {
  const projectId = currentProject.project_id;
  const scriptUrl = `JS/mosprojects/${projectId}.js?v=${Date.now()}`; // Add timestamp to bust cache

  const oldScript = document.getElementById("project-validator-script");
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = "project-validator-script";
  script.src = scriptUrl;

  script.onload = function () {
    if (typeof window[projectId] === "function") {
      // Truyền đồng thời cả 4 đối tượng XML DOM vào file logic plugin để xử lý lai
      const response = window[projectId](
        studentXmlDoc,
        studentRelsDoc,
        answerXmlDoc,
        answerRelsDoc,
        currentProject,
      );

      totalScore.textContent = `${response.score}/${currentProject.tasks.length}`;
      taskResults.innerHTML = response.html;
      resultBox.style.display = "block";
    } else {
      alert(`Lỗi cấu trúc: Không tìm thấy hàm định danh '${projectId}'`);
    }
  };
  document.head.appendChild(script);
}
