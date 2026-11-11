import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: Firebase Hosting serves ./out. No Node server at runtime.
  output: 'export',
  // /tools/x/ -> out/tools/x/index.html. Keeps canonical URLs identical to the Angular site
  // and guarantees a real file exists for every page (otherwise Firebase would hand the
  // path to the /:shortCode redirect service).
  trailingSlash: true,
  images: { unoptimized: true },
  // shared-models is consumed from source, like the Angular app does today.
  transpilePackages: ['@innkie/shared-models'],
  turbopack: { root: path.join(here, '..') },
};

export default nextConfig;
