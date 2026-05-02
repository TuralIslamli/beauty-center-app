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
import { useHasPermission } from '@/app/utils';
import { FormField } from '../shared';
import {
  createDefaultCreditSessions,
  DEFAULT_CREDIT_SESSION_COUNT,
} from './consts';
import CreditBankSelect from './CreditBankSelect';
import CreditSessionsEditor, {
  CreditSessionErrors,
} from './CreditSessionsEditor';
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
  userPermissions: string[];
}

interface CreditFormErrors {
  clientFirstName?: string;
  clientLastName?: string;
  clientPhone?: string;
  serviceTypes?: string;
  sessions?: CreditSessionErrors;
}

const CLIENT_NAME_PATTERN = /^[A-Za-z ]+$/;

const splitClientName = (fullName?: string) => {
  const trimmed = (fullName || '').trim();
  if (!trimmed) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
};

const getFullClientName = (firstName: string, lastName: string) =>
  [firstName, lastName]
    .map((name) => name.trim())
    .filter(Boolean)
    .join(' ');

const CreateCreditDialog: React.FC<CreateCreditDialogProps> = ({
  visible,
  onHide,
  onSave,
  initialCredit,
  userPermissions,
}) => {
  const [clientFirstName, setClientFirstName] = useState('');
  const [clientLastName, setClientLastName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<IServiceType[]>([]);
  const [sessionsCount, setSessionsCount] = useState(DEFAULT_CREDIT_SESSION_COUNT);
  const [banks, setBanks] = useState<IServiceCreditBank[]>([]);
  const [selectedBank, setSelectedBank] = useState<ICredit['bank']>(null);
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
  const [formErrors, setFormErrors] = useState<CreditFormErrors>({});

  const hasPermission = useHasPermission(userPermissions);

  const canViewBanks = hasPermission('service_credit_bank.get_all');
  const canCreateBank = hasPermission('service_credit_bank.create');
  const canUpdateBank = hasPermission('service_credit_bank.update');
  const canDeleteBank = hasPermission('service_credit_bank.delete');

  const totalPrice = useMemo(
    () => selectedServiceTypes.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [selectedServiceTypes],
  );

  const resetForm = useCallback(() => {
    setClientFirstName('');
    setClientLastName('');
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
    setFormErrors({});
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
        ] = await Promise.all([
          api.getInputServices<IServiceTypeRS>(),
          api.getDoctors<IDoctorRS>(),
        ]);

        setServiceTypes(servicesData ?? []);
        setDoctors(doctorsData ?? []);

        if (canViewBanks) {
          const { data: banksData } =
            await api.getServiceCreditBanks<IServiceCreditBanksData>();

          setBanks(banksData ?? []);
          setSelectedBank((currentBank) =>
            currentBank &&
            typeof currentBank !== 'string' &&
            banksData?.some((bank) => bank.id === currentBank.id)
              ? currentBank
              : banksData?.[0] ?? null,
          );
        } else {
          setBanks([]);
          setEditingBank(null);
          setNewBankName('');
        }
      } catch {
        setServiceTypes([]);
        setDoctors([]);
        setBanks([]);
        if (canViewBanks) {
          setSelectedBank(null);
        }
      }
    };

    if (visible) {
      fetchInputs();
    }
  }, [canViewBanks, visible]);

  useEffect(() => {
    if (!initialCredit?.id) {
      setReceivedAmount(totalPrice);
    }
  }, [initialCredit?.id, totalPrice]);

  useEffect(() => {
    if (!visible || !initialCredit?.id) return;

    const creditSessions = getInitialCreditSessions(initialCredit, doctors);
    const initialBank = canViewBanks
      ? getInitialCreditBank(initialCredit.bank, banks)
      : initialCredit.bank;
    const initialServiceTypes = initialCredit.service_types.map(
      (selectedService) =>
        serviceTypes.find((service) => service.id === selectedService.id) ??
        selectedService,
    );
    const { firstName, lastName } = splitClientName(initialCredit.client_name);

    setClientFirstName(firstName);
    setClientLastName(lastName);
    setClientPhone(initialCredit.client_phone);
    setSelectedServiceTypes(initialServiceTypes);
    setSessionsCount(creditSessions.length || 1);
    setSessions(
      creditSessions.length ? creditSessions : createDefaultCreditSessions(),
    );
    setSelectedBank(initialBank);
    setReceivedAmount(
      initialCredit.received_amount ?? Number(initialCredit.amount || 0),
    );
    setComment(initialCredit.comment ?? '');
  }, [banks, canViewBanks, doctors, initialCredit, serviceTypes, visible]);

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

      if ('doctor' in value || value.date === null) {
        setFormErrors((prev) => {
          if (!prev.sessions?.[index]?.doctor) {
            return prev;
          }

          const nextSessions = { ...prev.sessions };
          delete nextSessions[index].doctor;

          if (!Object.keys(nextSessions[index]).length) {
            delete nextSessions[index];
          }

          return {
            ...prev,
            sessions: Object.keys(nextSessions).length
              ? nextSessions
              : undefined,
          };
        });
      }
    },
    [],
  );

  const clearFieldError = useCallback((field: keyof CreditFormErrors) => {
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const validateForm = useCallback(() => {
    const nextErrors: CreditFormErrors = {};
    const trimmedFirstName = clientFirstName.trim();
    const trimmedLastName = clientLastName.trim();
    const normalizedPhone = clientPhone.replace(/\D/g, '');
    const sessionErrors = sessions.reduce<CreditSessionErrors>(
      (errors, session, index) => {
        if (session.date && !session.doctor) {
          errors[index] = { doctor: 'Həkim seçilməlidir' };
        }

        return errors;
      },
      {},
    );

    if (!trimmedFirstName) {
      nextErrors.clientFirstName = 'Müştəri adı mütləqdir';
    } else if (!CLIENT_NAME_PATTERN.test(trimmedFirstName)) {
      nextErrors.clientFirstName = 'Yalnız ingilis şrifti';
    }

    if (!trimmedLastName) {
      nextErrors.clientLastName = 'Müştəri soyadı mütləqdir';
    } else if (!CLIENT_NAME_PATTERN.test(trimmedLastName)) {
      nextErrors.clientLastName = 'Yalnız ingilis şrifti';
    }

    if (!normalizedPhone) {
      nextErrors.clientPhone = 'Telefon tələb olunur';
    } else if (normalizedPhone.length !== 12) {
      nextErrors.clientPhone = 'Telefon tam daxil edilməlidir';
    }

    if (!selectedServiceTypes.length) {
      nextErrors.serviceTypes = 'Xidmət seçilməlidir';
    }

    if (Object.keys(sessionErrors).length) {
      nextErrors.sessions = sessionErrors;
    }

    setFormErrors(nextErrors);

    return !Object.keys(nextErrors).length;
  }, [
    clientFirstName,
    clientLastName,
    clientPhone,
    selectedServiceTypes.length,
    sessions,
  ]);

  const resetBankEditor = useCallback(() => {
    setEditingBank(null);
    setNewBankName('');
  }, []);

  const handleEditBank = useCallback((bank: IServiceCreditBank) => {
    setEditingBank(bank);
    setNewBankName(bank.name);
  }, []);

  const handleSaveBank = useCallback(async () => {
    if (editingBank ? !canUpdateBank : !canCreateBank) {
      return;
    }

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
      } else if (canViewBanks) {
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
  }, [
    banks,
    canCreateBank,
    canUpdateBank,
    canViewBanks,
    editingBank,
    newBankName,
    resetBankEditor,
  ]);

  const handleDeleteBank = useCallback(
    async (bank: IServiceCreditBank) => {
      if (!canDeleteBank) {
        return;
      }

      setDeletingBankId(bank.id);
      try {
        await api.deleteServiceCreditBank(bank.id);
        const nextBanks = banks.filter((item) => item.id !== bank.id);

        setBanks(nextBanks);
        setSelectedBank((currentBank) =>
          currentBank &&
          typeof currentBank !== 'string' &&
          currentBank.id === bank.id
            ? nextBanks[0] ?? null
            : currentBank,
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
    [banks, canDeleteBank, editingBank?.id, resetBankEditor],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      try {
        const fullClientName = getFullClientName(clientFirstName, clientLastName);

        await onSave({
          client_name: fullClientName,
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
      clientFirstName,
      clientLastName,
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
      validateForm,
    ],
  );

  return (
    <Dialog
      visible={visible}
      modal
      onHide={handleHide}
      header={initialCredit?.id ? 'Krediti yenilə' : 'Kredit'}
      style={{ maxWidth: '640px', width: '100%' }}
    >
      <form onSubmit={handleSubmit} className="dialog-form">
        <div className="form-row credit-form-row">
          <FormField
            label="Müştəri adı:"
            htmlFor="credit_client_first_name"
            error={formErrors.clientFirstName}
          >
            <InputText
              id="credit_client_first_name"
              className="w-full"
              value={clientFirstName}
              invalid={!!formErrors.clientFirstName}
              onChange={(event) => {
                setClientFirstName(event.target.value);
                clearFieldError('clientFirstName');
              }}
            />
          </FormField>

          <FormField
            label="Müştəri soyadı:"
            htmlFor="credit_client_last_name"
            error={formErrors.clientLastName}
          >
            <InputText
              id="credit_client_last_name"
              className="w-full"
              value={clientLastName}
              invalid={!!formErrors.clientLastName}
              onChange={(event) => {
                setClientLastName(event.target.value);
                clearFieldError('clientLastName');
              }}
            />
          </FormField>
        </div>

        <FormField
          label="Telefon:"
          htmlFor="credit_client_phone"
          error={formErrors.clientPhone}
        >
          <InputMask
            id="credit_client_phone"
            mask="+999 99 999-99-99"
            placeholder="+994 99 999-99-99"
            value={clientPhone}
            invalid={!!formErrors.clientPhone}
            onChange={(event) => {
              setClientPhone(event.value || '');
              clearFieldError('clientPhone');
            }}
          />
        </FormField>

        <FormField
          label="Xidmət:"
          htmlFor="credit_service_types"
          error={formErrors.serviceTypes}
        >
          <MultiSelect
            inputId="credit_service_types"
            filter
            value={selectedServiceTypes}
            onChange={(event) => {
              setSelectedServiceTypes(event.value);
              clearFieldError('serviceTypes');
            }}
            options={serviceTypes}
            dataKey="id"
            optionLabel="name"
            placeholder="Xidmət seçin"
            className="w-full"
            invalid={!!formErrors.serviceTypes}
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

          {canViewBanks && (
            <CreditBankSelect
              banks={banks}
              selectedBank={
                typeof selectedBank === 'string' ? null : selectedBank
              }
              editingBank={editingBank}
              newBankName={newBankName}
              isBankSaving={isBankSaving}
              deletingBankId={deletingBankId}
              canCreateBank={canCreateBank}
              canUpdateBank={canUpdateBank}
              canDeleteBank={canDeleteBank}
              onBankChange={(bank) => setSelectedBank(bank)}
              onEditingBankChange={handleEditBank}
              onNewBankNameChange={setNewBankName}
              onSaveBank={handleSaveBank}
              onDeleteBank={handleDeleteBank}
              onResetBankEditor={resetBankEditor}
            />
          )}
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
          errors={formErrors.sessions}
          onSessionChange={handleSessionChange}
        />

        <div className="dialog-footer">
          <Button
            label="Saxla"
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateCreditDialog;
