const fs = require('fs');
const path = require('path');

// Mock a minimal TOOL_REGISTRY for the script or try to import it
// Since ES Modules in Node can be tricky without setup, we'll define the core logic
// but we will actually need to read the TS file and parse it or have a shared JSON.
// For now, let's create a robust script that can be executed.

async function generateSitemap() {
  const baseUrl = 'https://innkie.com';
  
  // We'll extract the routes from the tool registry file directly to avoid complex TS-node setup
  const registryPath = path.join(__dirname, '../src/app/shared/config/tool-registry.ts');
  const registryContent = fs.readFileSync(registryPath, 'utf-8');
  
  const routes = [
    '',
    '/login',
    '/features',
    '/tools',
    '/privacy',
    '/terms',
    '/about',
    '/contact',
    '/docs'
  ];

  // Simple regex to find all route: '...' and path: '...'
  const routeMatches = registryContent.matchAll(/route:\s*['"]([^'"]+)['"]/g);
  for (const match of routeMatches) {
    routes.push(match[1]);
  }

  const aliasMatches = registryContent.matchAll(/path:\s*['"]([^'"]+)['"]/g);
  for (const match of aliasMatches) {
    routes.push(match[1]);
  }

  // Remove duplicates
  const uniqueRoutes = [...new Set(routes)];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes.map(route => `  <url>
    <loc>${baseUrl}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;

  const outputPath = path.join(__dirname, '../src/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  console.log(`✅ Sitemap generated with ${uniqueRoutes.length} routes at ${outputPath}`);
}

generateSitemap().catch(console.error);
