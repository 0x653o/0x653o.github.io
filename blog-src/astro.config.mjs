// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';

// Built output goes into the repo's /blog folder (this project lives at
// mu1aq.github.io/blog-src). Pages serves /blog with zero CI.
export default defineConfig({
  site: 'https://mu1aq.github.io',
  base: '/blog',
  // Build into a throwaway dist/ (gitignored). postbuild copies it into the
  // committed ../blog only on success, so a failed build never wipes the site.
  outDir: 'dist',
  integrations: [
    // must come before mdx() so MDX code blocks get expressive-code frames
    expressiveCode({
      themes: ['github-dark'],
      styleOverrides: {
        borderColor: 'var(--border)',
        borderRadius: '2px',
        codeBackground: 'var(--bg-elevated)',
        codeFontFamily: "'JetBrains Mono', 'Consolas', ui-monospace, monospace",
        codeFontSize: '0.82rem',
        uiFontFamily: "'Inter', sans-serif",
        frames: {
          shadowColor: 'transparent',
          editorActiveTabBackground: 'var(--bg-elevated)',
          editorActiveTabIndicatorTopColor: 'var(--fg-muted)',
          editorTabBarBackground: 'var(--bg)',
          terminalBackground: 'var(--bg-elevated)',
          terminalTitlebarBackground: 'var(--bg)',
        },
      },
    }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          // wrap the heading text itself in the anchor — no visible "#"
          behavior: 'wrap',
          properties: { className: ['heading-link'] },
        },
      ],
    ],
  },
});
