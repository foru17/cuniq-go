import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { ThemeProvider } from "@/components/ThemeProvider";

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
  metadataBase: new URL('https://cuniq.zuoluo.tv'),
  title: {
    default: 'CUniq Go 月神卡选号神器 - 香港联通一卡双号筛选工具',
    template: '%s | CUniq Go',
  },
  description: 'CUniq月神卡选号神器，专为靓号爱好者打造。HK$9/月低成本持有香港+852与内地+86一卡双号，支持实体卡/eSIM。本工具支持多维度靓号筛选（AABB/ABAB/连号/尾号过滤），每15分钟自动同步官网数据，比手动刷号更高效。',
  keywords: ['CUniq', '月神卡', '香港联通', '一卡双号', '靓号', 'eSIM', '852号码', '86号码', '选号工具', 'AABB', '连号', 'HK$9套餐', '无押金', '香港手机号', '内地身份证'],
  authors: [{ name: 'Luo Lei', url: 'https://luolei.org' }],
  creator: 'Luo Lei',
  publisher: 'Luo Lei',
  applicationName: 'CUniq Go',
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'CUniq Go 月神卡选号神器 - HK$9/月 一卡双号',
    description: 'HK$9/月低成本持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选，数据实时同步。',
    url: 'https://cuniq.zuoluo.tv',
    siteName: 'CUniq Go',
    locale: 'zh_CN',
    type: 'website',
    images: {
      url: '/opengraph-image',
      width: 1200,
      height: 630,
      alt: 'CUniq Go 月神卡选号神器',
    },
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CUniq Go 月神卡选号神器 - HK$9/月 一卡双号',
    description: 'HK$9/月低成本持有香港+852与内地+86一卡双号。支持AABB/连号/尾号过滤等多种靓号筛选。',
    creator: '@luoleiorg',
    images: {
      url: '/twitter-image',
      width: 1200,
      height: 630,
      alt: 'CUniq Go 月神卡选号神器',
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
    canonical: 'https://cuniq.zuoluo.tv',
    languages: {
      'zh-CN': 'https://cuniq.zuoluo.tv',
      'zh-HK': 'https://cuniq.zuoluo.tv',
      'zh-TW': 'https://cuniq.zuoluo.tv',
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
