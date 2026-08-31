'use client';

import Script from 'next/script';
import { getCarrier } from '@/lib/carrier';

interface SoftwareAppData {
  name: string;
  description: string;
  url: string;
  authorName: string;
  authorUrl: string;
  datePublished: string;
  dateModified: string;
}

interface WebSiteData {
  name: string;
  url: string;
  description: string;
  potentialAction?: {
    target: string;
    queryInput: string;
  };
}

// 软件应用结构化数据
export function SoftwareAppJsonLd({
  name,
  description,
  url,
  authorName,
  authorUrl,
  datePublished,
  dateModified,
}: SoftwareAppData) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'HKD',
      availability: 'https://schema.org/InStock',
    },
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl,
    },
    datePublished,
    dateModified,
    softwareVersion: '1.0.0',
    inLanguage: 'zh-CN',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '100',
      bestRating: '5',
      worstRating: '1',
    },
  };

  return (
    <Script
      id="software-app-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// 网站结构化数据
export function WebSiteJsonLd({
  name,
  url,
  description,
  potentialAction,
}: WebSiteData) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
    inLanguage: 'zh-CN',
  };

  if (potentialAction) {
    jsonLd.potentialAction = {
      '@type': 'SearchAction',
      target: potentialAction.target,
      'query-input': potentialAction.queryInput,
    };
  }

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// 面包屑导航结构化数据
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <Script
      id="breadcrumb-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// 组织结构化数据
export function OrganizationJsonLd() {
  const carrier = getCarrier();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: carrier.siteName,
    url: carrier.siteUrl,
    logo: `${carrier.siteUrl}${carrier.logoSrc}`,
    sameAs: [
      'https://github.com/foru17',
    ],
    founder: {
      '@type': 'Person',
      name: 'Luo Lei',
      url: 'https://luolei.org',
    },
  };

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// FAQ 结构化数据
export function FaqJsonLd({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <Script
      id="faq-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
