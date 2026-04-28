import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { InputTextarea } from 'primereact/inputtextarea';

import api from '@/app/api';
import {
  IDoctor,
  IDoctorRS,
  IServiceCreditBank,
  IServiceCreditBanksData,
  IServiceType,
  IServiceTypeRS,
} from '@/app/types';
import { FormField } from '../shared';
import {
  createDefaultCreditSessions,
  DEFAULT_CREDIT_SESSION_COUNT,
} from './consts';
import CreditBankSelect from './CreditBankSelect';
import CreditSessionsEditor from './CreditSessionsEditor';
import { ICredit, ICreditFormPayload, ICreditSession } from './types';
import {
  getBankFromResponse,
  getInitialCreditBank,
  getInitialCreditSessions,
  ServiceCreditBankResponse,
} from './utils';

interface CreateCreditDialogProps {
  visible: boolean;
  onHide: () => void;
  onSave: (payload: ICreditFormPayload, credit?: ICredit) => Promise<void> | void;
  initialCredit?: ICredit;
}

const CreateCreditDialog: React.FC<CreateCreditDialogProps> = ({
  visible,
  onHide,
  onSave,
  initialCredit,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<IServiceType[]>([]);
  const [sessionsCount, setSessionsCount] = useState(DEFAULT_CREDIT_SESSION_COUNT);
  const [banks, setBanks] = useState<IServiceCreditBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<IServiceCreditBank | null>(null);
  const [editingBank, setEditingBank] = useState<IServiceCreditBank | null>(null);
  const [newBankName, setNewBankName] = useState('');
  const [isBankSaving, setIsBankSaving] = useState(false);
  const [deletingBankId, setDeletingBankId] = useState<number | null>(null);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [comment, setComment] = useState('');
  const [sessions, setSessions] = useState<ICreditSession[]>(
    createDefaultCreditSessions(),
  );
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = useMemo(
    () => selectedServiceTypes.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [selectedServiceTypes],
  );

  const resetForm = useCallback(() => {
    setClientName('');
    setClientPhone('');
    setSelectedServiceTypes([]);
    setSessionsCount(DEFAULT_CREDIT_SESSION_COUNT);
    setSelectedBank(null);
    setEditingBank(null);
    setNewBankName('');
    setDeletingBankId(null);
    setReceivedAmount(0);
    setComment('');
    setSessions(createDefaultCreditSessions());
  }, []);

  const handleHide = useCallback(() => {
    resetForm();
    onHide();
  }, [onHide, resetForm]);

  useEffect(() => {
    const fetchInputs = async () => {
      try {
        const [
          { data: servicesData },
          { data: doctorsData },
          { data: banksData },
        ] = await Promise.all([
          api.getInputServices<IServiceTypeRS>(),
          api.getDoctors<IDoctorRS>(),
          api.getServiceCreditBanks<IServiceCreditBanksData>(),
        ]);

        setServiceTypes(servicesData ?? []);
        setDoctors(doctorsData ?? []);
        setBanks(banksData ?? []);
        setSelectedBank((currentBank) =>
          currentBank && banksData?.some((bank) => bank.id === currentBank.id)
            ? currentBank
            : banksData?.[0] ?? null,
        );
      } catch {
        setServiceTypes([]);
        setDoctors([]);
        setBanks([]);
        setSelectedBank(null);
      }
    };

    if (visible) {
      fetchInputs();
    }
  }, [visible]);

  useEffect(() => {
    if (!initialCredit?.id) {
      setReceivedAmount(totalPrice);
    }
  }, [initialCredit?.id, totalPrice]);

  useEffect(() => {
    if (!visible || !initialCredit?.id) return;

    const creditSessions = getInitialCreditSessions(initialCredit, doctors);
    const initialBank = getInitialCreditBank(initialCredit.bank, banks);

    setClientName(initialCredit.client_name);
    setClientPhone(initialCredit.client_phone);
    setSelectedServiceTypes(initialCredit.service_types);
    setSessionsCount(creditSessions.length || 1);
    setSessions(
      creditSessions.length ? creditSessions : createDefaultCreditSessions(),
    );
    setSelectedBank(initialBank);
    setReceivedAmount(
      initialCredit.received_amount ?? Number(initialCredit.amount || 0),
    );
    setComment(initialCredit.comment ?? '');
  }, [banks, doctors, initialCredit, visible]);

  useEffect(() => {
    setSessions((prev) =>
      Array.from({ length: sessionsCount }, (_, index) => ({
        id: index + 1,
        date: prev[index]?.date ?? null,
        doctor: prev[index]?.doctor,
        status: prev[index]?.status ?? 'pending',
      })),
    );
  }, [sessionsCount]);

  const handleSessionChange = useCallback(
    (index: number, value: Partial<ICreditSession>) => {
      setSessions((prev) =>
        prev.map((session, sessionIndex) =>
          sessionIndex === index ? { ...session, ...value } : session,
        ),
      );
    },
    [],
  );

  const resetBankEditor = useCallback(() => {
    setEditingBank(null);
    setNewBankName('');
  }, []);

  const handleEditBank = useCallback((bank: IServiceCreditBank) => {
    setEditingBank(bank);
    setNewBankName(bank.name);
  }, []);

  const handleSaveBank = useCallback(async () => {
    const trimmedName = newBankName.trim();
    if (!trimmedName) {
      return;
    }

    const exists = banks.some(
      (bank) =>
        bank.id !== editingBank?.id &&
        bank.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (exists) {
      resetBankEditor();
      return;
    }

    setIsBankSaving(true);
    try {
      const response = editingBank
        ? await api.updateServiceCreditBank<ServiceCreditBankResponse>({
            id: editingBank.id,
            name: trimmedName,
          })
        : await api.createServiceCreditBank<ServiceCreditBankResponse>({
            name: trimmedName,
          });
      const savedBank =
        response && getBankFromResponse(response)?.id
          ? getBankFromResponse(response)
          : editingBank
            ? { ...editingBank, name: trimmedName }
            : undefined;

      if (savedBank) {
        setBanks((prev) =>
          editingBank
            ? prev.map((bank) => (bank.id === savedBank.id ? savedBank : bank))
            : [...prev, savedBank],
        );
        setSelectedBank(savedBank);
      } else {
        const { data: banksData } =
          await api.getServiceCreditBanks<IServiceCreditBanksData>();
        const createdBank =
          banksData.find(
            (bank) => bank.name.toLowerCase() === trimmedName.toLowerCase(),
          ) ?? banksData[0];

        setBanks(banksData);
        setSelectedBank(createdBank ?? null);
      }
      resetBankEditor();
    } catch (error) {
      console.error('Failed to save service credit bank:', error);
    } finally {
      setIsBankSaving(false);
    }
  }, [banks, editingBank, newBankName, resetBankEditor]);

  const handleDeleteBank = useCallback(
    async (bank: IServiceCreditBank) => {
      setDeletingBankId(bank.id);
      try {
        await api.deleteServiceCreditBank(bank.id);
        const nextBanks = banks.filter((item) => item.id !== bank.id);

        setBanks(nextBanks);
        setSelectedBank((currentBank) =>
          currentBank?.id === bank.id ? nextBanks[0] ?? null : currentBank,
        );

        if (editingBank?.id === bank.id) {
          resetBankEditor();
        }
      } catch (error) {
        console.error('Failed to delete service credit bank:', error);
      } finally {
        setDeletingBankId(null);
      }
    },
    [banks, editingBank?.id, resetBankEditor],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSubmitting(true);
      try {
        await onSave({
          client_name: clientName.trim(),
          client_phone: clientPhone.replace(/[\s-]/g, ''),
          service_types: selectedServiceTypes,
          sessions_count: sessionsCount,
          bank: selectedBank,
          comment: comment.trim(),
          sessions,
          amount: totalPrice,
          received_amount: receivedAmount,
        }, initialCredit);
        handleHide();
      } catch (error) {
        console.error('Failed to save service credit:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      clientName,
      clientPhone,
      selectedServiceTypes,
      sessionsCount,
      selectedBank,
      comment,
      sessions,
      totalPrice,
      receivedAmount,
      initialCredit,
      onSave,
      handleHide,
    ],
  );

  const isSubmitDisabled =
    !clientName.trim() ||
    !clientPhone ||
    !selectedServiceTypes.length ||
    sessions.some((session) => session.date && !session.doctor);

  return (
    <Dialog
      visible={visible}
      modal
      onHide={handleHide}
      header={initialCredit?.id ? 'Krediti yenilə' : 'Kredit'}
      style={{ maxWidth: '640px', width: '100%' }}
    >
      <form onSubmit={handleSubmit} className="dialog-form">
        <FormField label="Müştəri adı:" htmlFor="credit_client_name">
          <InputText
            id="credit_client_name"
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
          />
        </FormField>

        <FormField label="Telefon:" htmlFor="credit_client_phone">
          <InputMask
            id="credit_client_phone"
            mask="+999 99 999-99-99"
            placeholder="+994 99 999-99-99"
            value={clientPhone}
            onChange={(event) => setClientPhone(event.value || '')}
          />
        </FormField>

        <FormField label="Xidmət:" htmlFor="credit_service_types">
          <MultiSelect
            inputId="credit_service_types"
            filter
            value={selectedServiceTypes}
            onChange={(event) => setSelectedServiceTypes(event.value)}
            options={serviceTypes}
            optionLabel="name"
            placeholder="Xidmət seçin"
            className="w-full"
          />
        </FormField>

        <div className="form-row credit-form-row">
          <FormField label="Seans sayı:" htmlFor="credit_sessions_count">
            <InputNumber
              inputId="credit_sessions_count"
              value={sessionsCount}
              min={1}
              max={10}
              showButtons
              onValueChange={(event) =>
                setSessionsCount(Math.min(Math.max(event.value || 1, 1), 10))
              }
            />
          </FormField>

          <CreditBankSelect
            banks={banks}
            selectedBank={selectedBank}
            editingBank={editingBank}
            newBankName={newBankName}
            isBankSaving={isBankSaving}
            deletingBankId={deletingBankId}
            onBankChange={setSelectedBank}
            onEditingBankChange={handleEditBank}
            onNewBankNameChange={setNewBankName}
            onSaveBank={handleSaveBank}
            onDeleteBank={handleDeleteBank}
            onResetBankEditor={resetBankEditor}
          />
        </div>

        <FormField label="Comment:" htmlFor="credit_comment">
          <InputTextarea
            id="credit_comment"
            value={comment}
            rows={3}
            autoResize
            onChange={(event) => setComment(event.target.value)}
          />
        </FormField>

        <div className="form-row credit-form-row">
          <div>
            <label>Toplam:</label>
            <InputNumber
              disabled
              value={totalPrice}
              mode="currency"
              currency="AZN"
              locale="de-DE"
              className="mt-2 mb-3"
            />
          </div>
          <div>
            <label>Alındı:</label>
            <InputNumber
              value={receivedAmount}
              onValueChange={(event) => setReceivedAmount(event.value || 0)}
              mode="currency"
              currency="AZN"
              locale="de-DE"
              className="mt-2 mb-3"
              min={0}
            />
          </div>
        </div>

        <CreditSessionsEditor
          sessions={sessions}
          doctors={doctors}
          onSessionChange={handleSessionChange}
        />

        <div className="dialog-footer">
          <Button
            label="Saxla"
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitDisabled || isSubmitting}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateCreditDialog;
