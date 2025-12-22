import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';

import api from '../../api';
import { IServiceType, IServiceTypeFields } from '@/app/types';
import { FormField } from '../shared';

interface AddDialogProps {
  visible: boolean;
  onHide: () => void;
  onSuccess: (message: string) => void;
  setServiceTypes: Dispatch<SetStateAction<IServiceType[]>>;
}

const INITIAL_FORM_STATE: IServiceTypeFields = {
  name: '',
  price: 0,
  customer_visible: false,
};

const AddDialog: React.FC<AddDialogProps> = ({
  visible,
  onHide,
  onSuccess,
  setServiceTypes,
}) => {
  const [formData, setFormData] = useState<IServiceTypeFields>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const handleHide = useCallback(() => {
    resetForm();
    onHide();
  }, [resetForm, onHide]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      const { data }: { data: IServiceType } = await api.createServiceType(formData);
      setServiceTypes((prev) => [data, ...prev]);
      onSuccess('Xidmət növü uğurla yaradıldı');
      handleHide();
    } catch (error) {
      console.error('Failed to create service type:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, setServiceTypes, onSuccess, handleHide]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const handlePriceChange = useCallback((e: InputNumberValueChangeEvent) => {
    setFormData((prev) => ({ ...prev, price: e.value ?? 0 }));
  }, []);

  const handleVisibilityChange = useCallback((e: CheckboxChangeEvent) => {
    setFormData((prev) => ({ ...prev, customer_visible: e.checked ?? false }));
  }, []);

  return (
    <Dialog
      visible={visible}
      modal
      onHide={handleHide}
      header="Yeni xidmət növü"
      style={{ maxWidth: '400px', width: '100%' }}
    >
      <form onSubmit={handleSubmit} className="dialog-form">
        <FormField label="Ad:" htmlFor="name">
          <InputText
            id="name"
            value={formData.name}
            onChange={handleNameChange}
            required
          />
        </FormField>

        <FormField label="Qiymət:" htmlFor="price">
          <InputNumber
            id="price"
            value={formData.price}
            onValueChange={handlePriceChange}
            mode="currency"
            currency="AZN"
            locale="de-DE"
          />
        </FormField>

        <FormField label="Göstərilmə" htmlFor="customer_visible" inline>
          <Checkbox
            inputId="customer_visible"
            checked={formData.customer_visible}
            onChange={handleVisibilityChange}
          />
        </FormField>

        <div className="dialog-footer">
          <Button
            label="Ləğv et"
            icon="pi pi-times"
            outlined
            type="button"
            onClick={handleHide}
          />
          <Button
            label="Saxla"
            icon="pi pi-check"
            type="submit"
            disabled={isSubmitting || !formData.name}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default AddDialog;
