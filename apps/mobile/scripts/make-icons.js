// Renders the ABDAZ logo SVG into the PNG app icons. Run: node scripts/make-icons.js
const { chromium } = require('playwright');
const path = require('path');
const A = (fill) => `<path d="M50 8 L90 92 L72 92 L50 42 L28 92 L10 92 Z" fill="${fill}"/><path d="M30 70 L52 70 L52 62 L70 62 L74 72 L56 72 L56 80 L27 80 Z" fill="#080B12"/><path d="M33 72 L54 72 L54 64 L68 64 L70 69 L58 69 L58 77 L31 77 Z" fill="${fill}"/>`;
const defs = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F1D38A"/><stop offset=".55" stop-color="#D8AE57"/><stop offset="1" stop-color="#B98C35"/></linearGradient><radialGradient id="bg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#1B1F2A"/><stop offset="1" stop-color="#080B12"/></radialGradient></defs>`;
const font = `font-family="Helvetica, Arial, sans-serif" font-weight="800"`;
const icons = {
  'icon.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}<rect width="100" height="100" fill="url(#bg)"/><g transform="translate(20 16) scale(.6)">${A('url(#g)')}</g><text x="50" y="86" text-anchor="middle" font-size="9" letter-spacing="2.4" ${font} fill="url(#g)">ABDAZ</text></svg>`],
  'icon-admin.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}<rect width="100" height="100" fill="url(#bg)"/><g transform="translate(22 12) scale(.56)">${A('url(#g)')}</g><rect x="26" y="74" width="48" height="13" rx="6.5" fill="url(#g)"/><text x="50" y="83.5" text-anchor="middle" font-size="7.5" letter-spacing="1.6" ${font} fill="#080B12">ADMIN</text></svg>`],
  'adaptive-icon.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}<g transform="translate(30 27) scale(.4)">${A('url(#g)')}</g><text x="50" y="76" text-anchor="middle" font-size="6.5" letter-spacing="1.6" ${font} fill="url(#g)">ABDAZ</text></svg>`],
  'adaptive-admin.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}<g transform="translate(31 25) scale(.38)">${A('url(#g)')}</g><rect x="35" y="67" width="30" height="9" rx="4.5" fill="url(#g)"/><text x="50" y="73.6" text-anchor="middle" font-size="5" letter-spacing="1" ${font} fill="#080B12">ADMIN</text></svg>`],
  'splash-icon.png': [1024, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}<g transform="translate(25 12) scale(.5)">${A('url(#g)')}</g><text x="50" y="76" text-anchor="middle" font-size="11" letter-spacing="3" ${font} fill="url(#g)">ABDAZ</text><text x="50" y="86" text-anchor="middle" font-size="4.2" letter-spacing="2.6" ${font} fill="#fff">FOOTWEAR</text></svg>`],
  'favicon.png': [64, null],
};
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [name, [size, svg]] of Object.entries(icons)) {
    const s = svg ?? icons['icon.png'][1];
    await p.setViewportSize({ width: size, height: size });
    await p.setContent(`<html><body style="margin:0;background:transparent">${s.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, '..', 'assets', name), omitBackground: true });
  }
  await b.close();
  console.log('icons written');
})();
