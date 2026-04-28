import React from 'react';
import { Button } from 'primereact/button';

import { ICredit } from './types';

interface CreditTableActionsProps {
  credit: ICredit;
  editingCreditId: number | null;
  onEdit: (credit: ICredit) => void;
  onDelete: (credit: ICredit) => void;
}

const CreditTableActions: React.FC<CreditTableActionsProps> = ({
  credit,
  editingCreditId,
  onEdit,
  onDelete,
}) => (
  <>
    <Button
      icon="pi pi-pencil"
      rounded
      text
      severity="secondary"
      className="btn-icon-right"
      loading={editingCreditId === credit.id}
      disabled={editingCreditId !== null}
      onClick={() => onEdit(credit)}
    />
    <Button
      icon="pi pi-trash"
      rounded
      text
      severity="danger"
      onClick={() => onDelete(credit)}
    />
  </>
);

export default CreditTableActions;
