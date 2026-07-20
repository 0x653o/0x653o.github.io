import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    // "my-post/index.mdx" -> id "my-post"
    generateId: ({ entry }) => entry.replace(/\/index\.(md|mdx)$/, ''),
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
