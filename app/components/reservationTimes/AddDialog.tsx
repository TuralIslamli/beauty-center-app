import React, { Dispatch, SetStateAction, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputMask } from 'primereact/inputmask';
import { Button } from 'primereact/button';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';

import api from '../../api';
import { IBookingTimeFields, IBookingTime, IBookingTimeData } from '@/app/types';
import { FormField } from '../shared';

interface AddDialogProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  setBookingTimes: Dispatch<SetStateAction<IBookingTime[]>>;
}

const AddDialog: React.FC<AddDialogProps> = ({
  visible,
  onHide,
  onSuccess,
  setBookingTimes,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<IBookingTimeFields>();

  const handleFormHide = useCallback(() => {
    onHide();
    reset();
  }, [onHide, reset]);

  const onSubmit: SubmitHandler<IBookingTimeFields> = useCallback(async ({
    time,
    reservation_count = 0,
  }) => {
    try {
      const { data }: IBookingTimeData = await api.createBookingTime({
        reservation_count,
        time,
      });
      setBookingTimes((prev) => [...prev, data as unknown as IBookingTime]);
      onSuccess('Rezervasiya saatı uğurla yaradıldı');
      handleFormHide();
    } catch (error) {
      console.error('Failed to create booking time:', error);
    }
  }, [setBookingTimes, onSuccess, handleFormHide]);

  return (
    <Dialog
      visible={visible}
      style={{ width: '25rem' }}
      header="Rezerv saatı"
      modal
      onHide={handleFormHide}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="dialog-form">
        <FormField label="Saat:" htmlFor="time">
          <Controller
            name="time"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <InputMask
                id="time"
                mask="99:99"
                invalid={!!errors.time}
                {...field}
              />
            )}
          />
        </FormField>

        <FormField label="Limit:" htmlFor="reservation_count">
          <Controller
            name="reservation_count"
            control={control}
            render={({ field }) => (
              <InputNumber
                onBlur={field.onBlur}
                ref={field.ref}
                value={field?.value || 0}
                onValueChange={(e) => field.onChange(e)}
                invalid={!!errors.reservation_count}
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
