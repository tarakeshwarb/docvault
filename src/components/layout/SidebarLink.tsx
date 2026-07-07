"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export default function SidebarLink({ 
  item, 
  children 
}: { 
  item: { href?: string; label: string; active?: boolean; variant?: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isDashboard = 
    item.href === "/admin" || 
    item.href === "/faculty" || 
    item.href === "/course-coordinator" || 
    item.href === "/secondary-coordinator" || 
    item.href === "/hod" || 
    item.href === "/audit";
    
  const isExactMatch = pathname === item.href;
  const isPrefixMatch = item.href && !isDashboard && !item.href.startsWith('#') && pathname?.startsWith(item.href);
  
  const isActive = item.active !== undefined ? item.active : (isExactMatch || isPrefixMatch);

  let classes = isActive
    ? "rounded-full bg-[var(--color-accent)] px-4 py-2 text-white flex items-center gap-3"
    : "rounded-full border border-black/10 bg-white px-4 py-2 text-[var(--color-ink)] flex items-center gap-3 hover:bg-gray-50 transition-colors";
  
  if (item.variant === "faculty" || item.variant === "coordinator" || item.variant === "audit") {
    classes = isActive
      ? "rounded-full bg-[var(--color-accent)] px-4 py-2 text-white flex items-center gap-3"
      : "rounded-full border border-[var(--color-accent)]/20 bg-white px-4 py-2 text-[var(--color-accent)] flex items-center gap-3 hover:bg-gray-50 transition-colors font-semibold shadow-sm";
  }

  if (item.href) {
    return (
      <Link href={item.href} className={classes}>
        {children}
        {item.label}
      </Link>
    );
  }

  return (
    <div className={classes}>
      {children}
      {item.label}
    </div>
  );
}
