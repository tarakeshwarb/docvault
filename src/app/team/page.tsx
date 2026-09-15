import Image from "next/image";
import { User } from "lucide-react";

export default function TeamPage() {
  const mentors = [
    {
      name: "Dr. Hariharan R",
      role: "Assistant Professor",
      department: "Mentor",
      image: "",
    },
    {
      name: "Dr. Priya S",
      role: "Associate Professor",
      department: "Mentor",
      image: "",
    },
  ];

  const coreTeam = [
    {
      name: "Tarakeshwar B",
      role: "Team Lead",
      department: "Core Development",
      image: "",
    },
    {
      name: "Sai Ishita",
      role: "Associate Lead",
      department: "Core Development",
      image: "",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#0b1f47] py-16 sm:py-20">
        <Image
          src="/geometric-bg.svg"
          alt=""
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1f47] via-[#0b1f47]/85 to-[var(--color-accent)]/70" />
        <div className="absolute top-8 right-16 h-32 w-32 rounded-full bg-white/[0.03] blur-xl" />
        <div className="absolute bottom-8 left-10 h-48 w-48 rounded-full bg-[var(--color-accent)]/10 blur-2xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Meet Our Team
            </h2>
            <p className="mt-6 text-lg leading-8 text-white/80">
              The dedicated individuals behind DocVault, working to streamline academic course file management.
            </p>
          </div>
        </div>
      </div>

      {/* Mentors Section */}
      <div className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Mentors
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
              Guiding our vision and ensuring academic excellence in our processes.
            </p>
          </div>
          <ul
            role="list"
            className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-2"
          >
            {mentors.map((person) => (
              <li key={person.name} className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {person.image ? (
                  <Image
                    className="aspect-[1/1] w-32 flex-none rounded-2xl object-cover shadow-lg"
                    src={person.image}
                    alt={person.name}
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="flex h-32 w-32 flex-none items-center justify-center rounded-2xl bg-gray-100 shadow-sm border border-black/5 text-[var(--color-muted)]">
                    <User className="h-12 w-12 opacity-50" />
                  </div>
                )}
                <div className="text-center sm:text-left pt-2">
                  <h3 className="text-lg font-semibold leading-8 tracking-tight text-[var(--color-ink)]">
                    {person.name}
                  </h3>
                  <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-accent)] mt-1">
                    {person.role}
                  </p>
                  <p className="text-sm leading-7 text-[var(--color-muted)] mt-2">
                    {person.department}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Core Team Section */}
      <div className="bg-gray-50/50 py-12 sm:py-16 border-t border-black/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:mx-0">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-ink)] sm:text-4xl">
              Core Team
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
              The developers and engineers building the platform.
            </p>
          </div>
          <ul
            role="list"
            className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-2"
          >
            {coreTeam.map((person) => (
              <li key={person.name} className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {person.image ? (
                  <Image
                    className="aspect-[1/1] w-32 flex-none rounded-2xl object-cover shadow-lg"
                    src={person.image}
                    alt={person.name}
                    width={128}
                    height={128}
                  />
                ) : (
                  <div className="flex h-32 w-32 flex-none items-center justify-center rounded-2xl bg-white shadow-sm border border-black/5 text-[var(--color-muted)]">
                    <User className="h-12 w-12 opacity-50" />
                  </div>
                )}
                <div className="text-center sm:text-left pt-2">
                  <h3 className="text-lg font-semibold leading-8 tracking-tight text-[var(--color-ink)]">
                    {person.name}
                  </h3>
                  <p className="text-sm font-medium uppercase tracking-widest text-[var(--color-accent)] mt-1">
                    {person.role}
                  </p>
                  <p className="text-sm leading-7 text-[var(--color-muted)] mt-2">
                    {person.department}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
