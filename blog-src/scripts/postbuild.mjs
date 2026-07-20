// Astro's content layer emits inert metadata files into the static output
// (content-*.mjs, collections/). They're never referenced by any HTML — strip
// them and drop a .nojekyll so GitHub Pages serves the _astro/ asset folder.
import { rm, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const out = new URL('../../blog/', import.meta.url);
const strays = ['content-modules.mjs', 'content-assets.mjs', 'collections', 'data-store.json', 'settings.json'];

for (const name of strays) {
  await rm(new URL(name, out), { recursive: true, force: true });
}

// repo-root .nojekyll (one level above /blog)
await writeFile(new URL('../.nojekyll', out), '');

// authoring/deploy guide inside the published folder (outDir is wiped each
// build, so regenerate it here from the source copy)
await copyFile(new URL('../blog-readme.md', import.meta.url), new URL('README.md', out));

console.log('postbuild: stripped content-layer strays, wrote .nojekyll + blog/README.md');
console.log('  output:', fileURLToPath(out));
