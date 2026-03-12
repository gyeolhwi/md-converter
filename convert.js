const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const INPUT_DIR = path.join(__dirname, "01_TO_CONVERT");
const OUTPUT_DIR = path.join(__dirname, "02_RESULT");
const DONE_DIR = path.join(__dirname, "03_COMPLETED");

const FORMAT = (process.argv[2] || "docx").toLowerCase();

// 지원 입력 확장자 (출력 형식별)
const INPUT_EXTS = {
  docx: [".md", ".txt"],
  pdf: [".md", ".txt"],
  md: [".docx", ".pdf"],
};

function buildHtml(htmlContent) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body {
    font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
    line-height: 1.8;
    color: #222;
    font-size: 10.5pt;
    max-width: 100%;
  }

  /* 제목 */
  h1 {
    font-size: 22pt;
    color: #1a1a2e;
    border-bottom: 3px solid #2c3e7a;
    padding-bottom: 8px;
    margin-top: 30px;
    margin-bottom: 16px;
  }
  h2 {
    font-size: 16pt;
    color: #2c3e7a;
    border-bottom: 2px solid #d1d5db;
    padding-bottom: 6px;
    margin-top: 28px;
    margin-bottom: 12px;
  }
  h3 {
    font-size: 13pt;
    color: #374151;
    margin-top: 20px;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 4px solid #2c3e7a;
  }

  /* 단락 */
  p { margin: 6px 0 10px 0; }

  /* 표 */
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 12px 0 20px 0;
    font-size: 9.5pt;
  }
  th {
    background-color: #2c3e7a;
    color: #ffffff;
    font-weight: bold;
    padding: 8px 10px;
    border: 1px solid #2c3e7a;
    text-align: left;
  }
  td {
    padding: 7px 10px;
    border: 1px solid #d1d5db;
    vertical-align: top;
  }
  tr:nth-child(even) td {
    background-color: #f3f4f6;
  }
  tr:nth-child(odd) td {
    background-color: #ffffff;
  }

  /* 인용문 */
  blockquote {
    border-left: 4px solid #2c3e7a;
    background: #eef2ff;
    margin: 12px 0;
    padding: 10px 16px;
    color: #1e3a5f;
    font-size: 10pt;
  }
  blockquote p { margin: 4px 0; }

  /* 구분선 */
  hr {
    border: none;
    border-top: 2px solid #d1d5db;
    margin: 24px 0;
  }

  /* 목록 */
  ul, ol {
    margin: 6px 0 12px 0;
    padding-left: 24px;
  }
  li { margin-bottom: 4px; }

  /* 코드 */
  code {
    background: #f1f5f9;
    padding: 1px 4px;
    font-family: 'Consolas', 'D2Coding', monospace;
    font-size: 9pt;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
  }
  pre {
    background: #f1f5f9;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 9pt;
  }
  pre code { border: none; padding: 0; background: none; }

  /* 강조 */
  strong { color: #1a1a2e; }
</style></head><body>${htmlContent}</body></html>`;
}

// ── 입력 → HTML 변환 ──

async function inputToHtml(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".md") {
    const content = fs.readFileSync(filePath, "utf-8");
    return await marked(content);
  }

  if (ext === ".txt") {
    const content = fs.readFileSync(filePath, "utf-8");
    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped
      .split(/\n\n+/)
      .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
      .join("\n");
  }

  throw new Error(`지원하지 않는 입력 형식: ${ext}`);
}

// ── 출력 변환 ──

async function convertToDocx(html, outputPath) {
  const HTMLtoDOCX = require("html-to-docx");
  const docxBuffer = await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });
  fs.writeFileSync(outputPath, docxBuffer);
}

async function convertToPdf(html, outputPath) {
  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    printBackground: true,
  });
  await browser.close();
}

async function convertToMd(filePath, outputPath) {
  const ext = path.extname(filePath).toLowerCase();
  const TurndownService = require("turndown");
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  if (ext === ".docx") {
    const mammoth = require("mammoth");
    const result = await mammoth.convertToHtml({ path: filePath });
    const md = turndown.turndown(result.value);
    fs.writeFileSync(outputPath, md, "utf-8");
    return;
  }

  if (ext === ".pdf") {
    const pdfParse = require("pdf-parse");
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    // PDF는 텍스트 추출만 가능 (서식 유지 제한적)
    fs.writeFileSync(outputPath, data.text, "utf-8");
    return;
  }

  throw new Error(`MD 변환 미지원 형식: ${ext}`);
}

// ── 파일 변환 (통합) ──

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath, ext);
  const outputPath = path.join(OUTPUT_DIR, `${fileName}.${FORMAT}`);

  if (FORMAT === "md") {
    await convertToMd(filePath, outputPath);
  } else {
    const htmlContent = await inputToHtml(filePath);
    const html = buildHtml(htmlContent);
    if (FORMAT === "pdf") {
      await convertToPdf(html, outputPath);
    } else {
      await convertToDocx(html, outputPath);
    }
  }

  const donePath = path.join(DONE_DIR, path.basename(filePath));
  fs.renameSync(filePath, donePath);

  return { fileName, inputExt: ext, outputExt: FORMAT };
}

// ── 메인 ──

async function main() {
  if (!INPUT_EXTS[FORMAT]) {
    console.error(`지원하지 않는 출력 형식: ${FORMAT}`);
    console.error(`사용 가능: docx, pdf, md`);
    process.exit(1);
  }

  for (const dir of [INPUT_DIR, OUTPUT_DIR, DONE_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const validExts = INPUT_EXTS[FORMAT];
  const files = fs
    .readdirSync(INPUT_DIR)
    .filter((f) => validExts.includes(path.extname(f).toLowerCase()));

  if (files.length === 0) {
    const extList = validExts.join(", ");
    console.log(
      `변환할 파일이 없습니다. [01_TO_CONVERT] 폴더에 ${extList} 파일을 넣어주세요.`
    );
    return;
  }

  console.log(
    `${files.length}개 파일 → ${FORMAT.toUpperCase()} 변환 시작...\n`
  );

  let success = 0;
  let fail = 0;

  for (const file of files) {
    const filePath = path.join(INPUT_DIR, file);
    try {
      const result = await convertFile(filePath);
      console.log(
        `  [완료] ${file} -> ${result.fileName}.${result.outputExt}`
      );
      success++;
    } catch (err) {
      console.error(`  [실패] ${file}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n변환 완료: 성공 ${success}개, 실패 ${fail}개`);
  console.log(`결과물: [02_RESULT] 폴더 확인`);
}

main().catch(console.error);
