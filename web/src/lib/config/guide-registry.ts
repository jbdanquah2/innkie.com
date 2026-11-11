import { ToolFaq } from './tool-registry';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  category: 'Links' | 'Developers' | 'Marketing' | 'Media';
  readingTime: string;
  datePublished: string;
  relatedToolRoute?: string;
  relatedToolName?: string;
  sections: GuideSection[];
  faqs?: ToolFaq[];
}

export const GUIDE_REGISTRY: Guide[] = [
  {
    slug: 'redirects-301-302-307',
    title: '301 vs 302 vs 307 Redirects: Which One Your Short Links Should Use',
    description:
      'A practical guide to HTTP redirects for short links. Learn the real difference between 301, 302, 307, and 308 redirects, how they affect SEO and caching, and which to use for marketing campaigns.',
    h1: '301 vs 302 vs 307 Redirects: Which One Your Short Links Should Use',
    intro:
      'Every short link is really a redirect — a small instruction that tells a browser where to go next. The status code attached to that instruction decides whether browsers cache the destination, whether search engines pass authority to it, and whether you can ever change where the link points. Picking the wrong one can quietly break a campaign. Here is how the common redirect types actually behave, and how to choose.',
    category: 'Links',
    readingTime: '7 min read',
    datePublished: '2026-06-03',
    relatedToolRoute: '/tools/link-shortener',
    relatedToolName: 'URL Shortener',
    sections: [
      {
        heading: 'What a redirect actually is',
        paragraphs: [
          'When someone opens a short link, their browser sends a request to the shortener. Instead of returning a page, the server answers with a 3xx status code and a Location header naming the real destination. The browser then makes a second request to that destination. This two-step hop is invisible to most people — it happens in a few milliseconds — but the status code in step one carries meaning that lasts far longer than the click.',
          'The two questions every redirect answers are: "Is this move permanent or temporary?" and "Should the browser reuse the original request method, or is it allowed to change it?" The four codes below differ only in how they answer those two questions.',
        ],
      },
      {
        heading: '301 — Moved Permanently',
        paragraphs: [
          'A 301 says the destination will not change. Browsers and proxies are allowed to cache it aggressively, and search engines treat it as the canonical signal: link authority ("link juice") from the old URL is consolidated into the target. That is exactly what you want when you have permanently moved a page or want a short link to consolidate SEO value into one destination.',
          'The catch is caching. Because a 301 can be cached for a long time — sometimes until the user clears their browser — you should never use it for a link whose destination you might want to change. If you 301 a short link to landing-page-A and later repoint it to landing-page-B, visitors who already clicked may keep landing on A because their browser never re-asks the server.',
        ],
      },
      {
        heading: '302 — Found (temporary)',
        paragraphs: [
          'A 302 says "go here for now." Browsers generally do not cache it, so every click re-asks the server where to go. This makes 302 the safe default for marketing short links: you keep full control to repoint the link tomorrow, run A/B splits, rotate seasonal destinations, or expire a campaign.',
          'Historically 302 was ambiguous about whether the request method could change (more on that below), which is why the stricter 307 was introduced. For ordinary GET-based link clicks the distinction rarely matters, but it matters a great deal for forms and APIs.',
        ],
      },
      {
        heading: '307 and 308 — the strict versions',
        paragraphs: [
          'A 307 is a temporary redirect that guarantees the HTTP method and body are preserved. If the original request was a POST, the browser will POST again to the new location rather than silently downgrading to a GET. A 308 is the permanent counterpart — like a 301, but with the same method-preserving guarantee.',
          'For plain link sharing you rarely need 307 or 308. They earn their keep when a redirect sits in front of an API or a form submission, where turning a POST into a GET would drop the payload and break the request.',
        ],
      },
      {
        heading: 'How to choose',
        paragraphs: [
          'Match the code to your intent, not to a habit. Most teams reach for 301 because it "sounds official," then discover months later that they can never change the link. Use this quick mapping:',
        ],
        bullets: [
          'Marketing, campaign, and shareable links you may repoint later → 302 (temporary). Keeps control, avoids sticky caching.',
          'A page that has permanently moved and should pass SEO authority → 301 (permanent).',
          'A redirect in front of a form or API that uses POST → 307 (temporary) or 308 (permanent) to preserve the method.',
          'When in doubt for a short link → 302. You can always tighten to 301 later; you cannot easily undo a cached 301.',
        ],
      },
      {
        heading: 'A note on link analytics',
        paragraphs: [
          'Redirect-based short links are also where click tracking happens. Because the shortener handles step one of the hop, it can record the click — timestamp, referrer, device, and approximate location — before forwarding the visitor on. A permanent, heavily-cached 301 undermines this: if the browser stops asking the server, the server stops counting. This is another reason analytics-driven short links lean on 302 rather than 301.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Does a 302 redirect hurt SEO?',
        answer:
          'For short links it usually does not matter, because you are not trying to pass page authority through a campaign link. If your goal is specifically to consolidate SEO authority into a destination, use a 301. For everything else, the flexibility of a 302 is worth more than the marginal SEO signal.',
      },
      {
        question: 'Why can I not change where my old short link points?',
        answer:
          'You most likely used a 301 (permanent) redirect, which browsers cache. Visitors who clicked before the change may be served the old destination from cache. Temporary redirects (302) avoid this because the browser re-checks the destination on every click.',
      },
      {
        question: 'Which redirect does iNNkie use for short links?',
        answer:
          'iNNkie short links use a temporary redirect so you keep control of the destination and can capture analytics on every click. You can repoint a link at any time from your dashboard without worrying about stale browser caches.',
      },
    ],
  },
  {
    slug: 'how-jwt-works',
    title: 'How JSON Web Tokens (JWT) Work — and How to Read One Safely',
    description:
      'Understand JWT structure (header, payload, signature), how signing and verification work, common security mistakes, and how to safely decode a token to inspect its claims without exposing secrets.',
    h1: 'How JSON Web Tokens Work — and How to Read One Safely',
    intro:
      'A JSON Web Token (JWT) is the string of three dot-separated chunks you see in Authorization headers and login flows. It looks cryptic, but its design is simple and worth understanding: a JWT carries a small set of claims about a user or session, plus a signature that lets a server trust those claims without a database lookup. This guide explains each part, what the signature does, and how to inspect a token safely.',
    category: 'Developers',
    readingTime: '8 min read',
    datePublished: '2026-06-03',
    relatedToolRoute: '/tools/jwt-decoder',
    relatedToolName: 'JWT Decoder',
    sections: [
      {
        heading: 'The three parts of a token',
        paragraphs: [
          'A JWT is three Base64URL-encoded segments joined by dots: header.payload.signature. The first two parts are just JSON that has been encoded so it survives transport in a URL or header — they are not encrypted. Anyone holding the token can decode and read them. The third part, the signature, is what makes the token trustworthy.',
          'The header describes how the token is signed, for example {"alg":"HS256","typ":"JWT"}. The payload holds the claims — the actual data — such as the subject (sub), an expiry timestamp (exp), and any custom fields your application adds.',
        ],
      },
      {
        heading: 'Encoded is not encrypted',
        paragraphs: [
          'This is the single most important thing to understand about JWTs: the header and payload are encoded, not encrypted. Base64URL is reversible by anyone — it is a transport format, not a security measure. If you put a password, an API key, or personal data in a JWT payload, you have effectively published it to every client and proxy that touches the token.',
          'Only ever place data in a payload that you are comfortable being readable: a user ID, roles, an expiry, an issuer. Treat the token as a sealed envelope whose contents are visible through the paper — sealed against tampering, but not against reading.',
        ],
      },
      {
        heading: 'What the signature proves',
        paragraphs: [
          'The signature is computed over the header and payload using a secret or a private key. When a server receives a token, it recomputes the signature with the key it holds and compares. If they match, two things are true: the token was issued by someone who knows the key, and the payload has not been altered since. Change a single character in the payload and the signature no longer verifies.',
          'With a symmetric algorithm like HS256, the same secret signs and verifies, so it must stay on the server. With an asymmetric algorithm like RS256, a private key signs and a public key verifies — useful when many services need to validate tokens but only one should issue them.',
        ],
      },
      {
        heading: 'Common security mistakes',
        paragraphs: [
          'Most JWT vulnerabilities come from skipping verification, not from breaking the cryptography. The classic failures are well documented and easy to avoid:',
        ],
        bullets: [
          'Trusting a token without verifying its signature — decoding the payload and acting on it as if it were authentic.',
          'Accepting alg: none, an old footgun where a token declares it has no signature and a careless library believes it.',
          'Not checking the exp (expiry) claim, so revoked or stale tokens keep working forever.',
          'Confusing algorithms: verifying an attacker-supplied RS256 token using the public key as if it were an HS256 secret.',
          'Putting sensitive data in the payload, forgetting it is world-readable.',
        ],
      },
      {
        heading: 'How to inspect a token safely',
        paragraphs: [
          'When debugging, you often want to read what a token claims — its expiry, its subject, its roles — without verifying it. The safe way to do this is locally. A decoder that runs entirely in your browser never transmits the token anywhere, which matters because a real access token is a live credential: paste it into a careless online tool and you may have handed your session to a third-party server.',
          'iNNkie\'s JWT decoder is fully client-side. It splits the token, Base64URL-decodes the header and payload, and shows the claims and timestamps without ever sending the token over the network. Use it to confirm what is inside a token; use your server\'s key to confirm whether the token is genuine.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can I trust the data in a JWT just by decoding it?',
        answer:
          'No. Decoding only reveals what the token claims. Without verifying the signature against the issuer\'s key, you cannot know the token is authentic or unaltered. Decoding is for inspection; verification is for trust.',
      },
      {
        question: 'Is it safe to paste a JWT into an online decoder?',
        answer:
          'Only if the decoder runs entirely in your browser and never sends the token to a server. A real token is a live credential. iNNkie\'s decoder processes everything client-side, so the token never leaves your machine.',
      },
      {
        question: 'Why is my JWT rejected even though it decodes fine?',
        answer:
          'Decoding succeeds for any well-formed token, but a server rejects it if the signature does not verify with its key, if the token has expired (exp), or if claims like the audience or issuer do not match what the server expects.',
      },
    ],
  },
  {
    slug: 'utm-parameters-naming-convention',
    title: 'UTM Parameters Done Right: A Naming Convention That Keeps Attribution Clean',
    description:
      'Learn what each UTM parameter means, why inconsistent naming destroys your analytics, and a practical lowercase naming convention for source, medium, campaign, term, and content that keeps reporting tidy.',
    h1: 'UTM Parameters Done Right: A Naming Convention That Keeps Attribution Clean',
    intro:
      'UTM parameters are the little tags you append to a URL so your analytics tool can tell where a visitor came from. They are simple to add and easy to get wrong — and because analytics treats "Facebook" and "facebook" as two different sources, sloppy tagging quietly splits your data into a mess that no dashboard can fix after the fact. The cure is a naming convention you apply every single time. Here is one that works.',
    category: 'Marketing',
    readingTime: '6 min read',
    datePublished: '2026-06-03',
    relatedToolRoute: '/tools/utm-builder',
    relatedToolName: 'UTM Builder',
    sections: [
      {
        heading: 'The five parameters',
        paragraphs: [
          'A tagged link looks like example.com/page?utm_source=newsletter&utm_medium=email&utm_campaign=spring_launch. Each parameter answers a specific question, and using them for their intended purpose is half the battle:',
        ],
        bullets: [
          'utm_source — where the traffic comes from: the specific site or product, e.g. newsletter, linkedin, google.',
          'utm_medium — the channel type, e.g. email, social, cpc, referral.',
          'utm_campaign — the initiative tying clicks together, e.g. spring_launch, black_friday_2026.',
          'utm_term — optional, usually the paid keyword behind the click.',
          'utm_content — optional, used to tell apart two links in the same campaign, e.g. header_button vs footer_link.',
        ],
      },
      {
        heading: 'Why inconsistency is so destructive',
        paragraphs: [
          'Analytics platforms match UTM values as exact, case-sensitive strings. "Email", "email", and "e-mail" become three separate mediums. "spring_launch" and "spring-launch" become two campaigns. Once that happens, your reports fragment: a single campaign\'s 10,000 clicks show up as four half-campaigns, and there is no reliable way to merge them retroactively because the raw data was recorded that way.',
          'This is why a convention matters more than any individual choice. It is less important whether you pick "social" or "social-media" than that everyone on the team picks the same one, forever.',
        ],
      },
      {
        heading: 'A convention you can actually keep',
        paragraphs: [
          'These rules are deliberately strict because strictness is the point. The goal is that two people tagging the same campaign on different days produce identical UTMs.',
        ],
        bullets: [
          'Lowercase everything. Always. This removes the single most common source of duplicates.',
          'Pick one word separator and never mix — underscores are conventional (spring_launch), so standardize on them.',
          'No spaces. A space becomes %20 and looks broken; use your separator instead.',
          'Keep a fixed vocabulary for source and medium. Write down the allowed values (email, social, cpc, referral) and do not invent new ones ad hoc.',
          'Name campaigns by initiative plus a date or quarter, e.g. product_launch_2026q2, so they stay unique and sortable over time.',
        ],
      },
      {
        heading: 'Source vs medium: the mix-up that breaks reports',
        paragraphs: [
          'The most frequent mistake is swapping source and medium. Source is the named origin; medium is the category. Facebook is a source; social is its medium. Your weekly newsletter is a source; email is its medium. Google can be a source whose medium is cpc for ads or organic for search.',
          'Getting this right lets your analytics roll clicks up correctly — all of your social sources under "social," all of your email sources under "email" — which is exactly the grouping that makes a channel report readable.',
        ],
      },
      {
        heading: 'Tag once, reuse, and shorten',
        paragraphs: [
          'A fully tagged URL is long and ugly, which is fine for a click but awful for a printed flyer, a podcast mention, or a slide. This is where a UTM builder and a link shortener work together: build the tagged URL once with a consistent convention, then shorten it so the human-facing link is clean while the tracking travels along behind the redirect.',
          'iNNkie\'s UTM builder assembles the parameters for you and nudges you toward consistent values, so the convention above becomes the path of least resistance rather than something you have to remember.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do UTM parameters affect SEO?',
        answer:
          'No. UTM parameters are for your own analytics and do not influence how search engines rank a page. To avoid duplicate-content concerns, only add them to campaign links you share, not to the canonical URLs of your own pages.',
      },
      {
        question: 'Should I use uppercase in UTM values?',
        answer:
          'Avoid it. Analytics tools treat UTM values as case-sensitive, so "Email" and "email" are counted separately. Standardizing on lowercase eliminates the most common source of fragmented reports.',
      },
      {
        question: 'What is the difference between utm_source and utm_medium?',
        answer:
          'Source is the specific named origin of the traffic (e.g. linkedin, newsletter), while medium is the broad channel category (e.g. social, email). Source answers "which site?" and medium answers "what kind of channel?"',
      },
    ],
  },
  {
    slug: 'webp-jpeg-png-image-formats',
    title: 'WebP vs JPEG vs PNG: Choosing the Right Image Format for the Web',
    description:
      'A practical comparison of WebP, JPEG, and PNG: how lossy and lossless compression differ, when transparency and sharp edges matter, and how to pick the format that keeps pages fast without visible quality loss.',
    h1: 'WebP vs JPEG vs PNG: Choosing the Right Image Format for the Web',
    intro:
      'Images are usually the heaviest thing on a web page, so the format you choose has an outsized effect on how fast your site feels. JPEG, PNG, and WebP each compress images differently, and each is the right answer for a different kind of picture. Choosing well — and compressing before you upload — is one of the cheapest performance wins available. This guide explains the trade-offs in plain terms.',
    category: 'Media',
    readingTime: '6 min read',
    datePublished: '2026-06-03',
    relatedToolRoute: '/tools/image-compressor',
    relatedToolName: 'Image Compressor',
    sections: [
      {
        heading: 'Lossy vs lossless: the core distinction',
        paragraphs: [
          'Every format falls into one of two camps. Lossy compression throws away detail the human eye is unlikely to notice in exchange for dramatically smaller files — JPEG is the classic example. Lossless compression shrinks the file without discarding any information, so the decoded image is pixel-for-pixel identical to the original — PNG works this way.',
          'Neither is "better" in the abstract. Lossy is ideal for photographs, where a little discarded detail is invisible. Lossless is ideal for graphics with sharp edges and flat color, where lossy compression produces ugly halos. The trick is matching the camp to the content.',
        ],
      },
      {
        heading: 'JPEG: for photographs',
        paragraphs: [
          'JPEG is lossy and excels at photographic content — landscapes, faces, anything with smooth gradients of color. At sensible quality settings it produces small files with no visible degradation, which is why it has been the web\'s default photo format for decades.',
          'Its weaknesses show up on the wrong content. JPEG cannot store transparency, and it smears sharp edges: a screenshot with text, a logo, or a line drawing saved as JPEG develops blurry artifacts around the crisp boundaries. For that kind of image, reach for PNG or WebP instead.',
        ],
      },
      {
        heading: 'PNG: for transparency and sharp edges',
        paragraphs: [
          'PNG is lossless and supports an alpha channel, which means true transparency. That makes it the right choice for logos, icons, UI elements, screenshots, and any graphic with hard edges and flat areas of color. Because nothing is discarded, text stays crisp and lines stay clean.',
          'The cost is size. A lossless photograph saved as PNG can be many times larger than the same image as JPEG, with no visible benefit. Use PNG for graphics, not for photos — putting a full-resolution photo in a PNG is the most common cause of needlessly heavy pages.',
        ],
      },
      {
        heading: 'WebP: the modern all-rounder',
        paragraphs: [
          'WebP is a newer format that supports both lossy and lossless modes and includes transparency. In practice it produces noticeably smaller files than JPEG at comparable quality, and smaller-or-equal files than PNG for graphics — often a 25–35% reduction over the older formats. It also supports animation, making it a lighter alternative to GIF.',
          'Browser support is now effectively universal, so WebP is a strong default for most web images. The main reason to keep a JPEG or PNG fallback is an unusually old client or a workflow (like certain email or design tools) that does not accept WebP yet.',
        ],
      },
      {
        heading: 'A simple decision rule',
        paragraphs: [
          'You can cover almost every case with three questions, in order:',
        ],
        bullets: [
          'Does the image need transparency, or is it a logo, icon, or screenshot with sharp edges? → PNG, or lossless WebP.',
          'Is it a photograph or other rich, gradient-heavy image? → JPEG, or lossy WebP for a smaller file.',
          'Do you want the smallest modern file and control your audience\'s browsers? → WebP, with a JPEG/PNG fallback if you need maximum compatibility.',
          'Whatever you pick, compress before uploading — resizing to the dimensions you actually display and stripping camera metadata often cuts size more than the format choice itself.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is WebP always better than JPEG and PNG?',
        answer:
          'For most web images, WebP gives smaller files at the same visual quality and is widely supported. The exceptions are workflows or older tools that do not accept WebP, where a JPEG (for photos) or PNG (for graphics) fallback is safer.',
      },
      {
        question: 'Why does my logo look blurry as a JPEG?',
        answer:
          'JPEG uses lossy compression tuned for photographs, which smears the sharp edges and flat colors in logos and text. Save logos, icons, and screenshots as PNG or lossless WebP to keep edges crisp.',
      },
      {
        question: 'Does compressing an image lose quality?',
        answer:
          'Lossless compression (PNG, lossless WebP) does not change the pixels at all. Lossy compression (JPEG, lossy WebP) discards some detail, but at sensible quality levels the difference is invisible while the file is far smaller. iNNkie\'s compressor runs locally so you can preview the result before downloading.',
      },
    ],
  },
  {
    slug: 'url-encoding-explained',
    title: 'URL Encoding Explained: Percent-Encoding, Spaces and Special Characters',
    description:
      'A clear guide to URL (percent) encoding: which characters must be escaped, the difference between encodeURI and encodeURIComponent, why spaces become %20 or +, and how to avoid double-encoding bugs.',
    h1: 'URL Encoding Explained: Percent-Encoding, Spaces and Special Characters',
    intro:
      'A URL can only safely carry a limited set of characters. Everything else, from spaces to accented letters to the ampersand inside a search term, has to be escaped so that it cannot be mistaken for URL structure. That escaping is called percent-encoding. Getting it wrong produces broken links, lost query parameters and hard-to-trace bugs, so here is how it actually works.',
    category: 'Developers',
    readingTime: '6 min read',
    datePublished: '2026-11-11',
    relatedToolRoute: '/tools/url-encoder',
    relatedToolName: 'URL Encoder & Decoder',
    sections: [
      {
        heading: 'What percent-encoding does',
        paragraphs: [
          'Percent-encoding replaces a character with a percent sign followed by the two hexadecimal digits of its byte value. A space is the byte 0x20, so it becomes %20. A literal ampersand is 0x26, so it becomes %26.',
          'Characters outside plain ASCII are first converted to UTF-8 bytes, and each byte is then encoded. The letter é is two bytes, so it becomes %C3%A9, and an emoji can take four bytes and therefore twelve characters of encoded text.',
        ],
      },
      {
        heading: 'Which characters are safe and which are reserved',
        paragraphs: [
          'The URL standard (RFC 3986) defines unreserved characters that never need encoding: letters, digits, and the four symbols - . _ ~. Everything else is either reserved, meaning it has a structural role, or must always be encoded.',
        ],
        bullets: [
          'Reserved characters such as : / ? # [ ] @ ! $ & \' ( ) * + , ; = separate the parts of a URL. Inside a value they must be encoded so they are not read as structure.',
          'A literal # in a value must be %23, or everything after it is treated as the fragment and never reaches the server.',
          'A literal & or = inside a query value must be %26 and %3D, or the parameter splits in the wrong place.',
          'Characters such as spaces, quotes, angle brackets and non-ASCII letters always need encoding.',
        ],
      },
      {
        heading: 'encodeURI vs encodeURIComponent',
        paragraphs: [
          'JavaScript offers two functions, and using the wrong one is the most common mistake. encodeURIComponent escapes nearly everything, including / ? & = and #, so use it for a single value you are placing into a URL, such as one query parameter.',
          'encodeURI leaves the structural characters alone so that a complete address keeps working. Use it only on a whole URL that is already assembled, never on an individual value.',
        ],
        bullets: [
          'Building a query string: encode each key and value with encodeURIComponent, then join with = and &.',
          'Cleaning up a full address that contains spaces: encodeURI is appropriate.',
          'Encoding a value that contains a URL, for example a redirect target: encodeURIComponent, so the inner ? and & do not leak into the outer URL.',
        ],
      },
      {
        heading: 'Spaces: %20 or +?',
        paragraphs: [
          'In a URL path, a space is always %20. In a query string a plus sign is also widely understood as a space, but only because of the older application/x-www-form-urlencoded format used by HTML forms. A plus sign in a path is just a plus sign.',
          'Because of that ambiguity, %20 is the safer choice everywhere, and a literal plus sign that you really mean should be encoded as %2B.',
        ],
      },
      {
        heading: 'Double encoding and other common bugs',
        paragraphs: [
          'Double encoding happens when an already-encoded value is encoded again. The % in %20 becomes %25, giving %2520, and the receiving server decodes it once to get the literal text %20 instead of a space. Encode exactly once, at the point where you build the URL.',
          'Decoding can fail too. A percent sign that is not followed by two hex digits, or a truncated multi-byte sequence, is malformed and throws an error in most languages. Decode untrusted input defensively.',
        ],
        bullets: [
          'Encode at the boundary where you assemble the URL, not earlier and not repeatedly.',
          'Never build a URL by concatenating raw user input, because an unescaped & or # changes its meaning.',
          'When something looks wrong, paste the value into a decoder: if you still see %25 or %2520, it has been encoded more than once.',
        ],
      },
    ],
    faqs: [
      { question: 'Do I need to encode the whole URL?', answer: 'Usually not. Encode the individual pieces you insert, such as a query value or a path segment, and leave the structural characters of the URL alone. Encoding a whole URL with encodeURIComponent turns its slashes and colons into escape codes and breaks it.' },
      { question: 'Is URL encoding the same as encryption?', answer: 'No. Percent-encoding is a reversible formatting step that anyone can undo. It provides no secrecy, so never rely on it to hide sensitive data.' },
      { question: 'Why do short links and tracking URLs contain so many %-codes?', answer: 'Query values often contain characters such as spaces, commas and other URLs, and each of those is escaped so the link survives being copied, pasted and redirected. UTM parameters with spaces or symbols are encoded the same way.' },
    ],
  },
  {
    slug: 'unix-timestamps-explained',
    title: 'Unix Timestamps Explained: Epoch Time, Milliseconds and Timezones',
    description:
      'Understand Unix timestamps: what epoch time is, how to tell seconds from milliseconds, why they ignore timezones, how JWT expiry uses them, and what the Year 2038 problem means.',
    h1: 'Unix Timestamps Explained: Epoch Time, Milliseconds and Timezones',
    intro:
      'Open any log file, API response or database row and you will eventually meet a number like 1767225600 where a date should be. It is a Unix timestamp: a simple, timezone-free way for computers to agree on a moment in time. Once you know how to read it, debugging expiry times, scheduled jobs and event logs gets much easier.',
    category: 'Developers',
    readingTime: '6 min read',
    datePublished: '2026-11-11',
    relatedToolRoute: '/tools/timestamp-converter',
    relatedToolName: 'Unix Timestamp Converter',
    sections: [
      {
        heading: 'What a Unix timestamp is',
        paragraphs: [
          'A Unix timestamp counts the seconds that have passed since 00:00:00 UTC on 1 January 1970, a moment called the Unix epoch. The value 0 is that exact instant, and 1767225600 is midnight UTC on 1 January 2026.',
          'Leap seconds are not counted, so every day is treated as exactly 86,400 seconds long. That makes the arithmetic simple: adding 3,600 always moves a timestamp forward by one hour.',
        ],
      },
      {
        heading: 'Seconds versus milliseconds',
        paragraphs: [
          'Different systems use different units, and mixing them up is a classic bug. Current timestamps in seconds have ten digits, around 1.7 billion. In milliseconds they have thirteen digits, around 1.7 trillion.',
        ],
        bullets: [
          'JavaScript Date.now() and new Date().getTime() return milliseconds.',
          'Most databases, the JWT exp, iat and nbf claims, and many APIs use seconds.',
          'A date in the year 1970 when you expected today usually means seconds were read as milliseconds; a date tens of thousands of years away means the opposite.',
        ],
      },
      {
        heading: 'Why timestamps ignore timezones',
        paragraphs: [
          'A timestamp identifies one instant that is identical everywhere on Earth. A timezone only matters when you display it as a calendar date and clock time. The same timestamp is 14:00 in London and 09:00 in New York.',
          'This is why the safest rule is to store and transmit time as UTC or as a timestamp, and to convert to the user\'s local timezone only at the last moment, when showing it on screen.',
        ],
      },
      {
        heading: 'Timestamps you will meet in practice',
        paragraphs: [
          'JSON Web Tokens express their lifetime as timestamps in seconds, so decoding a token and reading its exp claim tells you exactly when it expires. Cron-style schedules, cache headers, certificate validity and database created-at columns also commonly use epoch time.',
          'When a token is rejected as expired, converting its exp value and comparing it with the current time is often the quickest way to see whether the problem is the token or a server clock that has drifted.',
        ],
      },
      {
        heading: 'The Year 2038 problem',
        paragraphs: [
          'Older systems store the timestamp in a signed 32-bit integer, whose maximum value is 2,147,483,647 seconds. That moment is 03:14:07 UTC on 19 January 2038. One second later the value overflows and wraps to a large negative number, which would read as December 1901.',
          'Modern 64-bit systems and current language runtimes are unaffected, but embedded devices, old file formats and legacy databases that still use 32-bit fields need attention before then.',
        ],
      },
    ],
    faqs: [
      { question: 'How do I get the current Unix timestamp?', answer: 'In JavaScript use Math.floor(Date.now() / 1000) for seconds. In Python use int(time.time()). In a shell, date +%s prints the current time in seconds.' },
      { question: 'Can a Unix timestamp be negative?', answer: 'Yes. Negative values represent moments before 1 January 1970. For example -86400 is 31 December 1969 at 00:00:00 UTC.' },
      { question: 'What format should I use when I want a human-readable date?', answer: 'ISO 8601, for example 2026-01-01T00:00:00Z. It sorts correctly as text, includes the timezone, and is understood by virtually every language and database.' },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDE_REGISTRY.find(g => g.slug === slug);
}

export function getGuideByToolRoute(route: string): Guide | undefined {
  return GUIDE_REGISTRY.find(g => g.relatedToolRoute === route);
}
