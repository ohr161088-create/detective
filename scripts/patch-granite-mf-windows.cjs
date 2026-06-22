const fs = require('node:fs');
const path = require('node:path');

const roots = [
  path.join(__dirname, '..', 'node_modules', '@granite-js'),
  path.join(__dirname, '..', 'node_modules', '@apps-in-toss'),
];

const replacements = [
  {
    before: "import * as ${identifier} from '${path.resolve(modulePath)}';",
    after:
      "import * as ${identifier} from ${JSON.stringify(path.resolve(modulePath).replace(/\\\\/g, '/'))};",
  },
  {
    before: "import * as ${identifier} from '${resolvedModulePath}';",
    after: "import * as ${identifier} from ${JSON.stringify(resolvedModulePath.replace(/\\\\/g, '/'))};",
  },
];

const patchedMarkers = replacements.map(({ after }) => after);

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) {
    return files;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && isPluginMicroFrontendEntry(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function isPluginMicroFrontendEntry(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return (
    normalizedPath.includes('plugin-micro-frontend') &&
    (normalizedPath.endsWith('/dist/index.js') || normalizedPath.endsWith('/dist/index.cjs'))
  );
}

let patched = 0;
let alreadyPatched = 0;

for (const root of roots) {
  for (const file of walk(root)) {
    let source = fs.readFileSync(file, 'utf8');
    let nextSource = source;

    for (const { before, after } of replacements) {
      nextSource = nextSource.replace(before, after);
    }

    if (nextSource !== source) {
      fs.writeFileSync(file, nextSource);
      patched += 1;
    } else if (patchedMarkers.some((marker) => source.includes(marker))) {
      alreadyPatched += 1;
    }
  }
}

if (patched > 0) {
  console.log(`Patched ${patched} @granite-js/plugin-micro-frontend file(s) for Windows paths.`);
} else if (alreadyPatched > 0) {
  console.log(`${alreadyPatched} @granite-js/plugin-micro-frontend file(s) already patched for Windows paths.`);
} else {
  console.error('Could not find @granite-js/plugin-micro-frontend Windows path import pattern to patch.');
  process.exitCode = 1;
}
