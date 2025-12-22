import React, { Dispatch, SetStateAction, useCallback } from 'react';

import api from '../../api';
import { IServiceType } from '@/app/types';
import { ConfirmDialog } from '../shared';

interface DeleteDialogProps {
  serviceType?: IServiceType;
  visible: boolean;
  onHide: () => void;
  setServiceTypes: Dispatch<SetStateAction<IServiceType[]>>;
  onSuccess: (message: string) => void;
}

const DeleteServiceTypeDialog: React.FC<DeleteDialogProps> = ({
  serviceType,
  visible,
  onHide,
  setServiceTypes,
  onSuccess,
}) => {
  const handleDelete = useCallback(async () => {
    if (!serviceType?.id) return;

    try {
      await api.deleteServiceType(serviceType.id);
      setServiceTypes((prev) => prev.filter((item) => item.id !== serviceType.id));
      onSuccess('Xidmət növü uğurla silindi');
      onHide();
    } catch (error) {
      console.error('Failed to delete service type:', error);
    }
  }, [serviceType?.id, setServiceTypes, onSuccess, onHide]);

  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      onConfirm={handleDelete}
      header="Silmə təsdiqi"
      message={`"${serviceType?.name}" xidmət növünü silmək istədiyinizə əminsiniz?`}
    />
  );
};

export default DeleteServiceTypeDialog;
