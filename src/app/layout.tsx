import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getCarrier } from "@/lib/carrier";

const carrier = getCarrier();

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(carrier.siteUrl),
  title: {
    default: carrier.metaTitle,
    template: `%s | ${carrier.siteName}`,
  },
  description: carrier.metaDescription,
  keywords: carrier.keywords,
  authors: [{ name: 'Luo Lei', url: 'https://luolei.org' }],
  creator: 'Luo Lei',
  publisher: 'Luo Lei',
  applicationName: carrier.siteName,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: carrier.ogTitle,
    description: carrier.ogDescription,
    url: carrier.siteUrl,
    siteName: carrier.siteName,
    locale: 'zh_CN',
    type: 'website',
    images: {
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: carrier.metaTitle,
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: carrier.ogTitle,
    description: carrier.ogDescription,
    creator: '@luoleiorg',
    images: {
      url: '/twitter-image',
      width: 1200,
      height: 630,
      alt: carrier.metaTitle,
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: carrier.siteUrl,
    languages: {
      'zh-CN': carrier.siteUrl,
      'zh-HK': carrier.siteUrl,
      'zh-TW': carrier.siteUrl,
    },
  },
  verification: {
    // 如果你要使用 Google Search Console，取消下面注释并填入你的验证码
    // google: 'your-google-verification-code',
    // 百度站长验证
    // other: {
    //   'baidu-site-verification': 'your-baidu-code',
    // },
  },
  category: 'technology',
  classification: 'Utilities',
  other: {
    'baidu-site-verification': '',
    'msvalidate.01': '',
    'yandex-verification': '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" dir="ltr" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {process.env.NEXT_PUBLIC_GA_ID && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          )}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
