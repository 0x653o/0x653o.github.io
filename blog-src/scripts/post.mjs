// Manage blog posts from the source of truth (src/content/posts/).
// Deleting files under ../blog does nothing — the build regenerates blog/ from
// here every time. Use this instead.
//
//   node scripts/post.mjs list
//   node scripts/post.mjs new <slug>
//   node scripts/post.mjs rm  <slug>
//
// (or via npm: `npm run posts`, `npm run post -- new <slug>`, `npm run post -- rm <slug>`)
import { readdir, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const POSTS = fileURLToPath(new URL('../src/content/posts/', import.meta.url));
const ROOT = fileURLToPath(new URL('../', import.meta.url));

async function walk(dir, base = '') {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await walk(`${dir}${e.name}/`, rel)));
    else if (/\.(md|mdx)$/.test(e.name)) out.push(rel);
  }
  return out;
}

const slugOf = (rel) => rel.replace(/\.(md|mdx)$/, '').replace(/\/index$/, '');
const fm = (c, k) => {
  const m = c.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
};

// resolve a slug to its on-disk source (flat file or folder), or null
function resolve(slug) {
  for (const cand of [`${slug}.mdx`, `${slug}.md`]) if (existsSync(POSTS + cand)) return cand;
  if (existsSync(POSTS + slug)) return slug; // folder (slug/index.*)
  return null;
}

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'list') {
  const rows = [];
  for (const f of await walk(POSTS)) {
    const slug = slugOf(f);
    if (slug.startsWith('_')) continue; // hidden keep-alive placeholder(s)
    const c = await readFile(POSTS + f, 'utf8');
    rows.push({ slug, date: fm(c, 'date'), draft: fm(c, 'draft') === 'true', title: fm(c, 'title'), file: f });
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  console.log(`${rows.length} post(s):`);
  for (const r of rows) {
    console.log(`  ${(r.date || '----------').padEnd(11)} ${r.slug.padEnd(24)} ${r.draft ? '[draft] ' : ''}${r.title}`);
  }
} else if (cmd === 'new') {
  if (!arg) { console.error('usage: post new <slug>'); process.exit(1); }
  if (arg.startsWith('_')) { console.error('slug cannot start with "_"'); process.exit(1); }
  if (resolve(arg)) { console.error(`post "${arg}" already exists`); process.exit(1); }
  const today = new Date().toISOString().slice(0, 10);
  const dir = `${POSTS}${arg}/`;
  // folder post: index.mdx + a dedicated images/ folder (.gitkeep so it commits empty)
  await mkdir(`${dir}images/`, { recursive: true });
  await writeFile(`${dir}images/.gitkeep`, '');
  const tmpl = `---
title: "${arg}"
date: ${today}
tags: []
description: ""
# cover: "./images/cover.png"   # 썸네일: 이미지를 images/ 에 넣고 이 줄 주석 해제
draft: false
---

여기에 작성.

{/* 이미지: images/ 폴더에 넣고  ![설명](./images/파일.png)  로 삽입 */}
`;
  await writeFile(`${dir}index.mdx`, tmpl);
  console.log(`created src/content/posts/${arg}/index.mdx  → /blog/posts/${arg}/`);
  console.log(`  images → src/content/posts/${arg}/images/   (reference as ./images/...)`);
  console.log('edit it, then:  npm run build');
} else if (cmd === 'rm') {
  if (!arg) { console.error('usage: post rm <slug>'); process.exit(1); }
  if (arg.startsWith('_')) { console.error(`"${arg}" is a keep-alive placeholder — do not delete it`); process.exit(1); }
  const target = resolve(arg);
  if (!target) { console.error(`no post "${arg}" (see: npm run posts)`); process.exit(1); }
  await rm(POSTS + target, { recursive: true, force: true });
  console.log(`removed ${target} — rebuilding blog/ …`);
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  console.log(`done — "${arg}" is gone from /blog.`);
} else {
  console.log('usage: node scripts/post.mjs <list | new <slug> | rm <slug>>');
}
