import { useEffect } from "react";

const DEFAULT_ROBOTS_CONTENT = "index, follow";

function upsertMetaAttribute(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });
}

function upsertCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

export function SeoHead({
  title,
  description,
  canonicalUrl,
  robots = DEFAULT_ROBOTS_CONTENT,
}) {
  useEffect(() => {
    document.title = title;

    upsertMetaAttribute('meta[name="description"]', {
      name: "description",
      content: description,
    });

    upsertMetaAttribute('meta[name="robots"]', {
      name: "robots",
      content: robots,
    });

    upsertCanonical(canonicalUrl);
  }, [canonicalUrl, description, robots, title]);

  return null;
}
