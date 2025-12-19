"use client";

import Link from "next/link";
import { useCategoryProvider } from "./category-provider";

export default function PostItem({ ...props }) {
  const { category } = useCategoryProvider();
  const postCategory = props.metadata.category || "Insights";
  const isHidden = category !== "All" && category !== postCategory;

  const authorName = props.metadata.author || "tCredex Team";
  const authorRole = props.metadata.authorRole || "Editorial";
  const publishDate = props.metadata.publishedAt || "";

  return (
    <article
      className={`flex h-full flex-col transition-opacity ${isHidden ? "pointer-events-none opacity-15" : ""}`}
    >
      <header>
        {/* Placeholder for future images - shows gradient background */}
        <Link
          className="group relative mb-6 block overflow-hidden rounded-2xl border border-gray-800/80 before:absolute before:inset-0 before:-z-10 before:bg-linear-to-br before:from-gray-900 before:via-indigo-500/50 before:to-indigo-500 before:opacity-50"
          href={`/blog/${props.slug}`}
          tabIndex={-1}
        >
          <div className="aspect-[16/10] w-full bg-gradient-to-br from-gray-800 via-indigo-900/30 to-gray-900 flex items-center justify-center transition ease-out group-hover:scale-[1.02]">
            <div className="text-center p-4">
              <span className="text-5xl mb-2 block">📊</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{postCategory}</span>
            </div>
          </div>
        </Link>
        <div className="mb-3">
          <ul className="flex flex-wrap gap-2">
            <li>
              <span
                className="btn-sm relative rounded-full bg-gray-800/40 px-2.5 py-0.5 text-xs font-normal before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_bottom,--theme(--color-gray-700/.15),--theme(--color-gray-700/.5))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)]"
              >
                <span className="bg-linear-to-r from-indigo-500 to-indigo-200 bg-clip-text text-transparent">
                  {postCategory}
                </span>
              </span>
            </li>
          </ul>
        </div>
        <h3 className="mb-2 font-nacelle text-lg font-semibold">
          <Link
            className="text-gray-200 transition hover:text-white"
            href={`/blog/${props.slug}`}
          >
            {props.metadata.title}
          </Link>
        </h3>
        {props.metadata.summary && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">{props.metadata.summary}</p>
        )}
      </header>
      <footer className="flex items-center gap-3 mt-auto pt-2">
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium shrink-0">
          {authorName.charAt(0)}
        </div>
        <div className="text-sm text-gray-400">
          <span className="font-medium text-gray-300">{authorName}</span>
          {publishDate && (
            <>
              <span className="mx-2">·</span>
              <span>{publishDate}</span>
            </>
          )}
        </div>
      </footer>
    </article>
  );
}
