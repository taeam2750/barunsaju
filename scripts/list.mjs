import fs from 'node:fs/promises';
import path from 'node:path';
import { SITE } from '../config.mjs';

// 네이버 블로그 글 목록 API를 끝까지 순회해 전체 글 메타데이터를 수집한다.
// 본문은 받지 않는다. (본문은 fetch.mjs 담당)

const OUT = path.join(process.cwd(), 'data', 'index.json');
const PER = 30;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function page(n) {
  const url =
    `https://blog.naver.com/PostTitleListAsync.naver?blogId=${SITE.blogId}` +
    `&viewdate=&currentPage=${n}&categoryNo=&parentCategoryNo=&countPerPage=${PER}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Referer: `https://blog.naver.com/${SITE.blogId}` },
  });
  if (!res.ok) throw new Error(`LIST page ${n} -> ${res.status}`);
  // 네이버 응답의 pagingHtml 필드에 JSON 규격에 없는 \' 이스케이프가 섞여 들어온다.
  const text = (await res.text()).replace(/\\'/g, "'");
  try {
    return JSON.parse(text);
  } catch {
    // 그래도 깨지면 postList 배열만 떼어 파싱한다.
    const m = text.match(/"postList"\s*:\s*(\[[\s\S]*?\])\s*,\s*"countPerPage"/);
    const total = text.match(/"totalCount"\s*:\s*"(\d+)"/)?.[1] ?? '0';
    if (!m) throw new Error(`page ${n} 파싱 실패`);
    return { postList: JSON.parse(m[1]), totalCount: total };
  }
}

const first = await page(1);
const total = Number(first.totalCount);
const pages = Math.ceil(total / PER);
console.log(`전체 ${total}건 / ${pages}페이지`);

const seen = new Map();
const collect = (list) => {
  for (const p of list) {
    if (!p.logNo || seen.has(p.logNo)) continue;
    seen.set(p.logNo, {
      logNo: p.logNo,
      title: decodeURIComponent(p.title.replace(/\+/g, ' ')),
      categoryNo: p.categoryNo,
      addDate: p.addDate, // "2026. 11. 14."
      sourceUrl: `${SITE.org.blog}/${p.logNo}`,
    });
  }
};

collect(first.postList);

for (let n = 2; n <= pages; n++) {
  try {
    const j = await page(n);
    collect(j.postList ?? []);
  } catch (e) {
    console.warn(`  ! ${n}페이지 실패: ${e.message}`);
  }
  if (n % 5 === 0 || n === pages) console.log(`  ${n}/${pages}페이지 — 누적 ${seen.size}건`);
  await sleep(700); // 목록 API는 가벼우므로 0.7초
}

const items = [...seen.values()];
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(items, null, 2), 'utf8');
console.log(`\ndata/index.json 저장 완료 — ${items.length}건 (목표 ${total}건)`);
