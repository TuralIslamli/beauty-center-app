import React, { Dispatch, SetStateAction, useCallback } from 'react';

import api from '@/app/api';
import { IExpense } from '../../types';
import { ConfirmDialog } from '../shared';

interface DeleteDialogProps {
  expense?: IExpense;
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  setExpenses: Dispatch<SetStateAction<IExpense[]>>;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  expense,
  visible,
  onHide,
  setExpenses,
  onSuccess,
}) => {
  const handleDelete = useCallback(async () => {
    if (!expense?.id) return;

    try {
      await api.deleteExpense(expense.id);
      setExpenses((prev) => prev.filter((item) => item.id !== expense.id));
      onHide();
      onSuccess('Xərc uğurla silindi');
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  }, [expense?.id, setExpenses, onHide, onSuccess]);

  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      onConfirm={handleDelete}
      header="Silmə təsdiqi"
      message={`"${expense?.name}" xərcini silmək istədiyinizə əminsiniz?`}
    />
  );
};

export default DeleteDialog;
