import Link from "next/link";
import { getFacultySession } from "@/lib/auth";
import { logoutFaculty } from "@/app/actions/auth-actions";

export default async function Header() {
  const session = await getFacultySession();

  return (
    <header className="relative">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-2 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-3 lg:px-2">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0c4da2] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(12,77,162,0.22)] sm:h-11 sm:w-11">
            DV
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-[var(--color-ink)] sm:text-lg">
              DocVault
            </p>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--color-muted)] sm:text-[10px] sm:tracking-[0.3em]">
              Academic Operations Hub
            </p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
          {session ? (
            <>
              {/* HOD link — only visible to hod role */}
              {session.role === "hod" && (
                <Link
                  href="/hod"
                  className="rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1.5 text-[11px] font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-white sm:px-4 sm:py-2 sm:text-sm"
                >
                  HOD Dashboard
                </Link>
              )}

              {/* Audit link — only visible to hod role or auditor */}
              {(session.role === "hod" || session.faculty_id === 100174) && (
                <Link
                  href="/audit"
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:px-4 sm:py-2 sm:text-sm"
                >
                  Audit
                </Link>
              )}

              <div className="flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-[11px] font-medium text-white sm:px-4 sm:py-2 sm:text-sm">
                {session.faculty_name}
              </div>

              <form action={logoutFaculty}>
                <button
                  type="submit"
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:px-4 sm:py-2 sm:text-sm"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-3 py-1.5 text-[11px] font-medium text-white sm:px-4 sm:py-2 sm:text-sm">
              College Admin
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
