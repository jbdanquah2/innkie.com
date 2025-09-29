import * as cheerio from 'cheerio';
import fetch from 'node-fetch';


export async function getPreview(longUrl: string) {
  try {
    const response = await fetch(longUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    const getMeta = (name: string) =>
      $(`meta[property='og:${name}']`).attr('content') ||
      $(`meta[name='${name}']`).attr('content');

    return {
      title: getMeta('title') || $('title').text(),
      description: getMeta('description') || '',
      thumbnailUrl: getMeta('image') || '/default-thumbnail.png',
      site: getMeta('site_name') || new URL(longUrl).hostname,
      favicon: new URL(getFavicon(html), longUrl).href,
      longUrl,
    };
  } catch (err) {
    throw new Error('Failed to fetch metadata');
  }


}

const getFavicon = (html) => {
  const $ = cheerio.load(html);
  return ($('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '/favicon.ico'
  );
}

