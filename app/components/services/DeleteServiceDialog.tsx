import React, { useCallback } from 'react';

import api from '@/app/api';
import { IService } from '@/app/types';
import { ConfirmDialog } from '../shared';

interface DeleteServiceDialogProps {
  service?: IService;
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  getServices: (page: number) => Promise<void>;
}

const DeleteServiceDialog: React.FC<DeleteServiceDialogProps> = ({
  visible,
  onHide,
  service,
  onSuccess,
  getServices,
}) => {
  const handleDelete = useCallback(async () => {
    if (!service?.id) return;

    try {
      await api.deleteService(service.id);
      onHide();
      getServices(1);
      onSuccess('Xidmət uğurla silindi');
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  }, [service?.id, onHide, getServices, onSuccess]);

  return (
    <ConfirmDialog
      visible={visible}
      onHide={onHide}
      onConfirm={handleDelete}
      header="Silmə təsdiqi"
      message={`"${service?.client_name}" xidmətini silmək istədiyinizə əminsiniz?`}
    />
  );
};

export default DeleteServiceDialog;
