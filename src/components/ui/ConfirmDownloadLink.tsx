"use client";

import React, { useState } from "react";
import { Download, AlertCircle } from "lucide-react";

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export function ConfirmDownloadLink({ href, children, ...props }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <a
        href={href}
        {...props}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(true);
          if (props.onClick) {
            props.onClick(e);
          }
        }}
      >
        {children}
      </a>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <Download className="h-5 w-5" />
              </div>
              <div className="mt-1">
                <h3 className="text-lg font-semibold text-gray-900">Download File</h3>
                <p className="mt-1.5 text-sm text-gray-500">
                  Are you sure you want to download this file? It will be saved to your device.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <a
                href={href}
                target={props.target}
                rel={props.rel}
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-accent)] hover:bg-[#0a3f85] rounded-lg transition-colors shadow-sm"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
