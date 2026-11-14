import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Sparkles, Utensils, Camera, BrainCircuit } from 'lucide-react';

export interface AuthLayoutProps {
  children?: ReactNode;
}

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: 'Smart nutrition insights',
    body: 'Understand meals, calories, and health guidance with AI-powered clarity.',
  },
  {
    icon: Camera,
    title: 'Food recognition',
    body: 'Capture a meal and get structured nutrition analysis in seconds.',
  },
  {
    icon: BrainCircuit,
    title: 'NutriBot assistant',
    body: 'Ask about your food, habits, and health goals without leaving the app.',
  },
] as const;

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="w-full p-5 sm:p-8 lg:w-[52%] lg:p-12">
        <header className="mb-8 flex items-center gap-3 text-gray-900">
          <div className="rounded-xl bg-green-100 p-2 text-green-700">
            <Utensils className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">SnapFood</span>
        </header>

        <main className="flex min-h-[70vh] items-center">
          <div className="mx-auto w-full max-w-md">{children ?? <Outlet />}</div>
        </main>
      </div>

      <aside className="relative hidden flex-1 overflow-hidden border-l border-green-100 bg-white/60 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_55%)]" />
        <div className="relative flex max-w-lg flex-col justify-center px-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
            Healthy decisions made easier
          </p>
          <h2 className="text-4xl font-bold text-gray-900 leading-tight">
            Food tracking and wellness guidance for everyday life.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Monitor meals, understand nutrition, and stay on top of your health goals with AI support.
          </p>

          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-green-100 text-green-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-base font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
