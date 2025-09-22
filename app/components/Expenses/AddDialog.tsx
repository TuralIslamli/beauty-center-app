import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import api from '../../api';
import { IExpenseFields, IServiceTypeRS, IExpense } from '@/app/types';
import { Dispatch, SetStateAction, useEffect } from 'react';

interface IDialogProps {
  getExpenses: (page: number) => Promise<void>;
  expense?: IExpense;
  dialog: boolean;
  setDialog: (state: boolean) => void;
  showSuccess: (message: string) => void;
}

function AddDialog({
  expense,
  dialog,
  setDialog,
  showSuccess,
  getExpenses,
}: IDialogProps) {
  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IExpenseFields>();

  const onSubmit: SubmitHandler<IExpenseFields> = async ({
    name,
    amount,
    description,
  }: IExpenseFields) => {
    amount = amount || 0;

    try {
      const { data }: IServiceTypeRS = expense?.id
        ? await api.updateExpense({
            name,
            amount,
            description,
            id: expense.id,
          })
        : await api.createExpense({
            name,
            amount,
            description,
          });
      getExpenses(1);
      showSuccess(`Xərc ${expense?.id ? 'yeniləndi' : 'əlavə olundu'}`);
      setDialog(false);
      reset();
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (expense?.id) {
      setValue('name', expense.name);
      setValue('amount', expense.amount);
      setValue('description', expense.description);
    }
  }, [expense, setValue]);

  const onHide = () => {
    setDialog(false);
    reset();
  };
  return (
    <Dialog
      visible={dialog}
      style={{ width: '25rem' }}
      header="Xərc"
      modal
      onHide={onHide}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <label style={{ marginBottom: '5px' }} htmlFor="name">
          Ad:
        </label>
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputText
              style={{ marginBottom: '10px' }}
              id="name"
              invalid={!!errors?.name}
              {...field}
            />
          )}
        />
        <label style={{ marginBottom: '5px' }} htmlFor="name">
          İzah:
        </label>
        <Controller
          name="description"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputText
              style={{ marginBottom: '10px' }}
              id="description"
              invalid={!!errors?.description}
              {...field}
            />
          )}
        />
        <label style={{ marginBottom: '5px' }} htmlFor="surname">
          Qiymət:
        </label>
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
              style={{ marginBottom: '10px' }}
              invalid={!!errors.amount}
            />
          )}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button label="Save" type="submit" />
        </div>
      </form>
    </Dialog>
  );
}

export default AddDialog;
