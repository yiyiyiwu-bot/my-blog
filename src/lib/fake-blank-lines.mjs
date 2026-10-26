// Text pasted from Word/LINE/Facebook often leaves "blank" lines that actually
// contain a non-breaking space (U+00A0) or full-width space (U+3000). The CMS
// editor shows them as empty, but Markdown treats them as text and glues the
// paragraphs around them together. Turn those lines into real blank lines.
const FAKE_BLANK_LINE = /^[ \t 　]*[ 　][ \t 　]*(?=\r?$)/gm;

export function fixFakeBlankLines(text) {
  return text.replace(FAKE_BLANK_LINE, '');
}
