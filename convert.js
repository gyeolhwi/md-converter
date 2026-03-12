const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const MD_DIR = path.join(__dirname, "01_TO_CONVERT");
const OUTPUT_DIR = path.join(__dirname, "02_RESULT");
const DONE_DIR = path.join(__dirname, "03_COMPLETED");

const FORMAT = (process.argv[2] || "docx").toLowerCase();

function buildHtml(htmlContent) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; }
  h1 { font-size: 24pt; }
  h2 { font-size: 18pt; }
  h3 { font-size: 14pt; }
  code { background: #f4f4f4; padding: 2px 4px; font-family: 'Consolas', monospace; }
  pre { background: #f4f4f4; padding: 10px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f0f0f0; }
  blockquote { border-left: 4px solid #ccc; margin-left: 0; padding-left: 16px; color: #555; }
</style></head><body>${htmlContent}</body></html>`;
}

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

async function convertFile(filePath) {
  const fileName = path.basename(filePath, ".md");
  const mdContent = fs.readFileSync(filePath, "utf-8");
  const htmlContent = await marked(mdContent);
  const html = buildHtml(htmlContent);

  const ext = FORMAT;
  const outputPath = path.join(OUTPUT_DIR, `${fileName}.${ext}`);

  if (FORMAT === "pdf") {
    await convertToPdf(html, outputPath);
  } else {
    await convertToDocx(html, outputPath);
  }

  const donePath = path.join(DONE_DIR, path.basename(filePath));
  fs.renameSync(filePath, donePath);

  return { fileName, ext };
}

async function main() {
  if (!["docx", "pdf"].includes(FORMAT)) {
    console.error(`지원하지 않는 형식: ${FORMAT} (docx, pdf 중 선택)`);
    process.exit(1);
  }

  for (const dir of [MD_DIR, OUTPUT_DIR, DONE_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  const files = fs
    .readdirSync(MD_DIR)
    .filter((f) => f.toLowerCase().endsWith(".md"));

  if (files.length === 0) {
    console.log("변환할 MD 파일이 없습니다. [01_TO_CONVERT] 폴더에 파일을 넣어주세요.");
    return;
  }

  console.log(`${files.length}개 파일 → ${FORMAT.toUpperCase()} 변환 시작...\n`);

  let success = 0;
  let fail = 0;

  for (const file of files) {
    const filePath = path.join(MD_DIR, file);
    try {
      const result = await convertFile(filePath);
      console.log(`  [완료] ${result.fileName}.md -> ${result.fileName}.${result.ext}`);
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
