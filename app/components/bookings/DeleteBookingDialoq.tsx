import React, { useCallback } from 'react';

import api from '@/app/api';
import { IBooking } from '@/app/types';
import { ConfirmDialog } from '../shared';

interface DeleteBookingDialogProps {
  booking?: IBooking;
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  getBookings: () => Promise<void>;
}

const DeleteBookingDialog: React.FC<DeleteBookingDialogProps> = ({
  visible,
  onHide,
  booking,
  onSuccess,
  getBookings,
}) => {
  const handleDelete = useCallback(async () => {
    if (!booking?.id) return;

    try {
      await api.deleteBooking(booking.id);
      onHide();
      getBookings();
      onSuccess('Rezerv uğurla silindi');
    } catch (error) {
      console.error('Failed to delete booking:', error);
    }
  }, [booking?.id, onHide, getBookings, onSuccess]);

  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      onConfirm={handleDelete}
      header="Silmə təsdiqi"
      message={`"${booking?.client_name}" rezervini silmək istədiyinizə əminsiniz?`}
    />
  );
};

export default DeleteBookingDialog;
