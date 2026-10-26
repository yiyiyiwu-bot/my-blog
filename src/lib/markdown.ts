import { marked } from 'marked';
import { fixFakeBlankLines } from './fake-blank-lines.mjs';

// Shared renderer for CMS markdown fields (intros, descriptions, hints).
export function renderMarkdown(text: string): string {
  return marked.parse(fixFakeBlankLines(text), { breaks: true, async: false });
}
