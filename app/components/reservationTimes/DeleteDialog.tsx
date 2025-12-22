import React, { Dispatch, SetStateAction, useCallback } from 'react';

import api from '@/app/api';
import { IBookingTime } from '../../types';
import { ConfirmDialog } from '../shared';

interface DeleteDialogProps {
  bookingTime?: IBookingTime;
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  setBookingTimes: Dispatch<SetStateAction<IBookingTime[]>>;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  bookingTime,
  visible,
  onHide,
  setBookingTimes,
  onSuccess,
}) => {
  const handleDelete = useCallback(async () => {
    if (!bookingTime?.id) return;

    try {
      await api.deleteBookingTime(bookingTime.id);
      setBookingTimes((prev) => prev.filter((item) => item.id !== bookingTime.id));
      onHide();
      onSuccess('Rezerv saatı uğurla silindi');
    } catch (error) {
      console.error('Failed to delete booking time:', error);
    }
  }, [bookingTime?.id, setBookingTimes, onHide, onSuccess]);

  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      onConfirm={handleDelete}
      header="Silmə təsdiqi"
      message={`"${bookingTime?.time}" saatını silmək istədiyinizə əminsiniz?`}
    />
  );
};

export default DeleteDialog;
