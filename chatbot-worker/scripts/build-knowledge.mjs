import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { parseHTML } from 'linkedom';

export function extract(html, path) {
  const { document } = parseHTML(html);
  const title = document.querySelector('title')?.textContent.trim() || path;
  document.querySelectorAll('script,style,svg,nav,footer,header,noscript,template').forEach(el => el.remove());
  // Keep collapsed panels: fees, workshop details and programmes often live there.
  document.querySelectorAll('a[href]').forEach(el => {
    try {
      const url = new URL(el.getAttribute('href'), 'https://aapd2026.com/' + path);
      if (['https:', 'mailto:', 'tel:'].includes(url.protocol)) el.append(' (' + url.href + ')');
    } catch { /* Ignore malformed links; never execute repository code. */ }
  });
  document.querySelectorAll('img[alt]').forEach(el => {
    const alt = el.getAttribute('alt')?.trim();
    if (alt && alt.length > 15) el.replaceWith(document.createTextNode(' [Image description: ' + alt + '] '));
  });
  document.querySelectorAll('h1,h2,h3,h4,p,div,section,article,li,tr,td,th,br').forEach(el => {
    el.prepend('\n'); el.append('\n');
  });
  const text = document.body.textContent.replace(/[\t\r ]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { title, url: 'https://aapd2026.com/' + path, path, text };
}

async function build() {
  const worker = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const root = resolve(worker, '..');
  const paths = (await readdir(root)).filter(p => p.endsWith('.html')).sort();
  const pages = [];
  for (const path of paths) pages.push(extract(await readFile(resolve(root, path), 'utf8'), path));
  if (pages.length < 8 || pages.some(p => p.text.length < 40)) throw new Error('Conference pages missing or empty. Build stopped.');
  const content = JSON.stringify(pages);
  if (content.length > 78000) throw new Error('Knowledge exceeds pilot context limit. Add retrieval before deployment; no content was silently truncated.');
  const version = createHash('sha256').update(content).digest('hex').slice(0, 16);
  const knowledge = { version, builtAt: new Date().toISOString(), pages };
  await mkdir(resolve(worker, 'src/generated'), { recursive: true });
  await writeFile(resolve(worker, 'src/generated/knowledge.mjs'), 'export default ' + JSON.stringify(knowledge) + ';\n');
  console.log(`Knowledge ${version}: ${pages.length} HTML pages, ${content.length.toLocaleString()} characters. No embeddings or paid API calls used.`);
  console.log('Scope: published HTML text, links and image descriptions. Images/PDFs and external forms are not read. Rebuild and deploy after site changes.');
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
