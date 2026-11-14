import { Activity, CalendarClock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useCurrentUser } from '@/hooks';
import { Badge, Card, PageHeader } from '@/components/ui';

function formatDate(value?: string): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleDateString();
}

export default function Profile() {
  const { data: user, isPending, error } = useCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account details"
        title="Profile"
        description="Review your personal identity, account status, and join information."
      />

      {isPending ? (
        <Card className="animate-pulse">
          <div className="h-6 w-48 rounded bg-slate-100" />
          <div className="mt-4 h-4 w-full rounded bg-slate-100" />
        </Card>
      ) : error || !user ? (
        <Card className="border-rose-200 bg-rose-50">
          <p className="text-sm font-semibold text-rose-700">Your profile could not be loaded.</p>
          <p className="mt-1 text-sm text-rose-600">Sign in again and try once more.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden p-0">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-8 text-white">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-extrabold">
                  {user.firstName?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-100">SnapFood account</p>
                  <h2 className="mt-1 text-2xl font-extrabold">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || user.email}
                  </h2>
                  <p className="mt-1 text-sm text-emerald-100">{user.email}</p>
                </div>
                <div className="sm:ml-auto">
                  <Badge tone={user.role === 'admin' ? 'warning' : 'success'}>
                    {user.role === 'admin' ? 'Administrator' : 'Member'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <ProfileDetail icon={UserRound} label="Username" value={user.userName || 'Not set'} />
              <ProfileDetail icon={Mail} label="Email address" value={user.email} />
              <ProfileDetail icon={ShieldCheck} label="Account role" value={user.role} />
              <ProfileDetail icon={Activity} label="Verification status" value={user.isVerified ? 'Verified' : 'Pending'} tone={user.isVerified ? 'success' : 'warning'} />
              <ProfileDetail icon={CalendarClock} label="Account created" value={formatDate(user.createdAt)} />
              <ProfileDetail icon={CalendarClock} label="Last updated" value={formatDate(user.updatedAt)} />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-slate-950">Account safety</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your account is protected by the authenticated SnapFood session. Use Settings to update your profile details or change your password.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

interface ProfileDetailProps {
  icon: typeof UserRound;
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}

function ProfileDetail({ icon: Icon, label, value, tone }: ProfileDetailProps) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icon className="h-4 w-4 text-emerald-600" />
        {label}
      </div>
      <p className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</p>
      {tone ? <p className={`mt-1 text-xs font-semibold ${tone === 'success' ? 'text-emerald-600' : 'text-amber-600'}`}>{value}</p> : null}
    </div>
  );
}
