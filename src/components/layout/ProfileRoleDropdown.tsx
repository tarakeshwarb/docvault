"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Loader2,
  GraduationCap,
  LayoutGrid,
  Users,
  ShieldCheck,
  ClipboardList,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { type FacultySession } from "@/lib/auth";
import { type UserAssignedRole } from "@/lib/user-roles";
import { switchFacultyRole } from "@/app/actions/auth-actions";

const ROLE_ICONS: Record<string, LucideIcon> = {
  faculty: GraduationCap,
  main_coordinator: LayoutGrid,
  dept_coordinator: Users,
  hod: ShieldCheck,
  audit: ClipboardList,
  admin: Settings,
  developer: Settings,
};

const ROLE_LABELS: Record<string, string> = {
  faculty: "Faculty",
  main_coordinator: "SOC Coord.",
  dept_coordinator: "Dept Coord.",
  hod: "HoD/AC/Chair",
  audit: "Audit",
  admin: "Admin",
  developer: "Developer",
};

interface ProfileRoleDropdownProps {
  facultyName: string;
  currentRole: FacultySession["role"];
  assignedRoles: UserAssignedRole[];
}

export default function ProfileRoleDropdown({
  facultyName,
  currentRole,
  assignedRoles,
}: ProfileRoleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentRoleDisplay = ROLE_LABELS[currentRole] ?? currentRole;

  // If assigned to only 1 role or no roles, render as simple pill (no dropdown)
  if (assignedRoles.length <= 1) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-[11px] font-medium text-white sm:px-4 sm:py-2 sm:text-sm">
        <span>{facultyName}</span>
        <span className="hidden sm:inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/90">
          {currentRoleDisplay}
        </span>
      </div>
    );
  }

  async function handleRoleSwitch(targetRole: FacultySession["role"]) {
    if (targetRole === currentRole || switchingTo) return;

    setSwitchingTo(targetRole);
    try {
      const res = await switchFacultyRole(targetRole);
      if (res.ok && res.redirectTo) {
        window.location.href = res.redirectTo;
      } else {
        alert(res.message || "Failed to switch role.");
        setSwitchingTo(null);
      }
    } catch {
      alert("An unexpected error occurred while switching role.");
      setSwitchingTo(null);
    }
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Profile Button with Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="group flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-[#12284c] sm:px-4 sm:py-2 sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 active:scale-[0.98]"
      >
        <span>{facultyName}</span>
        <span className="hidden sm:inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/90">
          {currentRoleDisplay}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-white/70 transition-transform duration-200 group-hover:text-white ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 origin-top-right rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] z-50">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Switch Role
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-[var(--color-ink)]">
              {facultyName}
            </p>
          </div>

          <div className="mt-1 space-y-0.5">
            {assignedRoles.map((item) => {
              const Icon = ROLE_ICONS[item.role] || Settings;
              const isCurrent = item.role === currentRole;
              const isSwitchingThis = switchingTo === item.role;

              return (
                <button
                  key={item.role}
                  type="button"
                  disabled={isCurrent || switchingTo !== null}
                  onClick={() => handleRoleSwitch(item.role)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-semibold cursor-default"
                      : "text-gray-700 hover:bg-gray-50 hover:text-[var(--color-ink)] cursor-pointer"
                  } disabled:opacity-60`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0 text-current" />
                    <span>{item.label}</span>
                  </div>

                  {isSwitchingThis ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-accent)]" />
                  ) : isCurrent ? (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-accent)] font-semibold">
                      <Check className="h-3.5 w-3.5" />
                      <span>Active</span>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
