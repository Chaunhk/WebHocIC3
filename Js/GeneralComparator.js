(function () {
  "use strict";

  function normalizeXml(xmlDoc) {
    if (!xmlDoc) return "";

    const clone = xmlDoc.cloneNode(true);

    function stripIrrelevantMetadata(node) {
      if (!node || node.nodeType !== 1) return;

      const attributes = Array.from(node.attributes || []);
      attributes.forEach((attribute) => {
        const name = attribute.name || "";
        const lowerName = name.toLowerCase();

        const shouldStrip =
          lowerName === "xmlns" ||
          lowerName.startsWith("xmlns:") ||
          lowerName.startsWith("rsid") ||
          lowerName.includes(":rsid") ||
          lowerName === "id" ||
          lowerName.endsWith(":id") ||
          lowerName === "r:id" ||
          lowerName === "r:embed" ||
          lowerName === "r:link" ||
          lowerName === "xml:space" ||
          lowerName.startsWith("mc:") ||
          lowerName.includes("guid") ||
          lowerName.includes("generated");

        if (shouldStrip) {
          node.removeAttribute(attribute.name);
        }
      });

      Array.from(node.childNodes).forEach(stripIrrelevantMetadata);
    }

    stripIrrelevantMetadata(clone);

    let xmlText = "";
    if (typeof XMLSerializer !== "undefined") {
      xmlText = new XMLSerializer().serializeToString(clone);
    } else if (clone.xml) {
      xmlText = clone.xml;
    } else {
      return "";
    }

    return xmlText.replace(/>\s+</g, "><").replace(/\s+/g, " ").trim();
  }

  function getVisibleText(xmlDoc) {
    if (!xmlDoc) return "";
    const root = xmlDoc.documentElement || xmlDoc;
    return (root.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function compareXml(studentDoc, answerDoc) {
    if (!studentDoc || !answerDoc) return false;

    const normalizedStudent = normalizeXml(studentDoc);
    const normalizedAnswer = normalizeXml(answerDoc);
    if (normalizedStudent && normalizedStudent === normalizedAnswer) {
      return true;
    }

    const studentText = getVisibleText(studentDoc);
    const answerText = getVisibleText(answerDoc);
    return Boolean(studentText && answerText && studentText === answerText);
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
            .filter((attribute) => {
              const name = attribute.name || "";
              const lowerName = name.toLowerCase();
              return !(
                lowerName.startsWith("rsid") ||
                lowerName.includes(":rsid") ||
                lowerName === "id" ||
                lowerName.endsWith(":id") ||
                lowerName === "xml:space"
              );
            })
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

    if (!studentFormatting || !answerFormatting) return false;

    return (
      studentFormatting.length === answerFormatting.length &&
      studentFormatting.every(
        (formatting, index) => formatting === answerFormatting[index],
      )
    );
  }

  function compareStudentAnswer(studentDoc, answerDoc, options = {}) {
    const includeFormatting = options.includeFormatting !== false;

    const xmlMatch = compareXml(studentDoc, answerDoc);
    const formattingMatch = includeFormatting
      ? compareWordFormatting(studentDoc, answerDoc)
      : true;

    return {
      exactXmlMatch: xmlMatch,
      formattingMatch,
      passed: xmlMatch && formattingMatch,
      studentDoc,
      answerDoc,
    };
  }

  const comparator = {
    normalizeXml,
    compareXml,
    getRunFormatting,
    compareWordFormatting,
    compareStudentAnswer,
  };

  window.MOSComparator = comparator;

  window.MOS = window.MOS || {};
  window.MOS.compare = compareStudentAnswer;
  window.MOS.compareXml = compareXml;
  window.MOS.compareWordFormatting = compareWordFormatting;
})();
