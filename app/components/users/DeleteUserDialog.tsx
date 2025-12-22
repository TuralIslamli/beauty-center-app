import React, { Dispatch, SetStateAction, useCallback } from 'react';

import api from '@/app/api';
import { IUser } from '../../types';
import { ConfirmDialog } from '../shared';

interface DeleteUserDialogProps {
  user?: IUser;
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  setUsers: Dispatch<SetStateAction<IUser[]>>;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  visible,
  onHide,
  user,
  onSuccess,
  setUsers,
}) => {
  const handleDelete = useCallback(async () => {
    if (!user?.id) return;

    try {
      await api.deleteUser(user.id);
      setUsers((prev) => prev.filter((item) => item.id !== user.id));
      onHide();
      onSuccess('İstifadəçi uğurla silindi');
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  }, [user?.id, setUsers, onHide, onSuccess]);

  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      onConfirm={handleDelete}
      header="Silmə təsdiqi"
      message={`"${user?.name} ${user?.surname}" istifadəçisini silmək istədiyinizə əminsiniz?`}
    />
  );
};

export default DeleteUserDialog;
