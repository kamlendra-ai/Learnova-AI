import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Brain,
  ClipboardCheck,
  BarChart3,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Syllabus",
    href: "/syllabus",
    icon: BookOpen,
  },
  {
    name: "Study Plan",
    href: "/study-plan",
    icon: CalendarDays,
  },
  {
    name: "Learning",
    href: "/learning",
    icon: Brain,
  },
  {
    name: "Tests",
    href: "/tests",
    icon: ClipboardCheck,
  },
  {
    name: "Progress",
    href: "/progress",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-[#0a0a0f]/90 p-5 backdrop-blur-xl">
      {/* Logo */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Learnova<span className="text-violet-400"> AI</span>
        </h1>

        <p className="mt-1 text-xs text-zinc-500">
          Your AI Learning Companion
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
            >
              <Icon size={19} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-500 transition hover:bg-white/10 hover:text-white"
      >
        <Settings size={19} />
        <span>Settings</span>
      </Link>
    </aside>
  );
}