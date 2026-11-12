import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';
// Origin of the Nest API in local development (NEXT_PUBLIC_API_URL is like http://localhost:5002/api).
const devApiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api').origin;

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
  // Dev only. Production gets this from firebase.json (`/:shortCode` -> Cloud Run); a static export has no rewrites.
  // `fallback` rules run only after every real page has failed to match, so they never shadow a page.
  ...(isDev && {
    async rewrites() {
      return { beforeFiles: [], afterFiles: [], fallback: [{ source: '/:shortCode', destination: `${devApiOrigin}/:shortCode` }] };
    },
  }),
};

export default nextConfig;
