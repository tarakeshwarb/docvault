import Link from "next/link";
import { BookOpen, GraduationCap, Layers, Calendar, Users, ArrowRight, Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    title: "Academic Years",
    desc: "Create and manage academic calendar years",
    href: "/admin/academic-years",
    icon: Calendar,
    color: "text-blue-500 bg-blue-50",
  },
  {
    title: "Semesters",
    desc: "Create Odd/Even semesters for each year",
    href: "/admin/semesters",
    icon: Layers,
    color: "text-purple-500 bg-purple-50",
  },

  {
    title: "Courses",
    desc: "Add and maintain course master data",
    href: "/admin/courses",
    icon: GraduationCap,
    color: "text-orange-500 bg-orange-50",
  },
  {
    title: "Course Offerings",
    desc: "Map courses to semesters, assign coordinators",
    href: "/admin/offerings",
    icon: Link2,
    color: "text-red-500 bg-red-50",
  },
  {
    title: "Faculty Directory",
    desc: "View all faculty members and their roles",
    href: "/admin/faculty",
    icon: Users,
    color: "text-indigo-500 bg-indigo-50",
  },
];

export default async function AdminPage() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-br from-[var(--color-ink)] to-[#1e4080] p-5 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
          Admin Command Center
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Academic Course File Management
        </h1>
        <p className="mt-2 text-base text-white/70 max-w-xl">
          Manage the full academic hierarchy — years, semesters, courses, offerings,
          coordinators, and faculty across departments.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
          <Link
            href="/admin/offerings"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-gray-50 transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            View Existing Offerings
          </Link>
          <Link
            href="/admin/offerings/new"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            New Course Offering
          </Link>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">Quick Access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md hover:border-black/10 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`rounded-lg p-2.5 ${link.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-[var(--color-ink)]">{link.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{link.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

    </div>
  );
}
