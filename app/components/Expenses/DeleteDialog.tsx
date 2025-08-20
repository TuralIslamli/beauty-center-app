import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { Dispatch, SetStateAction } from 'react';
import { IBookingTime, IExpense } from '../../types';
import api from '@/app/api';

interface IDeleteServiceTypeProps {
  showSuccess: (message: string) => void;
  expense?: IExpense;
  deleteDialog: boolean;
  setDeleteDialog: (state: boolean) => void;
  setExpenses: Dispatch<SetStateAction<IExpense[]>>;
}

function DeleteServiceTypeDialog({
  expense,
  deleteDialog,
  setDeleteDialog,
  setExpenses,
  showSuccess,
}: IDeleteServiceTypeProps) {
  const deleteServiceType = () => {
    setExpenses((prev) =>
      prev.filter((item) => item.id !== expense?.id)
    );
    try {
      api.deleteExpense(expense?.id);
      setDeleteDialog(false);
      showSuccess('Silindi');
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
        {expense && (
          <span>
            Are you sure you want to delete <b>{expense?.name}</b>?
          </span>
        )}
      </div>
    </Dialog>
  );
}

export default DeleteServiceTypeDialog;
