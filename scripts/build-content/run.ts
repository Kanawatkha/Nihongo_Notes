import { fileURLToPath } from 'node:url';
import { ContentError } from './errors.ts';
import { buildContent, writeOutput } from './index.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outDir = fileURLToPath(new URL('../../src/content/generated', import.meta.url));

try {
  const result = buildContent(root);
  writeOutput(result, outDir);
  const words = result.files.reduce(
    (sum, file) => sum + file.nodes.reduce((inner, node) => inner + node.wordCount, 0),
    0,
  );
  const readings = result.files.reduce(
    (sum, file) => sum + file.nodes.reduce((inner, node) => inner + node.readingCount, 0),
    0,
  );
  console.log(
    `content: ${result.files.length} files, ${words} words, ${readings} readings, ${result.warnings.length} warnings`,
  );
  for (const warning of result.warnings) console.warn(`warning: ${warning}`);
} catch (error) {
  if (error instanceof ContentError) {
    console.error(`content error: ${error.message}`);
  } else {
    console.error(error);
  }
  process.exit(1);
}
