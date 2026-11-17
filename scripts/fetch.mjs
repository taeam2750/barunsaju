import fs from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { SITE } from '../config.mjs';

const LIMIT = Number(process.env.LIMIT ?? 1);
const DATA = path.join(process.cwd(), 'data', 'posts.json');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cdata(block, tag) {
  const m = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
  return m ? m[1].trim() : '';
}

async function readRss() {
  const res = await fetch(SITE.rss, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  const xml = await res.text();

  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const b = m[1];
    const guid = cdata(b, 'guid') || cdata(b, 'link');
    return {
      logNo: guid.match(/\/(\d+)/)?.[1] ?? '',
      title: cdata(b, 'title'),
      category: cdata(b, 'category'),
      pubDate: cdata(b, 'pubDate'),
      tags: cdata(b, 'tag').split(',').map((t) => t.trim()).filter(Boolean),
      sourceUrl: `${SITE.org.blog}/${guid.match(/\/(\d+)/)?.[1] ?? ''}`,
    };
  });
}

// 네이버 스마트에디터3(se-main-container) 본문을 문단/이미지 블록 배열로 변환한다.
function extractBody($) {
  const root = $('.se-main-container').first();
  if (!root.length) return [];

  const blocks = [];
  root.find('.se-component').each((_, el) => {
    const $c = $(el);
    const cls = $c.attr('class') ?? '';

    if (cls.includes('se-image')) {
      const $img = $c.find('img').first();
      const src = $img.attr('data-lazy-src') || $img.attr('src');
      if (src) {
        blocks.push({
          type: 'image',
          // ?type=w80_blur 같은 썸네일 파라미터를 원본 크기로 교체
          src: src.replace(/\?type=\w+$/, '?type=w966'),
          alt: $c.find('.se-caption').text().trim() || '',
        });
      }
      return;
    }

    if (cls.includes('se-quotation')) {
      const t = $c.text().trim().replace(/\s+/g, ' ');
      if (t) blocks.push({ type: 'quote', text: t });
      return;
    }

    if (cls.includes('se-horizontalLine')) {
      blocks.push({ type: 'hr' });
      return;
    }

    if (cls.includes('se-text')) {
      $c.find('.se-text-paragraph').each((__, p) => {
        const t = $(p).text().replace(/\u200b/g, '').trim();
        if (t) blocks.push({ type: 'p', text: t });
      });
    }
  });

  // 연속 빈 줄 정리
  return blocks.filter((b, i, a) => !(b.type === 'hr' && a[i - 1]?.type === 'hr'));
}

async function fetchPost(meta) {
  const url = `https://blog.naver.com/PostView.naver?blogId=${SITE.blogId}&logNo=${meta.logNo}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`POST ${meta.logNo} -> ${res.status}`);

  const $ = cheerio.load(await res.text());
  const body = extractBody($);
  const plain = body.filter((b) => b.type === 'p').map((b) => b.text).join(' ');

  return {
    ...meta,
    body,
    summary: plain.slice(0, 180).trim() + (plain.length > 180 ? '…' : ''),
    charCount: plain.length,
    fetchedAt: new Date().toISOString(),
  };
}

const items = (await readRss()).slice(0, LIMIT);
console.log(`RSS ${items.length}건 수집 대상`);

let store = [];
try {
  store = JSON.parse(await fs.readFile(DATA, 'utf8'));
} catch {}

for (const it of items) {
  if (store.some((p) => p.logNo === it.logNo)) {
    console.log(`  - 건너뜀(이미 있음): ${it.title}`);
    continue;
  }
  const post = await fetchPost(it);
  store.push(post);
  console.log(`  + ${post.title} (${post.charCount}자, 블록 ${post.body.length}개)`);
  await sleep(1200); // 네이버 서버 배려
}

store.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
await fs.mkdir(path.dirname(DATA), { recursive: true });
await fs.writeFile(DATA, JSON.stringify(store, null, 2), 'utf8');
console.log(`저장 완료: 총 ${store.length}건`);
