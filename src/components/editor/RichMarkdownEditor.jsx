import { useEffect, useMemo, useRef } from "react";
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  headingsPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import "./RichMarkdownEditor.css";

function normalizeMarkdownValue(value) {
  return typeof value === "string" ? value : "";
}

function isSafeEditorUrl(value) {
  if (!value) {
    return false;
  }

  if (value.startsWith("/") || value.startsWith("#")) {
    return true;
  }

  try {
    const parsedUrl = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:", "tel:"].includes(
      parsedUrl.protocol,
    );
  } catch {
    return false;
  }
}

function RichMarkdownToolbar() {
  return (
    <>
      <UndoRedo />
      <Separator />
      <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
      <Separator />
      <ListsToggle options={["bullet", "number"]} />
      <Separator />
      <BlockTypeSelect />
      <Separator />
      <CreateLink />
    </>
  );
}

export function RichMarkdownEditor({
  describedBy,
  disabled = false,
  id,
  label,
  onChange,
  placeholder = "",
  value = "",
}) {
  const editorRef = useRef(null);
  const lastSyncedMarkdownRef = useRef(normalizeMarkdownValue(value));
  const normalizedValue = normalizeMarkdownValue(value);

  const plugins = useMemo(
    () => [
      headingsPlugin({ allowedHeadingLevels: [2, 3] }),
      listsPlugin(),
      linkPlugin({
        disableAutoLink: true,
        validateUrl: isSafeEditorUrl,
      }),
      linkDialogPlugin(),
      markdownShortcutPlugin(),
      toolbarPlugin({
        toolbarContents: RichMarkdownToolbar,
      }),
    ],
    [],
  );

  useEffect(() => {
    if (normalizedValue === lastSyncedMarkdownRef.current) {
      return;
    }

    editorRef.current?.setMarkdown(normalizedValue);
    lastSyncedMarkdownRef.current = normalizedValue;
  }, [normalizedValue]);

  const handleChange = (nextMarkdown) => {
    const normalizedMarkdown = normalizeMarkdownValue(nextMarkdown);

    lastSyncedMarkdownRef.current = normalizedMarkdown;
    onChange?.(normalizedMarkdown);
  };

  return (
    <div className="rich-markdown-editor">
      {label ? (
        <label className="rich-markdown-editor__label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <MDXEditor
        ref={editorRef}
        className="rich-markdown-editor__surface"
        contentEditableClassName="rich-markdown-editor__content"
        markdown={normalizedValue}
        onChange={handleChange}
        placeholder={placeholder}
        plugins={plugins}
        readOnly={disabled}
        suppressHtmlProcessing
        trim={false}
        aria-describedby={describedBy}
        id={id}
      />
    </div>
  );
}
