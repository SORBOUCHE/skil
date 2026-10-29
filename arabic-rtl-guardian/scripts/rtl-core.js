/**
 * Arabic RTL Core Engine (Zero-Dependency Node.js)
 * Provides comprehensive bidirectional (BiDi) correction, punctuation anchoring,
 * Latin isolation, bracket hygiene, and RTL container injection for Antigravity.
 */

const fs = require('fs');
const path = require('path');

const RLM = '\u200F'; // Unicode Right-to-Left Mark
const LRM = '\u200E'; // Unicode Left-to-Right Mark
const RLE = '\u202B'; // Right-to-Left Embedding
const PDF = '\u202C'; // Pop Directional Formatting

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Checks if a string contains Arabic characters
 */
function hasArabic(text) {
  return ARABIC_REGEX.test(text);
}

/**
 * Stabilizes trailing punctuation in Arabic sentences so it does not jump to the left
 */
function stabilizeTrailingPunctuation(text) {
  if (!hasArabic(text)) return text;

  // Match end of sentence punctuation immediately following Arabic text or markdown formatting
  // Punctuation: . , ! ? ؟ : ; ؛ ) ] }
  const lines = text.split('\n');
  const processed = lines.map(line => {
    if (!hasArabic(line)) return line;
    // If line ends with punctuation or closing bracket after Arabic characters
    return line.replace(/([\u0600-\u06FF][^\n\r]*?)([\.!\?؟:;؛\)\]\}]+)(\s*)$/, (match, prefix, punct, suffix) => {
      // If already has RLM, don't duplicate
      if (punct.includes(RLM)) return match;
      return `${prefix}${punct}${RLM}${suffix}`;
    });
  });

  return processed.join('\n');
}

/**
 * Fixes bracket/parentheses inversion when enclosing Latin/English terms inside Arabic text
 * e.g., (API) -> (‏API‏)
 */
function fixBracketHygiene(text) {
  if (!hasArabic(text)) return text;

  // Protect code blocks first
  const codeBlocks = [];
  let masked = text.replace(/```[\s\S]*?```/g, m => {
    codeBlocks.push(m);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // Isolate English terms in parentheses inside Arabic sentences
  masked = masked.replace(/([\u0600-\u06FF][^\n\r]*?)\(([A-Za-z0-9_\-\.\/\s]+)\)([^\n\r]*[\u0600-\u06FF]?)/g,
    (match, before, inner, after) => {
      return `${before}(${RLM}${inner}${RLM})${after}`;
    }
  );

  // Restore code blocks
  return masked.replace(/__CODE_BLOCK_(\d+)__/g, (_, idx) => codeBlocks[Number(idx)]);
}

/**
 * Wraps unescaped Latin/English technical terms inside Arabic sentences with backticks
 */
function isolateLatinTerms(text) {
  if (!hasArabic(text)) return text;

  const lines = text.split('\n');
  const processed = lines.map(line => {
    // Skip code blocks, headers, URLs, and table rows
    if (line.startsWith('```') || line.startsWith('#') || line.startsWith('|') || !hasArabic(line)) {
      return line;
    }

    // Isolate single standalone English keywords floating in Arabic text that are not yet in backticks or markdown links
    return line.replace(/([\u0600-\u06FF]\s+)([A-Za-z][A-Za-z0-9_\-\.]{2,})(\s+[\u0600-\u06FF])/g,
      (match, before, word, after) => {
        // Skip common markdown tags or already quoted words
        if (word === 'http' || word === 'https' || word === 'div' || word === 'span') return match;
        return `${before}\`${word}\`${after}`;
      }
    );
  });

  return processed.join('\n');
}

/**
 * Wraps Markdown or HTML content in an RTL container if it predominantly contains Arabic
 */
function wrapInRtlContainer(content) {
  if (!hasArabic(content)) return content;
  if (content.includes('dir="rtl"')) return content; // Already wrapped

  const rtlHeader = `<div dir="rtl" style="direction: rtl; text-align: right; font-family: 'Segoe UI', Tahoma, Arial, sans-serif; unicode-bidi: isolate;">\n\n`;
  const rtlFooter = `\n\n</div>`;

  return `${rtlHeader}${content}${rtlFooter}`;
}

/**
 * Full correction pipeline
 */
function correctArabicText(text, options = {}) {
  if (!text || typeof text !== 'string') return text;
  if (!hasArabic(text)) return text;

  let result = text;
  result = fixBracketHygiene(result);
  result = stabilizeTrailingPunctuation(result);

  if (options.isolateLatin) {
    result = isolateLatinTerms(result);
  }

  if (options.wrapContainer) {
    result = wrapInRtlContainer(result);
  }

  return result;
}

module.exports = {
  hasArabic,
  stabilizeTrailingPunctuation,
  fixBracketHygiene,
  isolateLatinTerms,
  wrapInRtlContainer,
  correctArabicText,
  RLM,
  LRM
};
