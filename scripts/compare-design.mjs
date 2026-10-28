#!/usr/bin/env node
/**
 * 시안 비교용 스크린샷 도구
 *
 * 실행 중인 개발 서버(기본 http://localhost:3000/home)를 PC(1440) · 모바일(390) 폭으로 열고,
 * data-section 속성이 있는 섹션을 하나씩 잘라 docs/compare/ 에 저장한다.
 * 저장한 이미지를 docs/design/proto-pc/ · proto-mobile/ 의 시안과 나란히 보고 비교한다.
 *
 * 사용법
 *   npm i -D playwright            # 처음 한 번 (브라우저: npx playwright install chromium)
 *   npm run dev                    # 다른 터미널에서 개발 서버 실행
 *   node scripts/compare-design.mjs            # 전체 섹션
 *   node scripts/compare-design.mjs 03-problem # 특정 섹션만
 *   BASE_URL=https://xxx.vercel.app/home node scripts/compare-design.mjs
 *
 * 애니메이션 섹션은 최종 상태로 찍기 위해 prefers-reduced-motion: reduce 로 연다
 * (20-interactions.md: reduced-motion 이면 최종 상태를 보여준다).
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000/home';
const only = process.argv[2];
const OUT = path.resolve('docs/compare');

const viewports = [
  { name: 'pc', width: 1440, height: 900, scale: 1, ref: 'docs/design/proto-pc', suffix: '' },
  { name: 'mobile', width: 390, height: 844, scale: 2, ref: 'docs/design/proto-mobile', suffix: '@2x' },
];

const browser = await chromium.launch();
try {
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.scale,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // 고정 GNB · 떠 있는 CTA · Next 개발 표시가 섹션 캡처에 겹치지 않게 한다 (시안 섹션 이미지에는 없음)
    await page.addStyleTag({
      content: 'header[data-section]{position:static!important} main ~ .fixed, nextjs-portal{display:none!important}',
    });
    await mkdir(path.join(OUT, vp.name), { recursive: true });

    const sections = await page.$$('[data-section]');
    for (const el of sections) {
      const id = await el.getAttribute('data-section');
      if (only && id !== only) continue;
      const file = path.join(OUT, vp.name, `${id}${vp.suffix}.png`);
      await el.scrollIntoViewIfNeeded();
      await el.screenshot({ path: file });
      console.log(`[${vp.name}] ${id} → ${path.relative(process.cwd(), file)}  (시안: ${vp.ref}/${id}${vp.suffix}.png)`);
    }
    if (errors.length) {
      console.log(`\n[${vp.name}] 콘솔 에러 ${errors.length}건:`);
      errors.forEach((e) => console.log('  - ' + e));
    } else {
      console.log(`[${vp.name}] 콘솔 에러 없음`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
