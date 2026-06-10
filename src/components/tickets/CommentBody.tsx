import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders ticket comment body as Markdown with @mention highlighting.
 * GFM enabled (lists, tables, links, code blocks). Inline `code`, **bold**,
 * _italic_, > quote, links, and lists are supported.
 */
export function CommentBody({ text }: { text: string }) {
  // Highlight @mentions by wrapping them with a marker the markdown renderer keeps as text;
  // then post-process via custom `text` component.
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words
                    prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2
                    prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                    prose-code:bg-muted prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none
                    prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                    prose-a:text-primary">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
          // Render @mentions in primary color
          p: ({ children }) => <p>{renderMentions(children)}</p>,
          li: ({ children }) => <li>{renderMentions(children)}</li>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function renderMentions(children: any): any {
  if (typeof children === "string") {
    const parts = children.split(/(@[^\s@]+(?:\s[^\s@]+)?)/g);
    return parts.map((p, i) =>
      p.startsWith("@")
        ? <span key={i} className="text-primary font-medium">{p}</span>
        : <span key={i}>{p}</span>
    );
  }
  if (Array.isArray(children)) return children.map((c, i) =>
    typeof c === "string" ? <span key={i}>{renderMentions(c)}</span> : c
  );
  return children;
}