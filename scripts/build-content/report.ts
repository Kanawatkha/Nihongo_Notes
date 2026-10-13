import type {
  ContentFile,
  ContentNode,
  Manifest,
  ManifestHeading,
} from '../../src/content/types.ts';
import { textOf } from './parse.ts';

function headingsOf(nodes: ContentNode[], out: ManifestHeading[] = []): ManifestHeading[] {
  for (const node of nodes) {
    out.push({
      id: node.id,
      level: node.level,
      ...(node.number ? { number: node.number } : {}),
      title: textOf(node.title),
      wordCount: node.wordCount,
      readingCount: node.readingCount,
    });
    headingsOf(node.children, out);
  }
  return out;
}

export function buildManifest(files: ContentFile[]): Manifest {
  return {
    files: files.map((file) => ({
      collection: file.collection,
      key: file.key,
      ...file.meta,
      title: textOf(file.title),
      wordCount: file.nodes.reduce((sum, node) => sum + node.wordCount, 0),
      readingCount: file.nodes.reduce((sum, node) => sum + node.readingCount, 0),
      headings: headingsOf(file.nodes),
    })),
  };
}

/** Human-readable counts, reviewed by the user against the Markdown (PLAN.md Phase 2). */
export function buildReport(files: ContentFile[], warnings: string[]): string {
  const lines: string[] = [];
  let totalWords = 0;
  let totalReadings = 0;

  for (const file of files) {
    const words = file.nodes.reduce((sum, node) => sum + node.wordCount, 0);
    const readings = file.nodes.reduce((sum, node) => sum + node.readingCount, 0);
    totalWords += words;
    totalReadings += readings;
    lines.push(`${file.collection}/${file.key}  words ${words}  readings ${readings}`);

    const visit = (nodes: ContentNode[], depth: number) => {
      for (const node of nodes) {
        const label = `${node.number ? `${node.number} ` : ''}${textOf(node.title)}`;
        lines.push(
          `${'  '.repeat(depth)}- ${label}  words ${node.wordCount}  readings ${node.readingCount}`,
        );
        visit(node.children, depth + 1);
      }
    };
    visit(file.nodes, 1);
    lines.push('');
  }

  lines.push(`TOTAL  words ${totalWords}  readings ${totalReadings}`);
  lines.push('');
  lines.push(warnings.length === 0 ? 'Warnings: none' : `Warnings (${warnings.length}):`);
  for (const warning of warnings) lines.push(`- ${warning}`);
  lines.push('');
  return lines.join('\n');
}
