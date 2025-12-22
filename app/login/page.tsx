'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import api from '../api';
import { ILoginFields } from '../types';
import { FormField } from '../components/shared';

const STORAGE_KEYS = {
  TOKEN: 'token',
} as const;

const LoginPage: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ILoginFields>();
  
  const router = useRouter();

  const onSubmit: SubmitHandler<ILoginFields> = useCallback(async (payload) => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { data }: { data: { token: { access_token: string } } } = await api.postLogin(payload);
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token.access_token);
      router.push('/');
    } catch (error: unknown) {
      console.error('Login failed:', error);
      const err = error as { response?: { data?: { message?: string } } };
      setErrorMessage(err?.response?.data?.message || 'Giriş uğursuz oldu');
    } finally {
      setIsSubmitting(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      router.push('/');
    }
  }, [router]);

  const hasValidationErrors = errors.password && errors.email;

  return (
    <main className="login-main">
      <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Email" htmlFor="email">
          <Controller
            name="email"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                id="email"
                invalid={!!errors.email}
                aria-describedby="email-help"
                {...field}
              />
            )}
          />
        </FormField>

        <FormField label="Şifrə" htmlFor="password">
          <Controller
            name="password"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Password
                id="password"
                toggleMask
                feedback={false}
                invalid={!!errors.password}
                {...field}
              />
            )}
          />
        </FormField>

        <Button
          label="Giriş"
          type="submit"
          disabled={isSubmitting}
          loading={isSubmitting}
          className="w-full"
        />
      </form>

      {hasValidationErrors && (
        <Message severity="error" text="Email və şifrə tələb olunur" className="mt-4" />
      )}
      
      {errorMessage && (
        <Message severity="error" text={errorMessage} className="mt-4" />
      )}
    </main>
  );
};

export default LoginPage;
