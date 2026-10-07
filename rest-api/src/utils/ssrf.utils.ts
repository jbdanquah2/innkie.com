import * as dns from 'dns/promises';
import * as net from 'net';

/**
 * Checks if an IPv4 address belongs to a private, loopback, link-local, or cloud metadata range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed -> consider unsafe
  }

  const [a, b] = parts;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-Local & Cloud Provider Metadata Services e.g. 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 0.0.0.0/8
  if (a === 0) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address belongs to private/loopback/link-local ranges.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1)
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.substring(7);
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  // Unique local addresses (fc00::/7 -> fc00:: through fdff::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // Link-local addresses (fe80::/10 -> fe80:: through febf::)
  if (/^fe[89ab]/.test(normalized)) return true;

  return false;
}

/**
 * Validates that a URL is well-formed, uses HTTP(S), and does not resolve to private,
 * loopback, or cloud-provider metadata network addresses (SSRF prevention).
 */
export async function validateSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS protocols are permitted');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Fast check: localhost / local domain patterns
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Access to local domains is prohibited');
  }

  // If hostname is directly an IP literal
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      throw new Error('Access to private/internal IP addresses is prohibited');
    }
    return parsed;
  }

  if (net.isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      throw new Error('Access to private/internal IPv6 addresses is prohibited');
    }
    return parsed;
  }

  // DNS resolution check
  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const record of records) {
      if (record.family === 4 && isPrivateIPv4(record.address)) {
        throw new Error('Target domain resolves to a private or restricted IP address');
      }
      if (record.family === 6 && isPrivateIPv6(record.address)) {
        throw new Error('Target domain resolves to a private or restricted IPv6 address');
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('restricted')) {
      throw err;
    }
    // DNS resolution failure
    throw new Error(`Could not resolve hostname: ${hostname}`);
  }

  return parsed;
}
