import type { Metadata } from 'next';
import Link from 'next/link';
import { getCarrier } from '@/lib/carrier';

const carrier = getCarrier();

export const metadata: Metadata = {
  title: `页面未找到 | ${carrier.siteName}`,
  description: `抱歉，您访问的页面不存在。返回 ${carrier.metaTitle} 首页。`,
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">
          页面未找到
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          抱歉，您访问的页面不存在或已被移除。
          <br />
          返回首页继续使用 {carrier.appName}。
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
