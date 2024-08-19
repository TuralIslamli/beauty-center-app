import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { Dispatch, SetStateAction } from 'react';
import { IBookingTime } from '../../types';
import api from '@/app/api';

interface IDeleteServiceTypeProps {
  showSuccess: (message: string) => void;
  bookingTime?: IBookingTime;
  deleteDialog: boolean;
  setDeleteDialog: (state: boolean) => void;
  setBookingTimes: Dispatch<SetStateAction<IBookingTime[]>>;
}

function DeleteServiceTypeDialog({
  bookingTime,
  deleteDialog,
  setDeleteDialog,
  setBookingTimes,
  showSuccess,
}: IDeleteServiceTypeProps) {
  const deleteServiceType = () => {
    setBookingTimes((prev) =>
      prev.filter((item) => item.id !== bookingTime?.id)
    );
    try {
      api.deleteBookingTime(bookingTime?.id);
      setDeleteDialog(false);
      showSuccess('Rezerv saatı silindi');
    } catch (error) {
      console.error(error);
    }
  };

  const deleteProductDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        outlined
        onClick={() => setDeleteDialog(false)}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        severity="danger"
        onClick={deleteServiceType}
      />
    </React.Fragment>
  );

  return (
    <Dialog
      visible={deleteDialog}
      style={{ width: '32rem' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      header="Confirm"
      modal
      footer={deleteProductDialogFooter}
      onHide={() => setDeleteDialog(false)}
    >
      <div className="confirmation-content">
        <i
          className="pi pi-exclamation-triangle"
          style={{ fontSize: '2rem', marginRight: '10px' }}
        />
        {bookingTime && (
          <span>
            Are you sure you want to delete <b>{bookingTime?.time}</b>?
          </span>
        )}
      </div>
    </Dialog>
  );
}

export default DeleteServiceTypeDialog;
