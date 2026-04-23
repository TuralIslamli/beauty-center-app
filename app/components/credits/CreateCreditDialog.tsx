import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';

import api from '@/app/api';
import { IDoctor, IDoctorRS, IServiceType, IServiceTypeRS } from '@/app/types';
import { FormField } from '../shared';
import {
  creditBanks,
  creditSessionStatuses,
  mockDoctors,
  mockServiceTypes,
} from './consts';
import { ICreditFormPayload, ICreditSession } from './types';

interface CreateCreditDialogProps {
  visible: boolean;
  onHide: () => void;
  onCreate: (payload: ICreditFormPayload) => void;
}

const defaultSessions = Array.from({ length: 3 }, (_, index) => ({
  id: index + 1,
  date: null,
  status: 'pending' as const,
}));

type CreditBankOption = (typeof creditBanks)[number];

const CreateCreditDialog: React.FC<CreateCreditDialogProps> = ({
  visible,
  onHide,
  onCreate,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<IServiceType[]>([]);
  const [sessionsCount, setSessionsCount] = useState(3);
  const [banks, setBanks] = useState<CreditBankOption[]>(creditBanks);
  const [selectedBank, setSelectedBank] = useState(creditBanks[0]);
  const [newBankName, setNewBankName] = useState('');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [comment, setComment] = useState('');
  const [sessions, setSessions] = useState<ICreditSession[]>(defaultSessions);
  const [doctors, setDoctors] = useState<IDoctor[]>(mockDoctors);
  const [serviceTypes, setServiceTypes] = useState<IServiceType[]>(mockServiceTypes);

  const totalPrice = useMemo(
    () => selectedServiceTypes.reduce((sum, service) => sum + Number(service.price || 0), 0),
    [selectedServiceTypes],
  );

  const resetForm = useCallback(() => {
    setClientName('');
    setClientPhone('');
    setSelectedServiceTypes([]);
    setSessionsCount(3);
    setSelectedBank(creditBanks[0]);
    setNewBankName('');
    setReceivedAmount(0);
    setComment('');
    setSessions(defaultSessions);
  }, []);

  const handleHide = useCallback(() => {
    resetForm();
    onHide();
  }, [onHide, resetForm]);

  useEffect(() => {
    const fetchInputs = async () => {
      try {
        const [{ data: servicesData }, { data: doctorsData }] = await Promise.all([
          api.getInputServices<IServiceTypeRS>(),
          api.getDoctors<IDoctorRS>(),
        ]);
        setServiceTypes(servicesData?.length ? servicesData : mockServiceTypes);
        setDoctors(doctorsData?.length ? doctorsData : mockDoctors);
      } catch {
        setServiceTypes(mockServiceTypes);
        setDoctors(mockDoctors);
      }
    };

    if (visible) {
      fetchInputs();
    }
  }, [visible]);

  useEffect(() => {
    setReceivedAmount(totalPrice);
  }, [totalPrice]);

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

  const handleAddBank = useCallback(() => {
    const trimmedName = newBankName.trim();
    if (!trimmedName) {
      return;
    }

    const exists = banks.some(
      (bank) => bank.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (exists) {
      setNewBankName('');
      return;
    }

    const bank = {
      id: trimmedName.toLowerCase().replace(/\s+/g, '-'),
      name: trimmedName,
    };
    setBanks((prev) => [...prev, bank]);
    setSelectedBank(bank);
    setNewBankName('');
  }, [banks, newBankName]);

  const handleDeleteBank = useCallback(
    (bankId: string) => {
      setBanks((prev) => {
        const nextBanks = prev.filter((bank) => bank.id !== bankId);
        if (selectedBank.id === bankId) {
          setSelectedBank(nextBanks[0] || creditBanks[0]);
        }
        return nextBanks.length ? nextBanks : creditBanks;
      });
    },
    [selectedBank.id],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      onCreate({
        client_name: clientName.trim(),
        client_phone: clientPhone.replace(/[\s-]/g, ''),
        service_types: selectedServiceTypes,
        sessions_count: sessionsCount,
        bank: selectedBank.name,
        comment: comment.trim(),
        sessions,
        amount: totalPrice,
        received_amount: receivedAmount,
      });
      handleHide();
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
      onCreate,
      handleHide,
    ],
  );

  const isSubmitDisabled =
    !clientName.trim() ||
    !clientPhone ||
    !selectedServiceTypes.length ||
    sessions.some((session) => session.date && !session.doctor);

  const bankItemTemplate = useCallback(
    (option: CreditBankOption) => (
      <div className="credit-bank-option">
        <span>{option.name}</span>
        <Button
          type="button"
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          aria-label={`${option.name} sil`}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleDeleteBank(option.id);
          }}
        />
      </div>
    ),
    [handleDeleteBank],
  );

  const bankPanelFooterTemplate = useCallback(
    () => (
      <div className="credit-bank-footer">
        <InputText
          value={newBankName}
          onChange={(event) => setNewBankName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAddBank();
            }
          }}
          placeholder="Yeni bank"
        />
        <Button
          type="button"
          icon="pi pi-plus"
          aria-label="Bank əlavə et"
          onClick={handleAddBank}
          disabled={!newBankName.trim()}
        />
      </div>
    ),
    [handleAddBank, newBankName],
  );

  return (
    <Dialog
      visible={visible}
      modal
      onHide={handleHide}
      header="Kredit"
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

          <FormField label="Bank:" htmlFor="credit_bank">
            <Dropdown
              inputId="credit_bank"
              value={selectedBank}
              onChange={(event) => setSelectedBank(event.value)}
              options={banks}
              optionLabel="name"
              placeholder="Bank seçin"
              itemTemplate={bankItemTemplate}
              panelFooterTemplate={bankPanelFooterTemplate}
            />
          </FormField>
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

        <div className="credit-sessions">
          {sessions.map((session, index) => (
            <div key={session.id} className="credit-session-row">
              <span className="credit-session-index">{index + 1}</span>
              <Calendar
                value={session.date}
                onChange={(event) =>
                  handleSessionChange(index, { date: event.value as Date | null })
                }
                dateFormat="dd-mm-yy"
                readOnlyInput
                placeholder="Tarix"
                showIcon
              />
              <Dropdown
                filter
                value={session.doctor}
                onChange={(event) =>
                  handleSessionChange(index, { doctor: event.value })
                }
                options={doctors}
                optionLabel="full_name"
                placeholder="Doktor seçin"
                className="credit-session-doctor"
              />
              <Dropdown
                value={creditSessionStatuses.find(
                  (status) => status.id === session.status,
                )}
                onChange={(event) =>
                  handleSessionChange(index, { status: event.value.id })
                }
                options={creditSessionStatuses}
                optionLabel="name"
                placeholder="Status"
                className="credit-session-status"
              />
            </div>
          ))}
        </div>

        <div className="dialog-footer">
          <Button label="Saxla" type="submit" disabled={isSubmitDisabled} />
        </div>
      </form>
    </Dialog>
  );
};

export default CreateCreditDialog;
