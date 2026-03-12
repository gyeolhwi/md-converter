# MD → DOCX / PDF 변환기

마크다운(.md) 파일을 워드(.docx) 또는 PDF 문서로 변환하는 Node.js 도구입니다.

## 폴더 구조

```
md-converter/
├── 01_TO_CONVERT/   # 변환할 MD 파일을 여기에 넣으세요
├── 02_RESULT/       # 변환된 DOCX 또는 PDF 파일
├── 03_COMPLETED/         # 변환이 끝난 원본 MD 파일 (자동 이동)
├── convert.js       # 변환 스크립트
└── package.json
```

## 설치

```bash
npm install
```

## 사용법

1. `01_TO_CONVERT/` 폴더에 변환할 `.md` 파일을 넣습니다.
2. 아래 명령어를 실행합니다.

### DOCX(워드) 변환 (기본)

```bash
npm run convert
```

### PDF 변환

```bash
npm run convert:pdf
```

3. `02_RESULT/` 폴더에서 변환된 파일을 확인합니다.
4. 변환이 완료된 원본 MD 파일은 `03_COMPLETED/` 폴더로 자동 이동됩니다.

## 지원 문법

| 문법 | 예시 |
|------|------|
| 제목 | `# H1` `## H2` `### H3` |
| 굵은 글씨 | `**굵게**` |
| 기울임 | `*기울임*` |
| 목록 | `- 항목` 또는 `1. 항목` |
| 코드 블록 | `` ```언어 ... ``` `` |
| 인라인 코드 | `` `코드` `` |
| 표 | 마크다운 테이블 문법 |
| 인용문 | `> 인용 내용` |
| 링크 | `[텍스트](URL)` |

## 실행 예시

```
$ npm run convert

3개 파일 → DOCX 변환 시작...

  [완료] 보고서.md -> 보고서.docx
  [완료] 회의록.md -> 회의록.docx
  [완료] 기획안.md -> 기획안.docx

변환 완료: 성공 3개, 실패 0개
결과물: [02_RESULT] 폴더 확인
```

```
$ npm run convert:pdf

2개 파일 → PDF 변환 시작...

  [완료] 제안서.md -> 제안서.pdf
  [완료] 매뉴얼.md -> 매뉴얼.pdf

변환 완료: 성공 2개, 실패 0개
결과물: [02_RESULT] 폴더 확인
```

## 기술 스택

- [marked](https://www.npmjs.com/package/marked) — Markdown → HTML 파싱
- [html-to-docx](https://www.npmjs.com/package/html-to-docx) — HTML → DOCX 변환
- [puppeteer](https://www.npmjs.com/package/puppeteer) — HTML → PDF 변환
