import React, { Dispatch, SetStateAction, useEffect, useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Password } from 'primereact/password';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import api from '@/app/api';
import { IUser, IUserFields, IUserRS } from '../../types';
import { roles, daysOfWeek } from '../consts';
import { FormField } from '../shared';

interface EditUserDialogProps {
  user?: IUser;
  setUsers: Dispatch<SetStateAction<IUser[]>>;
  onSuccess: (message: string) => void;
  visible: boolean;
  onHide: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  visible,
  onHide,
  setUsers,
  onSuccess,
}) => {
  const [selectedRole, setSelectedRole] = useState<{ id: number; name: string }>();
  const [selectedDayOff, setSelectedDayOff] = useState<{ id: number; name: string }>();

  const schema = yup.object().shape({
    name: yup.string().required(),
    surname: yup.string().required(),
    email: yup.string().email('Yanlış email').required(),
    roleId: yup.number().required(),
    password: user?.id ? yup.string() : yup.string().required(),
    password_repeat: yup.string().oneOf([yup.ref('password')], 'Şifrələr eyni olmalıdır'),
    customer_visible: yup.boolean(),
    day_off: yup.number(),
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
      password: user?.id ? undefined : '',
      password_repeat: user?.id ? undefined : '',
      customer_visible: false,
      day_off: undefined,
    },
  });

  const handleFormHide = useCallback(() => {
    onHide();
    reset();
    setSelectedRole(undefined);
    setSelectedDayOff(undefined);
  }, [onHide, reset]);

  const onSubmit: SubmitHandler<IUserFields> = useCallback(async (payload) => {
    try {
      const { data }: IUserRS = user?.id
        ? await api.updateUser({ ...payload, id: user.id })
        : await api.createUser(payload);

      setUsers((prev) => {
        if (user?.id) {
          return prev.map((u) => (u.id === data.id ? data : u));
        }
        return [data, ...prev];
      });

      onSuccess(`İstifadəçi uğurla ${user?.id ? 'yeniləndi' : 'yaradıldı'}`);
      handleFormHide();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }, [user?.id, setUsers, onSuccess, handleFormHide]);

  useEffect(() => {
    if (user?.id) {
      setValue('name', user.name);
      setValue('surname', user.surname);
      setValue('email', user.email);
      setValue('roleId', user.role?.id);
      setValue('customer_visible', user.customer_visible ?? false);
      setValue('day_off', user.day_off);
      setSelectedRole(roles.find((role) => role.id === user.role?.id));
      setSelectedDayOff(daysOfWeek.find((day) => day.id === user.day_off));
    }
  }, [user, setValue]);

  return (
    <Dialog
      visible={visible}
      style={{ width: '328px' }}
      header="İstifadəçi məlumatları"
      modal
      onHide={handleFormHide}
    >
      {user && (
        <form onSubmit={handleSubmit(onSubmit)} className="dialog-form">
          <FormField label="Ad:" htmlFor="name">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <InputText id="name" invalid={!!errors.name} {...field} />
              )}
            />
          </FormField>

          <FormField label="Soyad:" htmlFor="surname">
            <Controller
              name="surname"
              control={control}
              render={({ field }) => (
                <InputText id="surname" invalid={!!errors.surname} {...field} />
              )}
            />
          </FormField>

          <FormField label="Email:" htmlFor="email">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputText id="email" invalid={!!errors.email} {...field} />
              )}
            />
          </FormField>

          <FormField label="Rol:" htmlFor="roleId">
            <Controller
              name="roleId"
              control={control}
              render={() => (
                <Dropdown
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.value);
                    setValue('roleId', e.value.id);
                  }}
                  options={roles}
                  optionLabel="name"
                  placeholder="Rol seçin"
                  className="w-full"
                  invalid={!!errors.roleId}
                />
              )}
            />
          </FormField>

          <FormField label="Göstərilmə" htmlFor="customer_visible" inline>
            <Controller
              name="customer_visible"
              control={control}
              render={({ field }) => (
                <Checkbox
                  inputId="customer_visible"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.checked)}
                />
              )}
            />
          </FormField>

          <FormField label="İstirahət günü:" htmlFor="day_off">
            <Controller
              name="day_off"
              control={control}
              render={() => (
                <Dropdown
                  value={selectedDayOff}
                  onChange={(e) => {
                    setSelectedDayOff(e.value);
                    setValue('day_off', e.value?.id);
                  }}
                  options={daysOfWeek}
                  optionLabel="name"
                  placeholder="İstirahət günü seçin"
                  className="w-full"
                  showClear
                />
              )}
            />
          </FormField>

          <FormField label="Şifrə:" htmlFor="password">
            <Controller
              name="password"
              control={control}
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

          <FormField label="Şifrənin təsdiqi:" htmlFor="password_repeat">
            <Controller
              name="password_repeat"
              control={control}
              render={({ field }) => (
                <Password
                  id="password_repeat"
                  toggleMask
                  feedback={false}
                  invalid={!!errors.password_repeat}
                  {...field}
                />
              )}
            />
          </FormField>

          <div className="dialog-footer-between">
            <div>
              {errors.password_repeat && (
                <Message
                  style={{ maxWidth: '180px', height: '45px' }}
                  severity="error"
                  text="Şifrələr eyni deyil"
                />
              )}
            </div>
            <Button label="Saxla" type="submit" />
          </div>
        </form>
      )}
    </Dialog>
  );
};

export default EditUserDialog;
