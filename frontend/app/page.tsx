import {
  BookOpen,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Target,
  TrendingUp,
} from "lucide-react";

const stats = [
  {
    title: "Topics Completed",
    value: "0",
    icon: CheckCircle2,
    description: "Start learning to see progress",
  },
  {
    title: "Study Hours",
    value: "0h",
    icon: Clock3,
    description: "Your total learning time",
  },
  {
    title: "Tests Completed",
    value: "0",
    icon: ClipboardCheck,
    description: "No tests completed yet",
  },
  {
    title: "Current Streak",
    value: "0 days",
    icon: TrendingUp,
    description: "Start your learning streak",
  },
];

const quickActions = [
  {
    title: "Upload Syllabus",
    description: "Let AI analyze your syllabus",
    icon: BookOpen,
    href: "/syllabus",
  },
  {
    title: "Study Plan",
    description: "Create your personalized plan",
    icon: CalendarDays,
    href: "/study-plan",
  },
  {
    title: "Start Learning",
    description: "Continue your learning journey",
    icon: Brain,
    href: "/learning",
  },
  {
    title: "Take a Test",
    description: "Test your knowledge",
    icon: ClipboardCheck,
    href: "/tests",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#07070a] text-white">
      {/* Background Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative p-6 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-violet-400">
            Welcome back 👋
          </p>

          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your Learning Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 md:text-base">
            Manage your syllabus, follow your study plan, learn smarter, and
            track your progress with Learnova AI.
          </p>
        </header>

        {/* Progress Overview */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Your Progress</h2>
              <p className="text-sm text-zinc-500">
                Keep building your learning journey
              </p>
            </div>

            <Target className="text-violet-400" size={22} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:border-violet-500/30 hover:bg-white/[0.06]"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div className="rounded-xl bg-violet-500/10 p-3">
                      <Icon size={20} className="text-violet-400" />
                    </div>
                  </div>

                  <p className="text-sm text-zinc-400">{stat.title}</p>

                  <h3 className="mt-1 text-2xl font-bold">{stat.value}</h3>

                  <p className="mt-2 text-xs text-zinc-500">
                    {stat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <p className="text-sm text-zinc-500">
              Choose what you want to do next
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <a
                  key={action.title}
                  href={action.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-500/40 hover:bg-white/[0.07]"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
                    <Icon
                      size={21}
                      className="text-violet-400 transition group-hover:scale-110"
                    />
                  </div>

                  <h3 className="font-semibold">{action.title}</h3>

                  <p className="mt-2 text-sm leading-5 text-zinc-500">
                    {action.description}
                  </p>

                  <div className="mt-4 text-sm font-medium text-violet-400">
                    Open →
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* Getting Started */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/[0.10] to-blue-500/[0.05] p-6 backdrop-blur-xl md:p-8">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
              <Brain className="text-violet-400" size={24} />
            </div>

            <h2 className="text-2xl font-bold">
              Start with your syllabus
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400 md:text-base">
              Upload your syllabus and let Learnova AI understand your
              subjects, units, and topics. We&apos;ll use that information to
              build your personalized learning journey.
            </p>

            <a
              href="/syllabus"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              <BookOpen size={18} />
              Upload Syllabus
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}