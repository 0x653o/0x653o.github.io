# mu1aq.github.io/blog

This folder is the **built output** of the blog, served by GitHub Pages at
`https://mu1aq.github.io/blog`. **Do not edit files here by hand** — every build
wipes and regenerates this folder (this README included). Edit the source.

**Full authoring guide: [`../blog-src/README.md`](../blog-src/README.md).**
Quick reference below.

## Where the source lives

The blog is an Astro project in **`../blog-src`** (same repo). Write posts there,
build, then commit both `blog/` and `blog-src/`.

## New post

`blog-src/src/content/posts/<slug>/index.md` (or `.mdx` for components). One
folder = one post; folder name = URL slug (`/blog/posts/<slug>/`).

```yaml
---
title: "제목"                       # required
date: 2026-02-04                    # required (YYYY-MM-DD), sorts newest-first
author: "mu1aq"                     # optional
tags: ["security", "exploit"]       # optional → #tag chips on the list + header
description: "한 줄 요약"            # optional → list card + OG/Twitter text
cover: "./cover.png"                # optional → thumbnail (see below)
draft: false                        # optional → true hides it everywhere
---
```

### Thumbnail (`cover`)

Put the image in the post's own folder and use a relative path:

```yaml
cover: "./cover.png"
```

Shows automatically on the list card, the post header, and as the OG/Twitter
preview image. Auto-optimized to webp. Optional — omit for no thumbnail.

### Tags

Plain array → rendered as `#security #exploit` chips (labels only, no tag pages):

```yaml
tags: ["security", "exploit", "iot"]
```

## Markdown (`.md` and `.mdx`)

- Headings `##`/`###` → auto TOC box + floating rail + hover `#` copy-link.
- GFM tables (with `:---`/`:---:`/`---:` alignment), task lists `- [x]`,
  blockquotes, footnotes `[^1]`.
- Body image: `![alt](./pic.png)` (relative, auto-optimized).
- Code fence: language → highlight; `title="f.c"` → filename; `{6}` → line
  highlight; **copy button** always.
- Text color: `.md` → `<span style="color:#c9a227">x</span>`;
  `.mdx` → `<span style={{ color: '#c9a227' }}>x</span>`.

## MDX components (`.mdx` only)

Import at the top, then use:

```mdx
import Callout from '../../../components/mdx/Callout.astro';
import Tabs from '../../../components/mdx/Tabs.astro';
import Tab from '../../../components/mdx/Tab.astro';
import Details from '../../../components/mdx/Details.astro';
import Video from '../../../components/mdx/Video.astro';
import ImageRow from '../../../components/mdx/ImageRow.astro';

<Callout type="info|warning|danger" title="optional">…</Callout>

<Tabs>
  <Tab label="python">```py …```</Tab>
  <Tab label="rust">```rust …```</Tab>
</Tabs>

<Details title="spoiler">hidden until clicked</Details>

<Video src="https://youtu.be/ID" />     {/* YouTube → responsive iframe */}
<Video src="/blog/clips/demo.mp4" />     {/* local file → <video controls> */}

<ImageRow>
![left](./a.png)

![right](./b.png)                        {/* blank line between images! */}
</ImageRow>
```

## Build & deploy

```bash
cd blog-src
npm install       # first time only
npm run dev       # preview at http://localhost:4321/blog/
npm run build     # → ../blog/  (+ this README, .nojekyll, strips strays)

cd ..
git add blog blog-src .nojekyll
git commit -m "blog: <what changed>"
git push          # pushing to main deploys
```

Commit both `blog/` (published) and `blog-src/` (source).

### `.nojekyll` — keep it

Astro emits hashed assets under `blog/_astro/`. GitHub Pages runs Jekyll, which
ignores folders starting with `_`, so **without a repo-root `.nojekyll` the blog
loads unstyled**. The build writes it automatically; keep it committed.
