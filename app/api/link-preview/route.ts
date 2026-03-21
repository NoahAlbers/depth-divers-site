import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CACHE_MAX_AGE_DAYS = 7;
const FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_SIZE = 1024 * 1024; // 1MB

function extractMeta(html: string): {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
} {
  // Extract og:title or <title>
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
  )?.[1];
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const title = ogTitle || titleTag || null;

  // Extract og:description or meta description
  const ogDesc = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
  )?.[1];
  const metaDesc = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
  )?.[1];
  const description = ogDesc || metaDesc || null;

  // Extract og:image
  const ogImage = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
  )?.[1];
  const imageUrl = ogImage || null;

  return { title, description, imageUrl };
}

function sanitize(str: string | null): string | null {
  if (!str) return null;
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .trim()
    .slice(0, 500);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  // Only allow http/https
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Parse domain
  let domain: string;
  try {
    domain = new URL(url).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Block private IPs
  if (
    domain === "localhost" ||
    domain.startsWith("127.") ||
    domain.startsWith("10.") ||
    domain.startsWith("192.168.") ||
    domain.startsWith("172.")
  ) {
    return NextResponse.json({ error: "Blocked" }, { status: 400 });
  }

  // Check cache
  const cached = await prisma.linkPreview.findUnique({ where: { url } });
  if (cached) {
    const age = Date.now() - cached.fetchedAt.getTime();
    if (age < CACHE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return NextResponse.json({
        title: cached.title,
        description: cached.description,
        imageUrl: cached.imageUrl,
        domain: cached.domain,
      });
    }
  }

  // Fetch the URL
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "DepthDiversBot/1.0 (link preview)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
    }

    // Check content length
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_RESPONSE_SIZE) {
      return NextResponse.json({ error: "Too large" }, { status: 502 });
    }

    const html = await res.text();
    const { title, description, imageUrl } = extractMeta(
      html.slice(0, 50000) // Only parse first 50KB for efficiency
    );

    const preview = {
      title: sanitize(title),
      description: sanitize(description)?.slice(0, 200),
      imageUrl: imageUrl?.slice(0, 2000) || null,
      domain,
    };

    // Cache result
    await prisma.linkPreview.upsert({
      where: { url },
      update: { ...preview, fetchedAt: new Date() },
      create: { url, ...preview },
    });

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
