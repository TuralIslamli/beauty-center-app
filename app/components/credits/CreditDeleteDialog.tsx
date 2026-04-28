import React from 'react';

import { ConfirmDialog } from '../shared';
import { ICredit } from './types';

interface CreditDeleteDialogProps {
  credit?: ICredit;
  visible: boolean;
  onHide: () => void;
  onConfirm: () => void;
}

const CreditDeleteDialog: React.FC<CreditDeleteDialogProps> = ({
  credit,
  visible,
  onHide,
  onConfirm,
}) => (
  <ConfirmDialog
    visible={visible}
    onHide={onHide}
    onConfirm={onConfirm}
    header="Silmə təsdiqi"
    message={`"${credit?.client_name}" kreditini silmək istədiyinizə əminsiniz?`}
  />
);

export default CreditDeleteDialog;
