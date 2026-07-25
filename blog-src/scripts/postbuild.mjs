// Runs only after a SUCCESSFUL `astro build` (chained with && in package.json).
// Astro builds into blog-src/dist (gitignored); this copies that fresh output
// into the committed ../blog. Because it runs only on success, a failed build
// can never wipe the published site. It also strips inert content-layer
// artifacts and writes the repo-root .nojekyll + the in-folder README.
import { rm, cp, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dist = new URL('../dist/', import.meta.url); // blog-src/dist
const out = new URL('../../blog/', import.meta.url); // repo/blog
const strays = ['content-modules.mjs', 'content-assets.mjs', 'collections', 'data-store.json', 'settings.json'];

// replace the committed blog/ with the fresh build
await rm(out, { recursive: true, force: true });
await cp(dist, out, { recursive: true });

// strip inert content-layer files Astro emits into the output root
for (const name of strays) {
  await rm(new URL(name, out), { recursive: true, force: true });
}

// repo-root .nojekyll so Pages serves the _astro/ assets
await writeFile(new URL('../.nojekyll', out), '');

// authoring/deploy guide inside the published folder
await copyFile(new URL('../blog-readme.md', import.meta.url), new URL('README.md', out));

console.log('postbuild: copied dist -> blog, stripped strays, wrote .nojekyll + blog/README.md');
console.log('  output:', fileURLToPath(out));
