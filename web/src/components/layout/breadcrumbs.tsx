"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-8 font-label text-xs tracking-widest uppercase text-outline">
      <Link
        href="/"
        className="hover:text-primary transition-colors cursor-pointer"
      >
        Home
      </Link>

      {items.map((item, index) => (
        <Fragment key={index}>
          <ChevronRight className="h-3 w-3 text-outline-variant" aria-hidden="true" />
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-on-surface" aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
