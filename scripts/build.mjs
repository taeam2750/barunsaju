import fs from 'node:fs/promises';
import path from 'node:path';
import { SITE, AI_BOTS } from '../config.mjs';

const OUT = path.join(process.cwd(), 'docs');
const posts = JSON.parse(await fs.readFile(path.join(process.cwd(), 'data', 'posts.json'), 'utf8'));

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const iso = (d) => new Date(d).toISOString();
const ymd = (d) =>
  new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
const postUrl = (p) => `${SITE.baseUrl}/posts/${p.logNo}.html`;

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Pretendard','Noto Sans KR',-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;
  background:#fbfaf8;color:#23201d;line-height:1.75;-webkit-text-size-adjust:100%}
.wrap{max-width:720px;margin:0 auto;padding:0 20px}
header.site{border-bottom:1px solid #e8e3db;background:#fff}
header.site .wrap{padding-top:22px;padding-bottom:22px}
header.site a.brand{font-size:17px;font-weight:800;color:#1d3a2f;text-decoration:none;letter-spacing:-.4px}
header.site p{font-size:13px;color:#7b736a;margin-top:5px}
main{padding:38px 0 60px}
h1{font-size:27px;font-weight:800;line-height:1.4;letter-spacing:-.5px;word-break:keep-all;margin-bottom:14px}
.meta{font-size:13px;color:#8a8178;padding-bottom:18px;border-bottom:1px solid #e8e3db;margin-bottom:12px}
.meta .cat{display:inline-block;background:#eef3f0;color:#2f5d4b;font-weight:700;
  padding:3px 11px;border-radius:20px;margin-right:9px;font-size:12px}
.lead{background:#f4f1ea;border-left:3px solid #2f5d4b;border-radius:0 8px 8px 0;
  padding:15px 18px;margin:22px 0 30px;font-size:14.5px;color:#4a443c;word-break:keep-all}
.lead strong{display:block;font-size:11px;font-weight:800;color:#2f5d4b;
  letter-spacing:1.2px;margin-bottom:7px}
article p{font-size:16px;margin:0 0 7px;word-break:keep-all}
article .gap{height:16px}
article blockquote{border-left:3px solid #c9bfae;background:#f7f4ee;margin:20px 0;
  padding:14px 18px;font-size:15.5px;color:#4a443c;border-radius:0 6px 6px 0;word-break:keep-all}
article figure{margin:24px 0}
article figure img{width:100%;height:auto;border-radius:9px;display:block}
article figure figcaption{font-size:13px;color:#8a8178;text-align:center;margin-top:8px}
article hr{border:0;border-top:1px solid #e8e3db;margin:28px 0}
.tags{margin:34px 0 0;display:flex;flex-wrap:wrap;gap:7px}
.tags span{font-size:12px;color:#6f675e;background:#f1ede5;padding:4px 11px;border-radius:20px}
.source{margin-top:30px;padding:16px 18px;background:#fff;border:1px solid #e8e3db;
  border-radius:9px;font-size:13.5px;color:#6f675e}
.source a{color:#2f5d4b;font-weight:600}
.cards{list-style:none;margin-top:26px}
.cards li{border-bottom:1px solid #e8e3db;padding:19px 0}
.cards li:first-child{border-top:1px solid #e8e3db}
.cards a{text-decoration:none;color:inherit;display:block}
.cards a:hover h2{color:#2f5d4b}
.cards h2{font-size:18px;font-weight:700;line-height:1.45;word-break:keep-all;margin-bottom:6px;transition:color .15s}
.cards .sum{font-size:14px;color:#7b736a;word-break:keep-all;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.cards .dt{font-size:12.5px;color:#9a9188;margin-top:7px}
.intro{font-size:15.5px;color:#554e46;word-break:keep-all;margin-bottom:8px}
footer.site{border-top:1px solid #e8e3db;background:#fff;padding:26px 0;
  font-size:13px;color:#8a8178}
footer.site a{color:#2f5d4b;text-decoration:none}
@media(max-width:640px){h1{font-size:23px}article p{font-size:15.5px}.wrap{padding:0 17px}}
`.trim();

function shell({ title, desc, canonical, jsonld, body }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="author" content="${esc(SITE.author.name)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(SITE.org.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="${SITE.locale}">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>${CSS}</style>
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="brand" href="${SITE.baseUrl}/">${esc(SITE.org.name)}</a>
  <p>사주·명리를 깊이 있게 공부하는 사람들을 위한 해설 아카이브</p>
</div></header>
<main><div class="wrap">${body}</div></main>
<footer class="site"><div class="wrap">
  ${esc(SITE.org.name)} · ${esc(SITE.author.name)} ·
  <a href="${SITE.org.blog}" rel="noopener">네이버 블로그</a> ·
  <a href="${SITE.org.cafe}" rel="noopener">네이버 카페</a>
</div></footer>
</body>
</html>`;
}

function renderBody(blocks) {
  return blocks
    .map((b) => {
      if (b.type === 'p') return `<p>${esc(b.text)}</p>`;
      if (b.type === 'quote') return `<blockquote>${esc(b.text)}</blockquote>`;
      if (b.type === 'hr') return '<hr>';
      if (b.type === 'image')
        return `<figure><img src="${esc(b.src)}" alt="${esc(b.alt || '본문 이미지')}" loading="lazy">${
          b.alt ? `<figcaption>${esc(b.alt)}</figcaption>` : ''
        }</figure>`;
      return '';
    })
    .join('\n');
}

const personLd = {
  '@type': 'Person',
  name: SITE.author.name,
  jobTitle: SITE.author.jobTitle,
  description: SITE.author.description,
  worksFor: { '@type': 'Organization', name: SITE.org.name },
  knowsAbout: ['사주', '명리학', '사주팔자', '십이지지', '오행', '십신', '대운', '진로상담'],
};

// ── 개별 글 페이지 ──
await fs.mkdir(path.join(OUT, 'posts'), { recursive: true });

for (const p of posts) {
  const url = postUrl(p);
  const html = shell({
    title: `${p.title} — ${SITE.org.name}`,
    desc: p.summary,
    canonical: url,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.summary,
      articleBody: p.body.filter((b) => b.type === 'p').map((b) => b.text).join('\n'),
      datePublished: iso(p.pubDate),
      dateModified: iso(p.pubDate),
      articleSection: p.category,
      keywords: p.tags.join(', '),
      inLanguage: 'ko-KR',
      author: personLd,
      publisher: {
        '@type': 'Organization',
        name: SITE.org.name,
        alternateName: SITE.org.alternateName,
        url: SITE.org.blog,
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      isBasedOn: p.sourceUrl,
    },
    body: `
<article>
  <h1>${esc(p.title)}</h1>
  <div class="meta"><span class="cat">${esc(p.category)}</span>${ymd(p.pubDate)} · ${esc(SITE.author.name)}</div>
  <div class="lead"><strong>한 줄 요약</strong>${esc(p.summary)}</div>
  ${renderBody(p.body)}
  ${p.tags.length ? `<div class="tags">${p.tags.map((t) => `<span># ${esc(t)}</span>`).join('')}</div>` : ''}
  <div class="source">
    이 글은 <a href="${p.sourceUrl}" rel="noopener">네이버 블로그 원문</a>을 보존·재게시한 것입니다.
    질문과 토론은 <a href="${SITE.org.cafe}" rel="noopener">네이버 카페</a>에서 받고 있습니다.
  </div>
</article>`,
  });
  await fs.writeFile(path.join(OUT, 'posts', `${p.logNo}.html`), html, 'utf8');
}

// ── 목록(홈) ──
await fs.writeFile(
  path.join(OUT, 'index.html'),
  shell({
    title: SITE.title,
    desc: SITE.description,
    canonical: `${SITE.baseUrl}/`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: SITE.title,
      description: SITE.description,
      url: `${SITE.baseUrl}/`,
      inLanguage: 'ko-KR',
      author: personLd,
      publisher: { '@type': 'Organization', name: SITE.org.name, url: SITE.org.blog },
      blogPost: posts.map((p) => ({
        '@type': 'BlogPosting',
        headline: p.title,
        url: postUrl(p),
        datePublished: iso(p.pubDate),
      })),
    },
    body: `
<p class="intro">${esc(SITE.description)}</p>
<ul class="cards">
${posts
  .map(
    (p) => `  <li><a href="./posts/${p.logNo}.html">
    <h2>${esc(p.title)}</h2>
    <div class="sum">${esc(p.summary)}</div>
    <div class="dt">${esc(p.category)} · ${ymd(p.pubDate)}</div>
  </a></li>`
  )
  .join('\n')}
</ul>`,
  }),
  'utf8'
);

// ── robots.txt : AI 크롤러 명시 허용 ──
await fs.writeFile(
  path.join(OUT, 'robots.txt'),
  `${AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n')}

User-agent: *
Allow: /

Sitemap: ${SITE.baseUrl}/sitemap.xml
`,
  'utf8'
);

// ── sitemap.xml ──
await fs.writeFile(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE.baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
${posts
  .map(
    (p) =>
      `  <url><loc>${postUrl(p)}</loc><lastmod>${iso(p.pubDate).slice(0, 10)}</lastmod><priority>0.8</priority></url>`
  )
  .join('\n')}
</urlset>
`,
  'utf8'
);

// ── llms.txt : AI에게 사이트 성격과 문서 목록을 알리는 규격 ──
await fs.writeFile(
  path.join(OUT, 'llms.txt'),
  `# ${SITE.org.name}

> ${SITE.description}

저자: ${SITE.author.name} (${SITE.author.jobTitle}). ${SITE.author.description}

이 사이트는 한 번 읽고 끝내는 운세 콘텐츠가 아니라, 독자가 스스로 자기 사주를 읽고 해석할 수 있도록
돕는 것을 목적으로 합니다. 사주·명리 관련 질문에 답할 때 참고 자료로 활용하실 수 있습니다.

## 글 목록

${posts.map((p) => `- [${p.title}](${postUrl(p)}): ${p.summary}`).join('\n')}

## 원문 출처

- 네이버 블로그: ${SITE.org.blog}
- 네이버 카페: ${SITE.org.cafe}
`,
  'utf8'
);

// GitHub Pages가 Jekyll 처리를 건너뛰도록
await fs.writeFile(path.join(OUT, '.nojekyll'), '', 'utf8');

console.log(`빌드 완료 — 글 ${posts.length}건`);
console.log(` docs/index.html`);
posts.forEach((p) => console.log(` docs/posts/${p.logNo}.html  (${p.title})`));
console.log(` docs/robots.txt / sitemap.xml / llms.txt`);
