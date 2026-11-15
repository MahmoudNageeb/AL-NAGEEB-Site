import { NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { getPublicSettings, recordDownloadEventInDb } from '@/lib/db';
import { isPrefetchRequestHeaders } from '@/lib/analytics-logic';
import { resolveApkDownloadUrl } from '@/lib/reviews-logic';

export const dynamic = 'force-dynamic';

function resolveRedirectTarget(
  requestUrl: string,
  version: string,
  dynamicApkUrl?: string,
): { responseUrl: URL | string; recordedTarget: string } {
  const cleaned = dynamicApkUrl?.trim();
  if (cleaned) {
    if (cleaned.startsWith('/')) {
      return {
        responseUrl: new URL(cleaned, requestUrl),
        recordedTarget: cleaned,
      };
    }
    if (/^https?:\/\//i.test(cleaned)) {
      return {
        responseUrl: cleaned,
        recordedTarget: cleaned,
      };
    }
  }

  const localApkPath = path.join(
    process.cwd(),
    'public',
    'downloads',
    `al-nageeb-v${version}.apk`,
  );

  if (existsSync(localApkPath)) {
    const localUrl = `/downloads/al-nageeb-v${version}.apk`;
    return {
      responseUrl: new URL(localUrl, requestUrl),
      recordedTarget: localUrl,
    };
  }

  const fallbackUrl = resolveApkDownloadUrl(process.env.APK_DOWNLOAD_URL);
  return {
    responseUrl: fallbackUrl,
    recordedTarget: fallbackUrl,
  };
}

export async function GET(request: Request) {
  const settings = await getPublicSettings();
  const { responseUrl, recordedTarget } = resolveRedirectTarget(
    request.url,
    settings.version,
    settings.apkDownloadUrl,
  );

  if (!isPrefetchRequestHeaders(request.headers)) {
    try {
      await recordDownloadEventInDb({
        version: settings.version,
        targetUrl: recordedTarget,
        userAgent: request.headers.get('user-agent') || '',
      });
    } catch {
      // Never block APK download if analytics storage fails
    }
  }

  return NextResponse.redirect(responseUrl, 302);
}
