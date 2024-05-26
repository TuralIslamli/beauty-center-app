import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { IUser, IUserFields, IUserRS } from "../../types";
import { Button } from "primereact/button";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Message } from "primereact/message";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { roles } from "../consts";
import api from "@/app/api";

interface IEditUserProps {
  user?: IUser;
  setUsers: Dispatch<SetStateAction<IUser[]>>;
  showSuccess: (message: string) => void;
  userEditDialog: boolean;
  setUserEditDialog: (state: boolean) => void;
}

function EditUserDialog({
  user,
  userEditDialog,
  setUserEditDialog,
  setUsers,
  showSuccess,
}: IEditUserProps) {
  const schema = yup.object().shape({
    name: yup.string().required(),
    surname: yup.string().required(),
    email: yup.string().email("Invalid email").required(),
    roleId: yup.number().required(),
    password: user?.id ? yup.string() : yup.string().required(),
    password_repeat: yup
      .string()
      .oneOf([yup.ref("password")], "Passwords must match"),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<IUserFields>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: undefined,
      surname: undefined,
      email: undefined,
      roleId: undefined,
      password: user?.id ? undefined : "",
      password_repeat: user?.id ? undefined : "",
    },
  });

  const [selectedRole, setSelectedRole] = useState<
    | {
        id: number;
        name: string;
      }
    | undefined
  >(undefined);

  const onHide = () => {
    setUserEditDialog(false);
    reset();
    setSelectedRole(undefined);
  };

  const onSubmit: SubmitHandler<IUserFields> = async (payload: IUserFields) => {
    try {
      const { data }: IUserRS = user?.id
        ? await api.updateUser({
            ...payload,
            id: user.id,
          })
        : await api.createUser(payload);
      setUsers((prev) => [data, ...prev]);
      showSuccess(
        `User has been successfully ${user?.id ? "created" : "updated"}`
      );
      setUserEditDialog(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setValue("name", user.name);
      setValue("surname", user.surname);
      setValue("email", user.email);
      setValue("roleId", user.role?.id);
      const userRole = roles.find((role) => role.id === user.role?.id);
      setSelectedRole(userRole);
    }
  }, [user, setValue]);

  return (
    <Dialog
      visible={userEditDialog}
      style={{ width: "328px" }}
      header="User details"
      modal
      onHide={onHide}
    >
      {user && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <label style={{ marginBottom: "5px" }} htmlFor="name">
            Name:
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                style={{ marginBottom: "10px" }}
                id="name"
                invalid={!!errors.name}
                {...field}
              />
            )}
          />
          <label style={{ marginBottom: "5px" }} htmlFor="surname">
            Surname:
          </label>
          <Controller
            name="surname"
            control={control}
            render={({ field }) => (
              <InputText
                style={{ marginBottom: "10px" }}
                id="surname"
                invalid={!!errors.surname}
                {...field}
              />
            )}
          />

          <label style={{ marginBottom: "5px" }} htmlFor="email">
            Email:
          </label>
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputText
                style={{ marginBottom: "10px" }}
                id="email"
                invalid={!!errors.email}
                {...field}
              />
            )}
          />
          <label style={{ marginBottom: "5px" }} htmlFor="email">
            Role:
          </label>
          <Controller
            name="roleId"
            control={control}
            render={({ field }) => (
              <Dropdown
                style={{ marginBottom: "10px" }}
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.value);
                  setValue("roleId", e.value.id);
                }}
                options={roles}
                optionLabel="name"
                placeholder="Select a role"
                className="w-full md:w-14rem"
                invalid={!!errors.roleId}
                // {...field}
              />
            )}
          />
          <label style={{ marginBottom: "5px" }} htmlFor="password">
            Password:
          </label>
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Password
                style={{ marginBottom: "10px", width: "200px" }}
                id="password"
                toggleMask
                feedback={false}
                invalid={!!errors.password}
                {...field}
              />
            )}
          />
          <label style={{ marginBottom: "5px" }} htmlFor="password_repeat">
            Confirm password:
          </label>
          <Controller
            name="password_repeat"
            control={control}
            render={({ field }) => (
              <Password
                style={{ marginBottom: "10px", width: "200px" }}
                toggleMask
                feedback={false}
                id="password_repeat"
                invalid={!!errors.password_repeat}
                {...field}
              />
            )}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {errors.password_repeat && (
                <Message
                  style={{ maxWidth: "180px", height: "45px" }}
                  severity="error"
                  text="Passwords must match"
                />
              )}
            </div>
            <Button label="Save" type="submit" style={{ display: "flex" }} />
          </div>
        </form>
      )}
    </Dialog>
  );
}

export default EditUserDialog;
