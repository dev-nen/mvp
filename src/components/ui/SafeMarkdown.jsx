import ReactMarkdown from "react-markdown";
import "./SafeMarkdown.css";

const DISALLOWED_MARKDOWN_ELEMENTS = [
  "img",
  "script",
  "iframe",
  "style",
  "svg",
  "object",
  "embed",
];

function isSafeMarkdownUrl(value) {
  if (!value) {
    return false;
  }

  if (value.startsWith("/") || value.startsWith("#")) {
    return true;
  }

  try {
    const parsedUrl = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function SafeMarkdownLink({ children, href = "", node: _node, ...props }) {
  const safeHref = isSafeMarkdownUrl(href) ? href : "";

  if (!safeHref) {
    return <span>{children}</span>;
  }

  const isExternalHref = /^https?:\/\//i.test(safeHref);

  return (
    <a
      {...props}
      href={safeHref}
      target={isExternalHref ? "_blank" : undefined}
      rel={isExternalHref ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function SafeMarkdown({ className = "", content = "" }) {
  const classes = ["safe-markdown", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <ReactMarkdown
        disallowedElements={DISALLOWED_MARKDOWN_ELEMENTS}
        skipHtml
        unwrapDisallowed
        components={{
          a: SafeMarkdownLink,
          h1: "h3",
          h2: "h3",
          h3: "h3",
          h4: "h4",
          h5: "h4",
          h6: "h4",
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
