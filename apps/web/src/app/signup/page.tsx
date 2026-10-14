import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';
import { signupAction } from '../actions';

export const metadata: Metadata = { title: 'Create account' };

export default function SignupPage() {
  return (
    <div className="px-4">
      <AuthForm mode="signup" action={signupAction} />
    </div>
  );
}
