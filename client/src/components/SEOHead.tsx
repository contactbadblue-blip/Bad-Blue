import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

export function SEOHead({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogType = "website",
  ogImage = "https://badblue.replit.app/preview.png",
  canonicalUrl,
  structuredData,
}: SEOHeadProps) {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to set or update meta tags
    const setMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? "property" : "name";
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute("content", content);
    };

    // Set basic meta tags
    setMetaTag("description", description);
    if (keywords) {
      setMetaTag("keywords", keywords);
    }
    setMetaTag("robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
    setMetaTag("author", "BadBlue");
    setMetaTag("language", "English");
    setMetaTag("revisit-after", "1 days");
    setMetaTag("rating", "General");
    setMetaTag("distribution", "Global");
    
    // Additional SEO meta tags
    setMetaTag("googlebot", "index, follow");
    setMetaTag("bingbot", "index, follow");
    setMetaTag("referrer", "origin-when-cross-origin");
    setMetaTag("format-detection", "telephone=no");
    setMetaTag("HandheldFriendly", "True");
    setMetaTag("MobileOptimized", "320");
    setMetaTag("theme-color", "#1e40af");
    setMetaTag("apple-mobile-web-app-capable", "yes");
    setMetaTag("apple-mobile-web-app-status-bar-style", "black-translucent");

    // Set Open Graph tags for social media
    setMetaTag("og:title", ogTitle || title, true);
    setMetaTag("og:description", ogDescription || description, true);
    setMetaTag("og:type", ogType, true);
    setMetaTag("og:image", ogImage, true);
    if (canonicalUrl) {
      setMetaTag("og:url", canonicalUrl, true);
    }

    // Set Twitter Card tags
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", ogTitle || title);
    setMetaTag("twitter:description", ogDescription || description);
    setMetaTag("twitter:image", ogImage);

    // Set canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    }

    // Add sitemap link reference
    let sitemapLink = document.querySelector('link[rel="sitemap"]');
    if (!sitemapLink) {
      sitemapLink = document.createElement("link");
      sitemapLink.setAttribute("rel", "sitemap");
      sitemapLink.setAttribute("type", "application/xml");
      document.head.appendChild(sitemapLink);
    }
    sitemapLink.setAttribute("href", `${canonicalUrl || 'https://badblue.com'}/sitemap.xml`);

    // Add robots.txt link reference
    let robotsLink = document.querySelector('link[rel="robots"]');
    if (!robotsLink) {
      robotsLink = document.createElement("link");
      robotsLink.setAttribute("rel", "robots");
      document.head.appendChild(robotsLink);
    }
    robotsLink.setAttribute("href", `${canonicalUrl || 'https://badblue.com'}/robots.txt`);

    // Add structured data (Schema.org)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement("script");
        script.setAttribute("type", "application/ld+json");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Add BreadcrumbList structured data for site navigation
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": canonicalUrl || "https://badblue.com"
        }
      ]
    };

    let breadcrumbScript = document.querySelector('script#breadcrumb-schema');
    if (!breadcrumbScript) {
      breadcrumbScript = document.createElement("script");
      breadcrumbScript.setAttribute("type", "application/ld+json");
      breadcrumbScript.setAttribute("id", "breadcrumb-schema");
      document.head.appendChild(breadcrumbScript);
    }
    breadcrumbScript.textContent = JSON.stringify(breadcrumbData);

    // Add Organization structured data
    const organizationData = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "BadBlue",
      "url": canonicalUrl || "https://badblue.com",
      "logo": `${canonicalUrl || 'https://badblue.com'}/preview.png`,
      "description": "AI-powered police accountability platform for civil rights lawsuits, complaints, and FOIA requests",
      "sameAs": [
        canonicalUrl || "https://badblue.com"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Customer Support",
        "email": "contact.badblue@gmail.com"
      }
    };

    let orgScript = document.querySelector('script#organization-schema');
    if (!orgScript) {
      orgScript = document.createElement("script");
      orgScript.setAttribute("type", "application/ld+json");
      orgScript.setAttribute("id", "organization-schema");
      document.head.appendChild(orgScript);
    }
    orgScript.textContent = JSON.stringify(organizationData);
  }, [title, description, keywords, ogTitle, ogDescription, ogType, ogImage, canonicalUrl, structuredData]);

  return null;
}
