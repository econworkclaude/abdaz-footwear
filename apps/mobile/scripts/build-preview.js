// Bundles the web export into one self-contained HTML file (for a shareable phone-browser preview).
const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const out = process.argv[2] || path.join(dist, 'preview.html');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const src = html.match(/<script src="([^"]+)" defer><\/script>/)[1];
let js = fs.readFileSync(path.join(dist, src), 'utf8');
js = js.replace(/"(\/assets\/[^"]*Ionicons[^"]*\.ttf)"/g, (_, p) => '"data:font/ttf;base64,' + fs.readFileSync(path.join(dist, p)).toString('base64') + '"');
// Start the router at "/" whatever path the page is served from.
const shim = `<script>try{if(location.pathname!=='/')history.replaceState(null,'','/'+location.search)}catch(e){}</script>`;
html = html
  .replace(/<script src="[^"]+" defer><\/script>/, () => shim + '<script>' + js.replace(/<\/script/g, '<\\/script') + '</script>')
  .replace('<link rel="icon" href="/favicon.ico"/>', '')
  .replace('<head>', '<head><meta name="theme-color" content="#080B12"><meta name="description" content="ABDAZ Footwear app demo preview">')
  .replace('<style id="expo-reset">', '<style>body{background:#080B12;margin:0}</style><style id="expo-reset">');
fs.writeFileSync(out, html);
console.log('wrote', out, (html.length / 1e6).toFixed(2) + 'MB');

// Artifact fragment (no html/head/body: the host wraps it).
if (process.argv[3]) {
  const frag = `<title>ABDAZ Footwear App</title>
<style>:root{color-scheme:dark}html,body{height:100%;background:#080B12;color:#fff}body{overflow:hidden}#root{display:flex;height:100%;flex:1}</style>
<noscript>Please enable JavaScript to try the ABDAZ demo.</noscript>
<div id="root"></div>
${shim}<script>${js.replace(/<\/script/g, '<\\/script')}</script>`;
  fs.writeFileSync(process.argv[3], frag);
  console.log('wrote', process.argv[3]);
}
