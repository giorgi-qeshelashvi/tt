const fs = require('fs');
const path = require('path');
const { minify: minifyJS } = require('terser');
const CleanCSS = require('clean-css');
const { minify: minifyHTML } = require('html-minifier-terser');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

// ამას არასდროს ვამუშავებთ და არ ვაკოპირებთ
const IGNORE = new Set([
  'node_modules', 'dist', '.git', '.github', '.vscode',
  'build.js', 'package.json', 'package-lock.json', '.gitignore',
]);

async function processFile(srcPath, destPath) {
  const ext = path.extname(srcPath).toLowerCase();
  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  if (srcPath.endsWith('.min.js') || srcPath.endsWith('.min.css')) {
    fs.copyFileSync(srcPath, destPath); // უკვე დაპატარავებულია
  } else if (ext === '.js') {
    const code = fs.readFileSync(srcPath, 'utf8');
    const result = await minifyJS(code, { compress: true, mangle: true });
    fs.writeFileSync(destPath, result.code);
  } else if (ext === '.css') {
    const code = fs.readFileSync(srcPath, 'utf8');
    fs.writeFileSync(destPath, new CleanCSS({ level: 2 }).minify(code).styles);
  } else if (ext === '.html') {
    const code = fs.readFileSync(srcPath, 'utf8');
    const result = await minifyHTML(code, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
    });
    fs.writeFileSync(destPath, result);
  } else {
    fs.copyFileSync(srcPath, destPath); // სურათები, ფონტები და ა.შ.
  }
}

async function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else {
      await processFile(full, path.join(DIST, path.relative(ROOT, full)));
    }
  }
}

fs.rmSync(DIST, { recursive: true, force: true });
walk(ROOT)
  .then(() => console.log('✅ დასრულდა → dist/'))
  .catch((err) => { console.error(err); process.exit(1); });