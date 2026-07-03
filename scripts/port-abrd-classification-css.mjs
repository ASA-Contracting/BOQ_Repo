import fs from 'node:fs';
import path from 'node:path';

const abrdRoot = 'd:/Brave/ABRD_Website/FrontEnd/src/app';
const outDir = 'd:/GitHub/BOQ_Repo/styles';

function transformMcCss(raw) {
  let css = raw;

  css = css.replace(
    /:host-context\(html\[data-theme='light'\]\)\s*\n?\s*::ng-deep\s*\n?\s*\.mc-tree-canvas\s*\n?\s*explorer-tree\s*\n?\s*\.explorer-tree/g,
    '.cls-workspace[data-theme="light"] .mc-tree-canvas .explorer-tree',
  );
  css = css.replace(
    /:host-context\(body\.light-mode\)\s*\n?\s*::ng-deep\s*\n?\s*\.mc-tree-canvas\s*\n?\s*explorer-tree\s*\n?\s*\.explorer-tree/g,
    '.cls-workspace[data-theme="light"] .mc-tree-canvas .explorer-tree',
  );
  css = css.replace(
    /:host ::ng-deep \.mc-tree-canvas explorer-tree /g,
    '.cls-workspace .mc-tree-canvas ',
  );
  css = css.replace(/^:host \*/gm, '.cls-workspace *');
  css = css.replace(/^:host h1/gm, '.cls-workspace h1');
  css = css.replace(/^:host h2/gm, '.cls-workspace h2');
  css = css.replace(/^:host h3/gm, '.cls-workspace h3');
  css = css.replace(/^:host h4/gm, '.cls-workspace h4');
  css = css.replace(/^:host p/gm, '.cls-workspace p');
  css = css.replace(/^:host \*/gm, '.cls-workspace *');
  css = css.replace(/^:host \*::before/gm, '.cls-workspace *::before');
  css = css.replace(/^:host \*::after/gm, '.cls-workspace *::after');
  css = css.replace(/^:host \{/m, '.cls-workspace {');
  css = css.replace(/^:host,/m, '.cls-workspace,');

  return css;
}

function extractExplorerTreeCss(componentSource) {
  const match = componentSource.match(/styles:\s*\[\s*`([\s\S]*?)`\s*\]/);
  if (!match) {
    throw new Error('Could not extract explorer-tree styles');
  }
  return match[1].replace(/:host \{/g, '.explorer-tree-host {');
}

const mcSource = fs.readFileSync(
  path.join(
    abrdRoot,
    'features/tender/material-classification/presentation/page/material-classification-new-styles.css',
  ),
  'utf8',
);
fs.writeFileSync(path.join(outDir, 'classification-parity.css'), transformMcCss(mcSource));

const explorerSource = fs.readFileSync(
  path.join(abrdRoot, 'shared/ui/explorer-tree.component.ts'),
  'utf8',
);
fs.writeFileSync(path.join(outDir, 'explorer-tree.css'), extractExplorerTreeCss(explorerSource));

const themeSource = fs.readFileSync(
  path.join(abrdRoot, 'shared/styles/app-theme-system.css'),
  'utf8',
);

const treeBlockMatch = themeSource.match(
  /(:root \{[\s\S]*?--app-tree-context-input-bg:[^;]+;)/,
);
if (!treeBlockMatch) {
  throw new Error('Could not extract tree token block');
}

const lightMatch = themeSource.match(
  /html\[data-theme='light'\] \{([\s\S]*?)--app-shadow-overlay:[^;]+;/,
);
if (!lightMatch) {
  throw new Error('Could not extract light theme block');
}

const tokenCss = `/* ABRD theme tokens scoped to classification workspace */
.cls-workspace {
  --app-font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, 'Helvetica Neue', helvetica, arial, sans-serif;
  --app-font-family: var(--app-font-family-sans);
  --primary: 132 199 24;
  --info: 14 165 233;
  --success: 34 197 94;
  --warning: 245 158 11;
  --danger: 239 68 68;
  --bg0: 255 255 255;
  --bg1: 249 249 249;
  --surface: 255 255 255;
  --border: 232 232 232;
  --border-strong: 214 214 214;
  --fg: 31 35 43;
  --muted: 141 141 141;
  --app-color-warning-text: rgb(var(--warning));
  --app-color-primary: rgb(var(--primary));
  --app-color-grid-header-bg: rgb(252 252 252);
  --app-color-grid-line-soft: color-mix(in oklab, rgb(var(--border-strong)) 54%, transparent);
  --app-color-grid-line: color-mix(in oklab, rgb(var(--border-strong)) 72%, transparent);
  --app-color-grid-line-faint: color-mix(in oklab, rgb(var(--border-strong)) 36%, transparent);
  --app-color-outline-stroke: rgb(var(--border-strong));
}

.cls-workspace[data-theme='light'],
.cls-workspace {
${lightMatch[1]}
}

${treeBlockMatch[1].replace(/^:root \{/m, '.cls-workspace {')}
`;

fs.writeFileSync(path.join(outDir, 'abrd-classification-tokens.css'), tokenCss);

console.log('Ported classification-parity.css, explorer-tree.css, abrd-classification-tokens.css');
