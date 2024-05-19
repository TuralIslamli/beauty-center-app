"use client";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import api from "../api";
import { ILoginFields } from "../types";

function login() {
  const [errorMessage, setErrorMessage] = useState("");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ILoginFields>();
  const router = useRouter();

  const onSubmit: SubmitHandler<ILoginFields> = async (
    payload: ILoginFields
  ) => {
    setErrorMessage("");

    try {
      const { data }: any = await api.postLogin(payload);
      localStorage.setItem("token", data.token.access_token);
      localStorage.setItem("userData", JSON.stringify(data.user));
      router.push("/");
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.response?.data?.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/");
    }
  }, []);

  return (
    <main className={styles.main}>
      <form className={styles.inputs} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.input}>
          <label htmlFor="email">Email</label>
          <Controller
            name="email"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText
                invalid={!!errors.email}
                aria-describedby="email-help"
                {...field}
              />
            )}
          />
        </div>
        <div className={styles.input}>
          <label htmlFor="password">Password</label>
          <Controller
            name="password"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <Password
                toggleMask
                feedback={false}
                invalid={!!errors.password}
                {...field}
              />
            )}
          />
        </div>
        <Button label="Login" type="submit" />
      </form>
      {errors.password && errors.email && (
        <Message severity="error" text="Username and password is required" />
      )}
      {errorMessage && <Message severity="error" text={errorMessage} />}
    </main>
  );
}

export default login;
