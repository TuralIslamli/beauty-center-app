import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import api from '../../api';
import {
  IBookingTimeFields,
  IBookingTime,
  IBookingTimeData,
} from '@/app/types';
import { Dispatch, SetStateAction } from 'react';
import { InputMask } from 'primereact/inputmask';

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
  showSuccess: (message: string) => void;
  setBookingTimes: Dispatch<SetStateAction<IBookingTime[]>>;
}

function AddDialog({
  dialog,
  setDialog,
  showSuccess,
  setBookingTimes,
}: IDialogProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IBookingTimeFields>();

  const onSubmit: SubmitHandler<IBookingTimeFields> = async ({
    time,
    reservation_count,
  }: IBookingTimeFields) => {
    try {
      reservation_count = reservation_count || 0;
      const { data }: IBookingTimeData = await api.createBookingTime({
        reservation_count,
        time,
      });
      setBookingTimes((prev: any) => {
        return [...prev, data];
      });
      showSuccess('Rezervasiya saatı uğurla yaradıldı');
      setDialog(false);
      reset();
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <Dialog
      visible={dialog}
      style={{ width: '25rem' }}
      header="Rezerv saatı"
      modal
      onHide={() => setDialog(false)}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <label style={{ marginBottom: '5px' }} htmlFor="name">
          Saat:
        </label>
        <Controller
          name="time"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <InputMask
              style={{ marginBottom: '10px' }}
              id="time"
              mask="99:99"
              invalid={!!errors.time}
              {...field}
            />
          )}
        />
        <label style={{ marginBottom: '5px' }} htmlFor="surname">
          Limit:
        </label>
        <Controller
          name="reservation_count"
          control={control}
          render={({ field }) => (
            <InputNumber
              onBlur={field.onBlur}
              ref={field.ref}
              value={field?.value || 0}
              onValueChange={(e) => field.onChange(e)}
              style={{ marginBottom: '10px' }}
              invalid={!!errors.reservation_count}
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
