const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function getStringProperty(node, propertyName) {
  const property = node.properties?.find(prop =>
    ts.isPropertyAssignment(prop) &&
    ts.isIdentifier(prop.name) &&
    prop.name.text === propertyName &&
    ts.isStringLiteralLike(prop.initializer)
  );

  return property ? property.initializer.text : undefined;
}

function getArrayProperty(node, propertyName) {
  const property = node.properties?.find(prop =>
    ts.isPropertyAssignment(prop) &&
    ts.isIdentifier(prop.name) &&
    prop.name.text === propertyName &&
    ts.isArrayLiteralExpression(prop.initializer)
  );

  return property?.initializer;
}

function findToolRegistry(sourceFile) {
  let registry;

  sourceFile.forEachChild(node => {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length
    ) {
      const declaration = node.declarationList.declarations[0];
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'TOOL_REGISTRY' &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        registry = declaration.initializer;
      }
    }
  });

  return registry;
}

function hasIndexableAliasContent(aliasNode) {
  return Boolean(
    getStringProperty(aliasNode, 'name') &&
    getStringProperty(aliasNode, 'h1') &&
    getStringProperty(aliasNode, 'intro') &&
    getArrayProperty(aliasNode, 'faqs') &&
    getArrayProperty(aliasNode, 'sections')
  );
}

function findNamedArray(sourceFile, exportName) {
  let arrayNode;

  sourceFile.forEachChild(node => {
    if (
      ts.isVariableStatement(node) &&
      node.declarationList.declarations.length
    ) {
      const declaration = node.declarationList.declarations[0];
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === exportName &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        arrayNode = declaration.initializer;
      }
    }
  });

  return arrayNode;
}

function getGuideRoutes(rootDir) {
  const guidePath = path.join(rootDir, 'src/app/shared/config/guide-registry.ts');
  if (!fs.existsSync(guidePath)) return [];

  const content = fs.readFileSync(guidePath, 'utf-8');
  const sourceFile = ts.createSourceFile(guidePath, content, ts.ScriptTarget.Latest, true);
  const registry = findNamedArray(sourceFile, 'GUIDE_REGISTRY');
  if (!registry) return [];

  const routes = ['/guides'];
  registry.elements.forEach(guideNode => {
    if (!ts.isObjectLiteralExpression(guideNode)) return;
    const slug = getStringProperty(guideNode, 'slug');
    if (slug) routes.push(`/guides/${slug}`);
  });

  return routes;
}

function normalizePublicRoute(route) {
  if (!route || route === '/') return '';
  return route.endsWith('/') ? route : `${route}/`;
}

function getRoutePriority(route) {
  if (route === '') return '1.0';
  if (route !== '/tools/' && route.startsWith('/tools/')) return '0.9';
  if (route !== '/guides/' && route.startsWith('/guides/')) return '0.7';
  return '0.8';
}

/**
 * SEO Sitemap Generator
 * Keeps non-indexable routes out and writes source/build sitemap copies.
 */
async function generateSitemap() {
  const baseUrl = 'https://innkie.com';
  
  const registryPath = path.join(__dirname, '../src/app/shared/config/tool-registry.ts');
  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  const sourceFile = ts.createSourceFile(registryPath, registryContent, ts.ScriptTarget.Latest, true);
  const registry = findToolRegistry(sourceFile);

  if (!registry) {
    throw new Error('TOOL_REGISTRY was not found while generating sitemap.');
  }
  
  // High-authority landing pages only.
  // /login is REMOVED because it has 'noindex' metadata.
  const routes = [
    '',
    '/features',
    '/tools',
    '/privacy',
    '/terms',
    '/about',
    '/contact',
    '/docs',
    ...getGuideRoutes(path.join(__dirname, '..'))
  ];

  registry.elements.forEach(toolNode => {
    if (!ts.isObjectLiteralExpression(toolNode)) return;

    const route = getStringProperty(toolNode, 'route');
    if (route) routes.push(route);

    const aliases = getArrayProperty(toolNode, 'aliases');
    aliases?.elements.forEach(aliasNode => {
      if (!ts.isObjectLiteralExpression(aliasNode)) return;

      const aliasPath = getStringProperty(aliasNode, 'path');
      if (aliasPath && hasIndexableAliasContent(aliasNode)) {
        routes.push(aliasPath);
      }
    });
  });

  // Ensure uniqueness and filter out anything accidental
  const uniqueRoutes = [...new Set(
    routes
      .filter(r => r !== '/login')
      .map(normalizePublicRoute)
  )];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes.map(route => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${getRoutePriority(route)}</priority>
  </url>`).join('\n')}
</urlset>`;

  // 1. Write to src (for git and next build)
  const srcPath = path.join(__dirname, '../src/sitemap.xml');
  fs.writeFileSync(srcPath, sitemap);

  // 2. Write to dist (to ensure the current deployment is fresh)
  // We check for common Angular build paths
  const distPaths = [
    path.join(__dirname, '../dist/url-shortner/browser/sitemap.xml'),
    path.join(__dirname, '../dist/url-shortner/sitemap.xml')
  ];

  distPaths.forEach(distPath => {
    try {
      if (fs.existsSync(path.dirname(distPath))) {
        fs.writeFileSync(distPath, sitemap);
        console.log(`✅ Also updated built sitemap at ${distPath}`);
      }
    } catch (e) {
      // Ignore if dist doesn't exist yet
    }
  });

  console.log(`✅ Sitemap generated with ${uniqueRoutes.length} routes at ${srcPath}`);
}

generateSitemap().catch(console.error);
