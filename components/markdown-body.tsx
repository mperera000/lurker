import { cn } from "@/lib/utils";

export function MarkdownBody({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "space-y-3 text-sm leading-relaxed [&_a]:text-sky-400 [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:pt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-foreground/90",
        className,
      )}
    >
      {parseMarkdown(markdown).map((node, index) => (
        <MarkdownNode key={index} node={node} />
      ))}
    </article>
  );
}

type Node =
  | { type: "h1" | "h2" | "h3" | "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "blank" };

function parseMarkdown(markdown: string): Node[] {
  const nodes: Node[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length > 0) {
      nodes.push({ type: "ul", items: list });
      list = [];
    }
  };

  for (const raw of markdown.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flushList();
      nodes.push({ type: "h3", text: line.slice(4) });
    } else if (line.startsWith("## ")) {
      flushList();
      nodes.push({ type: "h2", text: line.slice(3) });
    } else if (line.startsWith("# ")) {
      flushList();
      nodes.push({ type: "h1", text: line.slice(2) });
    } else if (line.startsWith("- ")) {
      list.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
      nodes.push({ type: "blank" });
    } else {
      flushList();
      nodes.push({ type: "p", text: line });
    }
  }
  flushList();
  return nodes;
}

function MarkdownNode({ node }: { node: Node }) {
  if (node.type === "blank") return null;
  if (node.type === "ul") {
    return (
      <ul>
        {node.items.map((item, index) => (
          <li key={index}>
            <Inline text={item} />
          </li>
        ))}
      </ul>
    );
  }
  const Tag = node.type;
  return (
    <Tag>
      <Inline text={node.text} />
    </Tag>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*[^*]+\*|_[^_]+_)/g);
  return (
    <>
      {parts.map((part, index) => {
        const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link) {
          return (
            <a key={index} href={link[2]} target="_blank" rel="noreferrer">
              {link[1]}
            </a>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={index}>{part.slice(1, -1)}</code>;
        }
        if (
          (part.startsWith("*") && part.endsWith("*") && part.length > 2) ||
          (part.startsWith("_") && part.endsWith("_") && part.length > 2)
        ) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
