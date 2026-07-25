# 사용법 (USAGE)

`mu1aq.github.io` — 포트폴리오(정적) + `/blog`(Astro) 운영·편집·배포 가이드.

## 저장소 구조

```
mu1aq.github.io/          ← 이 repo (clone 하나면 전부)
├─ index.html, about/     포트폴리오 페이지
├─ css/style.css          포트폴리오 스타일
├─ js/main.js             포트폴리오 스크립트 (data.json 렌더)
├─ data.json              포트폴리오 콘텐츠 전부 (여기만 고치면 됨)
├─ blog/                  블로그 빌드 결과물 (직접 수정 X, 빌드가 덮어씀)
└─ blog-src/              블로그 소스 (여기서 글 씀 + 빌드)
```

- **포트폴리오**는 빌드 없음 — 파일 저장하고 새로고침하면 바로 반영.
- **블로그**는 `blog-src`에서 빌드 → `blog/`로 나감. `blog/`는 손대지 말 것.

---

## npm 명령어 전체 (전부 `blog-src/` 안에서)

| 명령 | 하는 일 |
|---|---|
| `npm install` | 의존성 설치 (**최초 1회**, 또는 package.json 바뀔 때) |
| `npm run dev` | 블로그 개발 서버 → http://localhost:4321/blog/ (핫리로드) |
| `npm run build` | 빌드 → `dist/` → 성공 시 `blog/`로 복사 (실패해도 `blog/` 안전) |
| `npm run preview` | 빌드된 결과를 Astro로 미리보기 |
| `npm run posts` | 글 목록 출력 (날짜 / slug / 제목 / [draft]) |
| `npm run post -- new <slug>` | 새 글 스캐폴드 → `src/content/posts/<slug>.mdx` |
| `npm run post -- rm <slug>` | 글 삭제 (파일이든 폴더든) + 자동 재빌드 |

> `npm run post -- ...` 의 `--` 는 npm이 인자를 스크립트로 넘기는 구분자. 빼고 쓰려면
> `node scripts/post.mjs new <slug>` / `node scripts/post.mjs rm <slug>` 로도 동일.

로컬 미리보기용 정적 서버 (repo 루트에서, 배포 재현):

```bash
python -m http.server 3100
# http://localhost:3100/            포트폴리오 홈
# http://localhost:3100/about/      about 페이지
# http://localhost:3100/blog/       빌드된 블로그 (Pages 서브패스 재현)
```

---

## 포트폴리오 편집

전부 **`data.json`** 하나에서.

```
data.json
├─ "common"    ← 공유 (한 번만 수정): timeline, projects, cves, skills,
│                links, blogs, labels, affiliations, now, interests
├─ "en" / "ko" ← user + about 만 (언어별로 다르게)
├─ "gpg"       ← GPG 공개키
└─ "discord"
```

- 대부분의 내용은 `common` 에 한 번만 → EN/KO 공통.
- 언어별로 달라야 하는 **자기소개(user)와 about 본문만** `en`/`ko` 에.
- 저장 후 http://localhost:3100/about/ 새로고침 → 즉시 반영 (빌드 불필요).

---

## 블로그 — 글 쓰기 / 관리

글은 **`blog-src/src/content/posts/`** 에서만 관리. (`blog/`에서 지워도 다음 빌드에 되살아남.)

### 새 글

```bash
cd blog-src
npm run post -- new my-post      # → src/content/posts/my-post.mdx 생성
# 파일 열어서 내용 작성
npm run build                    # blog/ 갱신
```

또는 직접 파일 생성 (둘 다 `/blog/posts/<slug>/` 로 나감):

- **플랫**: `src/content/posts/<slug>.mdx` — 파일명이 slug. 이미지 없는 글.
- **폴더**: `src/content/posts/<slug>/index.mdx` + 이미지 — 상대경로 `./cover.png` 쓸 때만.

frontmatter (맨 위, `title`·`date` **필수**):

```yaml
---
title: "제목"
date: 2026-07-26
tags: ["security", "exploit"]
description: "목록/미리보기에 나오는 한 줄"
cover: "./cover.png"    # 선택 — 썸네일 (폴더 방식일 때)
draft: false            # true 면 빌드/목록에서 숨김
---
```

`.mdx` 로 하면 컴포넌트 사용 가능: `<Callout>`, `<Tabs>`, `<Details>`, `<Video>`,
`<ImageRow>`. 문법·렌더 스크린샷은 **`blog-src/README.md`** 참고.

### 글 목록 / 삭제

```bash
npm run posts                    # 전체 목록
npm run post -- rm my-post       # 삭제 + 재빌드 (한 방에 blog/에서 사라짐)
```

---

## 배포

```bash
# repo 루트에서
git add -A
git commit -m "설명"
git push                         # push하면 GitHub Pages가 자동 배포
```

- push → `mu1aq.github.io`(포트폴리오) + `mu1aq.github.io/blog` 갱신.
- 블로그 고쳤으면 **`blog/`(결과물) + `blog-src/`(소스) 둘 다** 커밋해야 함
  (`git add -A` 면 자동 포함).

---

## 안전장치 / 문제 해결

- **빌드가 blog/ 를 날리지 않음** — Astro는 `dist/`(gitignore)에 빌드하고, 성공했을
  때만 `blog/`로 복사. 깨진 글(frontmatter 오류 등)로 빌드 실패해도 발행된 `blog/`는
  그대로. 에러 고치고 다시 빌드.
- **그래도 blog/ 가 사라졌다** → `git restore blog` 한 방에 복구.
- **새 글이 안 뜬다** → (1) 파일명이 `<slug>.mdx` 또는 `<slug>/index.mdx` 인지,
  (2) frontmatter 에 `title`·`date` 있는지, (3) `draft: false` 인지 확인.
- **블로그가 스타일 없이 깨져 보인다 (배포 후)** → repo 루트 `.nojekyll` 이 커밋됐는지
  확인 (빌드가 자동 생성). 없으면 Pages가 `_astro/` 폴더를 무시함.
- **포트폴리오 EN/KO 전환해도 특정 항목이 안 바뀐다** → 그 항목이 `common`(공유)이라
  그럼. 언어별로 나누려면 `data.json`에서 `common`→`en`/`ko`로 옮기고 `js/main.js`
  렌더 조정.

---

## 한눈에

| 하고 싶은 것 | 명령 |
|---|---|
| 포트폴리오 내용 수정 | `data.json` 편집 → 새로고침 |
| 포트폴리오 미리보기 | (루트) `python -m http.server 3100` |
| 블로그 새 글 | (blog-src) `npm run post -- new <slug>` → 편집 → `npm run build` |
| 블로그 글 삭제 | (blog-src) `npm run post -- rm <slug>` |
| 블로그 목록 | (blog-src) `npm run posts` |
| 블로그 개발 서버 | (blog-src) `npm run dev` |
| 배포 | (루트) `git add -A && git commit -m "..." && git push` |
