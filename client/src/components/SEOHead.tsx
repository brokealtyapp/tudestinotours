import { useEffect } from "react";

export interface SEOHeadProps {
  title: string;
  description: string;
  ogType?: "website" | "article";
  ogImage?: string;
  ogUrl?: string;
  noindex?: boolean;
}

export default function SEOHead({
  title,
  description,
  ogType = "website",
  ogImage,
  ogUrl,
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    document.title = `${title} | Tu Destino Tours`;

    const updateOrCreateMeta = (
      selector: string,
      attribute: string,
      value: string
    ) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        const [attrName, attrValue] = selector
          .match(/\[(.+?)="(.+?)"\]/)!
          .slice(1);
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    updateOrCreateMeta('meta[name="description"]', "content", description);
    
    if (noindex) {
      updateOrCreateMeta('meta[name="robots"]', "content", "noindex, nofollow");
    } else {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) {
        robotsMeta.remove();
      }
    }

    updateOrCreateMeta('meta[property="og:title"]', "content", title);
    updateOrCreateMeta('meta[property="og:description"]', "content", description);
    updateOrCreateMeta('meta[property="og:type"]', "content", ogType);
    
    if (ogImage) {
      updateOrCreateMeta('meta[property="og:image"]', "content", ogImage);
    }
    
    if (ogUrl) {
      updateOrCreateMeta('meta[property="og:url"]', "content", ogUrl);
    }

    updateOrCreateMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    updateOrCreateMeta('meta[name="twitter:title"]', "content", title);
    updateOrCreateMeta('meta[name="twitter:description"]', "content", description);
    
    if (ogImage) {
      updateOrCreateMeta('meta[name="twitter:image"]', "content", ogImage);
    }
  }, [title, description, ogType, ogImage, ogUrl, noindex]);

  return null;
}
