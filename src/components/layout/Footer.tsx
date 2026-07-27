import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative mt-12 bg-white pt-16 pb-8 border-t border-black/5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between lg:gap-20">
          <div className="max-w-sm space-y-6">
            <div className="flex items-center gap-4">
              <Image
                src="/SRM_Institute_of_Science_and_Technology_Logo.svg"
                alt="SRM Institute of Science and Technology logo"
                width={140}
                height={52}
                className="h-10 w-auto object-contain opacity-90"
              />
              <div className="h-8 w-[1px] bg-black/10" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[var(--color-ink)] tracking-tight">
                  CourseFlow
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  Academic Portal
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              A streamlined, production-grade workspace for managing semester-wise course documents,
              faculty submissions, and automated accreditation reports.
            </p>
          </div>

          <div className="flex gap-12 sm:gap-24">
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--color-ink)]">
                Platform
              </h3>
              <ul className="space-y-3 text-sm text-[var(--color-muted)]">
                <li>Admin Control</li>
                <li>Coordinator Hub</li>
                <li>Faculty Uploads</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-[var(--color-ink)]">
                Support
              </h3>
              <ul className="space-y-3 text-sm text-[var(--color-muted)]">
                <li>Contact IT Helpdesk</li>
                <li>Documentation</li>
                <li><a href="mailto:support@university.edu" className="text-[var(--color-accent)] hover:underline">support@university.edu</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-8 sm:flex-row">
          <p className="text-xs text-[var(--color-muted)]">
            &copy; {new Date().getFullYear()} CourseFlow Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-muted)]">
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
