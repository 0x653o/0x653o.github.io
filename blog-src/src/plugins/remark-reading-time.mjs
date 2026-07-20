import { toString } from 'mdast-util-to-string';
import getReadingTime from 'reading-time';

export function remarkReadingTime() {
  return (tree, { data }) => {
    const readingTime = getReadingTime(toString(tree));
    data.astro.frontmatter.minutesRead = readingTime.text;
    data.astro.frontmatter.words = readingTime.words;
  };
}
