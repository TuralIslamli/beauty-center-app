import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface ConfirmDialogProps {
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
  header: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmSeverity?: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'secondary' | 'contrast';
}

/**
 * Общий компонент диалога подтверждения
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onHide,
  onConfirm,
  header,
  message,
  confirmLabel = 'Bəli',
  cancelLabel = 'Xeyr',
  confirmSeverity = 'danger',
}) => {
  const footer = (
    <div className="dialog-footer">
      <Button
        label={cancelLabel}
        icon="pi pi-times"
        outlined
        onClick={onHide}
      />
      <Button
        label={confirmLabel}
        icon="pi pi-check"
        severity={confirmSeverity}
        onClick={onConfirm}
      />
    </div>
  );

  return (
    <Dialog
      visible={visible}
      style={{ width: '32rem' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      header={header}
      modal
      footer={footer}
      onHide={onHide}
    >
      <div className="confirmation-content">
        <i className="pi pi-exclamation-triangle confirmation-icon" />
        <span>{message}</span>
      </div>
    </Dialog>
  );
};

export default ConfirmDialog;

