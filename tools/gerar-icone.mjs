import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 512, height: 512 } });
await p.setContent(`<body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" rx="96" fill="#1e1e1e"/><circle cx="256" cy="140" r="52" fill="#fff" stroke="#ff8a3d" stroke-width="14"/><g stroke="#ff8a3d" stroke-width="22" stroke-linecap="round" fill="none"><path d="M256 192v130M256 222l-84 64M256 222l84 64M256 322l-70 110M256 322l70 110"/></g></svg></body>`);
await p.screenshot({ path: 'assets/icon.png', omitBackground: true });
await b.close();
