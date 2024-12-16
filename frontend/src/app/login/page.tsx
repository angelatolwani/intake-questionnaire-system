'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { useEffect } from 'react';

interface LoginForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { login, error: loginError, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.is_admin) {
        router.push('/admin');
      } else {
        router.push('/questionnaires');
      }
    }
  }, [user, router]);

  const onSubmit = async (data: LoginForm) => {
    await login(data.username, data.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="card max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="label">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="input"
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && (
                <p className="error">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && (
                <p className="error">{errors.password.message}</p>
              )}
            </div>
          </div>

          {loginError && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="error">{loginError}</p>
            </div>
          )}

          <div>
            <button type="submit" className="btn btn-primary w-full">
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
