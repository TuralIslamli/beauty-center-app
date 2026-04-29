import React, { useCallback } from 'react';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';

import { IServiceCreditBank } from '@/app/types';
import { FormField } from '../shared';

interface CreditBankSelectProps {
  banks: IServiceCreditBank[];
  selectedBank: IServiceCreditBank | null;
  editingBank: IServiceCreditBank | null;
  newBankName: string;
  isBankSaving: boolean;
  deletingBankId: number | null;
  canCreateBank: boolean;
  canUpdateBank: boolean;
  canDeleteBank: boolean;
  onBankChange: (bank: IServiceCreditBank | null) => void;
  onEditingBankChange: (bank: IServiceCreditBank) => void;
  onNewBankNameChange: (name: string) => void;
  onSaveBank: () => void;
  onDeleteBank: (bank: IServiceCreditBank) => void;
  onResetBankEditor: () => void;
}

const CreditBankSelect: React.FC<CreditBankSelectProps> = ({
  banks,
  selectedBank,
  editingBank,
  newBankName,
  isBankSaving,
  deletingBankId,
  canCreateBank,
  canUpdateBank,
  canDeleteBank,
  onBankChange,
  onEditingBankChange,
  onNewBankNameChange,
  onSaveBank,
  onDeleteBank,
  onResetBankEditor,
}) => {
  const itemTemplate = useCallback(
    (option: IServiceCreditBank) => (
      <div className="credit-bank-option">
        <span>{option.name}</span>
        {(canUpdateBank || canDeleteBank) && (
          <div className="flex gap-1">
            {canUpdateBank && (
              <Button
                type="button"
                icon="pi pi-pencil"
                rounded
                text
                severity="secondary"
                aria-label={`${option.name} yenilə`}
                disabled={isBankSaving || deletingBankId !== null}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onEditingBankChange(option);
                }}
              />
            )}
            {canDeleteBank && (
              <Button
                type="button"
                icon="pi pi-trash"
                rounded
                text
                severity="danger"
                aria-label={`${option.name} sil`}
                loading={deletingBankId === option.id}
                disabled={isBankSaving || deletingBankId !== null}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDeleteBank(option);
                }}
              />
            )}
          </div>
        )}
      </div>
    ),
    [
      canDeleteBank,
      canUpdateBank,
      deletingBankId,
      isBankSaving,
      onDeleteBank,
      onEditingBankChange,
    ],
  );

  const panelFooterTemplate = useCallback(
    () => {
      const canSaveBank = editingBank ? canUpdateBank : canCreateBank;

      if (!canSaveBank) {
        return null;
      }

      return (
        <div className="credit-bank-footer">
          <InputText
            value={newBankName}
            onChange={(event) => onNewBankNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSaveBank();
              }
            }}
            placeholder={editingBank ? 'Bank adını yenilə' : 'Yeni bank'}
          />
          {editingBank && (
            <Button
              type="button"
              icon="pi pi-times"
              severity="secondary"
              aria-label="Düzəlişi ləğv et"
              onClick={onResetBankEditor}
              disabled={isBankSaving}
            />
          )}
          <Button
            type="button"
            icon={editingBank ? 'pi pi-check' : 'pi pi-plus'}
            aria-label={editingBank ? 'Bankı yenilə' : 'Bank əlavə et'}
            onClick={onSaveBank}
            loading={isBankSaving}
            disabled={!newBankName.trim() || isBankSaving}
          />
        </div>
      );
    },
    [
      canCreateBank,
      canUpdateBank,
      editingBank,
      isBankSaving,
      newBankName,
      onNewBankNameChange,
      onResetBankEditor,
      onSaveBank,
    ],
  );

  return (
    <FormField label="Bank:" htmlFor="credit_bank">
      <Dropdown
        inputId="credit_bank"
        value={selectedBank}
        onChange={(event) => onBankChange(event.value)}
        options={banks}
        optionLabel="name"
        placeholder="Bank seçin"
        itemTemplate={itemTemplate}
        panelFooterTemplate={panelFooterTemplate}
      />
    </FormField>
  );
};

export default CreditBankSelect;
