import React from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import PostLink from "./link";
import PostImage from "./image";
import rehypePrettyCode from "rehype-pretty-code";

const transformToSlug = (input: string) => {
  return input
    .toLowerCase()
    .trim()
    .split(" ")
    .join("-")
    .split("&")
    .join("-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

const generateHeading = (headingLevel: number) => {
  const HeadingComponent = ({ children }: { children: React.ReactNode }) => {
    const textContent = React.Children.toArray(children).join("");
    const slug = transformToSlug(textContent);
    return React.createElement(`h${headingLevel}`, { id: slug }, [
      React.createElement("a", {
        href: `#${slug}`,
        key: `link-${slug}`,
        className: "anchor-link",
      }),
      textContent,
    ]);
  };

  HeadingComponent.displayName = `Heading${headingLevel}`;

  return HeadingComponent;
};

const mdxComponents = {
  h1: generateHeading(1),
  h2: generateHeading(2),
  h3: generateHeading(3),
  h4: generateHeading(4),
  Link: PostLink,
  Image: PostImage,
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-6 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mb-6 ml-6 list-disc space-y-2">{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mb-6 ml-6 list-decimal space-y-2">{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="text-indigo-200/65">{children}</li>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="mb-6 border-l-4 border-indigo-500 pl-4 italic text-indigo-200/65">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full border-collapse border border-gray-700">{children}</table>
    </div>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="border border-gray-700 bg-gray-800 px-4 py-2 text-left font-semibold text-gray-200">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="border border-gray-700 px-4 py-2 text-indigo-200/65">{children}</td>
  ),
};

export function CustomMDX(props: any) {
  const rehypePrettyCodeOptions = {
    theme: "one-dark-pro",
    keepBackground: false,
    onVisitLine(node: any) {
      // Prevent lines from collapsing in `display: grid` mode, and
      // allow empty lines to be copy/pasted
      if (node.children.length === 0) {
        node.children = [{ type: "text", value: " " }];
      }
    },
    onVisitHighlightedLine(node: any) {
      // Each line node by default has `class="line"`.
      node.properties.className.push("line--highlighted");
    },
    onVisitHighlightedWord(node: any) {
      // Each word node has no className by default.
      node.properties.className = ["word--highlighted"];
    },
  };

  return (
    <MDXRemote
      {...props}
      components={{ ...mdxComponents, ...(props.components || {}) }}
      options={{
        mdxOptions: {
          rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]],
        },
      }}
    />
  );
}
