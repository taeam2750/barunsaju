import fs from 'node:fs/promises';
import path from 'node:path';
import { SITE } from '../config.mjs';

// 네이버 블로그에 설정된 카테고리 순서를 그대로 가져온다.
// 배열 순서가 블로그 사이드바 표시 순서다. (글 수 순서가 아님)

const OUT = path.join(process.cwd(), 'data', 'categories.json');
const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1';

const res = await fetch(`https://m.blog.naver.com/api/blogs/${SITE.blogId}/category-list`, {
  headers: { 'User-Agent': UA, Referer: `https://m.blog.naver.com/${SITE.blogId}` },
});
if (!res.ok) throw new Error(`category-list HTTP ${res.status}`);

// 일부 응답은 XSSI 방어 접두사 )]}', 가 붙어 온다.
const json = JSON.parse((await res.text()).replace(/^\)\]\}',?\s*/, ''));
const list = json.result?.mylogCategoryList ?? [];
if (!list.length) throw new Error('카테고리 목록이 비어 있습니다');

const cats = list
  .filter((c) => c.openYN && !c.divisionLine)
  .map((c, i) => ({
    no: String(c.categoryNo),
    name: c.categoryName,
    order: i,
    postCnt: c.postCnt,
    parentNo: c.parentCategoryNo ? String(c.parentCategoryNo) : null,
    isChild: Boolean(c.childCategory),
  }));

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(cats, null, 2), 'utf8');

console.log(`data/categories.json 저장 — ${cats.length}개 (블로그 표시 순서)`);
cats.forEach((c) => console.log(`  ${String(c.order + 1).padStart(2)}. ${c.name} (${c.postCnt}편)`));
