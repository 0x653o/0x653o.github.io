---
title: "Booting the mu1aq dev blog"
date: 2026-03-02
author: "mu1aq"
tags: ["meta", "astro"]
description: "터미널 다크 톤 마크다운 블로그를 Astro로 세우고 mu1aq.github.io/blog 서브패스로 배포한 기록."
cover: "./cover.png"
draft: false
---

포트폴리오는 순수 정적으로 두고, 글은 별도 Astro 프로젝트에서 빌드해 `/blog`
서브패스로만 올린다. CI 없이 **빌드 결과만 커밋**하는 무빌드 배포 원칙을 그대로 유지한다.

## Why a separate build

포트폴리오 repo는 빌드 스텝이 전혀 없다. 블로그를 같은 방식으로 두면 마크다운
파이프라인·문법 하이라이트·TOC를 전부 손으로 재구현해야 한다. 대신 소스는 `blog-src`에
두고 산출물 `dist`만 `mu1aq.github.io/blog/`로 복사한다.

- 소스와 `node_modules`는 Pages가 서빙하지 않는다
- 결과물은 해시된 에셋을 `_astro/`에 담는다 → 루트 `.nojekyll` 필수
- push 한 번으로 배포, 롤백은 git revert

## Table example

| 단계 | 명령 | 결과물 |
| --- | --- | --- |
| dev | `npm run dev` | localhost:4321/blog |
| build | `npm run build` | ../mu1aq.github.io/blog |
| deploy | `git push` | mu1aq.github.io/blog |

## Code with copy button

```py title="deploy_check.py" {4-5}
import pathlib

def assert_nojekyll(pages_root: pathlib.Path) -> None:
    if not (pages_root / ".nojekyll").exists():
        raise SystemExit("missing .nojekyll — _astro assets will 404")
    print("ok: nojekyll present")

assert_nojekyll(pathlib.Path("../mu1aq.github.io"))
```

인라인 코드도 구분된다: `import.meta.env.BASE_URL` 를 링크·이미지에 반영한다.

## Text color in plain markdown

순수 `.md` 에서는 raw HTML 로 색을 넣는다:
<span style="color:#c9a227">gold</span>,
<span style="color:#7ca2c9">steel</span>,
<span style="color:#a85751">danger</span>.

## Cover image as figure

![terminal boot splash](./cover.png)

> 다음 글에서 표·영상·콜아웃·탭 등 마크다운 기능을 한 번에 점검한다.

- [x] Astro 최소 셋업
- [x] base / outDir / .nojekyll
- [ ] 첫 실전 취약점 노트
