import { useState } from 'react';
import { KeyRound, ShieldAlert, UserRoundCog } from 'lucide-react';
import { useChangePassword, useCurrentUser, useDeleteAccount, useUpdateProfile } from '@/hooks';
import { Button, Card, Input, Modal, PageHeader } from '@/components/ui';

export default function Settings() {
  const { data: user } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  const [profileOpen, setProfileOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const openProfileEditor = () => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setUserName(user.userName);
    setEmail(user.email);
    setCurrentPassword('');
    setProfileOpen(true);
  };

  const saveProfile = () => {
    if (!currentPassword.trim()) {
      return;
    }
    updateProfile.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userName: userName.trim(),
      email: email.trim(),
      currentPassword: currentPassword,
    }, {
      onSuccess: () => {
        setProfileOpen(false);
        setCurrentPassword('');
      },
    });
  };

  const updatePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError('Use at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    changePassword.mutate({ currentPassword, newPassword }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
      },
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account controls"
        title="Settings"
        description="Manage your profile, authentication, notification preferences, and account safety."
      />

      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserRoundCog className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-950">Profile information</h2>
                <p className="mt-1 text-sm text-slate-500">Update your personal details and account identity.</p>
              </div>
            </div>
            <Button variant="outline" onClick={openProfileEditor}>Edit profile</Button>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-950">Change password</h2>
                <p className="mt-1 text-sm text-slate-500">Use at least 8 characters.</p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <Input label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              <Input label="New password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <Input label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              {passwordError ? <p role="alert" className="text-sm font-medium text-rose-600">{passwordError}</p> : null}
            </div>
            <Button className="mt-5 w-full" isLoading={changePassword.isPending} onClick={updatePassword}>Update password</Button>
          </Card>
        </div>

        <Card className="border-rose-200 bg-rose-50/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-rose-600" />
              <div>
                <h2 className="font-bold text-rose-900">Delete account</h2>
                <p className="mt-1 text-sm leading-6 text-rose-700">Permanently remove your account and associated nutrition history.</p>
              </div>
            </div>
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete account</Button>
          </div>
        </Card>
      </div>

      <Modal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Edit profile"
        description="Confirm your current password before saving account changes."
        footer={
          <>
            <Button variant="ghost" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button isLoading={updateProfile.isPending} onClick={saveProfile} disabled={!currentPassword.trim()}>Save changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          <Input label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          <Input label="Username" value={userName} onChange={(event) => setUserName(event.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input label="Current password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete your account?"
        description="This action cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="danger" isLoading={deleteAccount.isPending} onClick={() => deleteAccount.mutate()}>Delete permanently</Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">Your profile, nutrition history, and all associated data will be permanently removed from SnapFood.</p>
      </Modal>
    </div>
  );
}
