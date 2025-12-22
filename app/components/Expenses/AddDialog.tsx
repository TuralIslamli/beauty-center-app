import React, { useEffect, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import api from '../../api';
import { IExpenseFields, IExpense } from '@/app/types';
import { FormField } from '../shared';

interface AddDialogProps {
  expense?: IExpense;
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  getExpenses: (page: number) => Promise<void>;
}

const AddDialog: React.FC<AddDialogProps> = ({
  expense,
  visible,
  onHide,
  onSuccess,
  getExpenses,
}) => {
  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IExpenseFields>();

  const handleFormHide = useCallback(() => {
    onHide();
    reset();
  }, [onHide, reset]);

  const onSubmit: SubmitHandler<IExpenseFields> = useCallback(async ({
    name,
    amount = 0,
    description,
  }) => {
    try {
      expense?.id
        ? await api.updateExpense({ name, amount, description, id: expense.id })
        : await api.createExpense({ name, amount, description });

      getExpenses(1);
      onSuccess(`Xərc ${expense?.id ? 'yeniləndi' : 'əlavə olundu'}`);
      handleFormHide();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  }, [expense?.id, getExpenses, onSuccess, handleFormHide]);

  useEffect(() => {
    if (expense?.id) {
      setValue('name', expense.name);
      setValue('amount', expense.amount);
      setValue('description', expense.description);
    }
  }, [expense, setValue]);

  return (
    <Dialog
      visible={visible}
      style={{ width: '25rem' }}
      header="Xərc"
      modal
      onHide={handleFormHide}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="dialog-form">
        <FormField label="Ad:" htmlFor="name">
          <Controller
            name="name"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText id="name" invalid={!!errors?.name} {...field} />
            )}
          />
        </FormField>

        <FormField label="İzah:" htmlFor="description">
          <Controller
            name="description"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputText id="description" invalid={!!errors?.description} {...field} />
            )}
          />
        </FormField>

        <FormField label="Qiymət:" htmlFor="amount">
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                onBlur={field.onBlur}
                ref={field.ref}
                value={field?.value || 0}
                onValueChange={(e) => field.onChange(e)}
                mode="currency"
                currency="AZN"
                locale="de-DE"
                invalid={!!errors.amount}
              />
            )}
          />
        </FormField>

        <div className="dialog-footer">
          <Button label="Saxla" type="submit" />
        </div>
      </form>
    </Dialog>
  );
};

export default AddDialog;
