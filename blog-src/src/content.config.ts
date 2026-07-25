import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    // Either a flat file — "my-post.mdx" (slug = my-post) — or a folder with
    // "my-post/index.mdx" (slug = my-post; the folder lets images live next to
    // the post). Both work; use a folder only when the post has local images.
    pattern: '**/*.{md,mdx}',
    base: './src/content/posts',
    generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, '').replace(/\/index$/, ''),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      author: z.string().default('mu1aq'),
      tags: z.array(z.string()).default([]),
      description: z.string().optional(),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
