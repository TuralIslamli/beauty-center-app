import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { useDebounce } from 'primereact/hooks';

import { formatDate, formatPhone, formatPrice } from '@/app/utils';
import { TableHeader } from '../shared';
import { creditStatuses, mockCredits } from './consts';
import CreateCreditDialog from './CreateCreditDialog';
import { CreditStatus, ICredit, ICreditFormPayload } from './types';

const rows = 10;

const CreditsTable: React.FC = () => {
  const [credits, setCredits] = useState<ICredit[]>(mockCredits);
  const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
  const [filter, setFilter] = useState(false);
  const [filteredStatus, setFilteredStatus] = useState<{
    id: CreditStatus;
    name: string;
  } | null>(null);
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce('', 400);
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
  const [page, setPage] = useState(1);
  const [first, setFirst] = useState(0);

  const toast = useRef<Toast>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const showSuccess = useCallback((message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }, []);

  const filteredCredits = useMemo(() => {
    const fromDate = dates[0] ? formatDate(dates[0]) : '';
    const toDate = dates[1] ? formatDate(dates[1]) : fromDate;
    const normalizedPhone = debouncedClientPhone.replace(/\D/g, '');
    const normalizedName = debouncedClientName.trim().toLowerCase();

    return credits.filter((credit) => {
      const createdDate = credit.created_at.slice(0, 10);
      const isInDateRange =
        (!fromDate || createdDate >= fromDate) && (!toDate || createdDate <= toDate);
      const matchesName =
        !normalizedName || credit.client_name.toLowerCase().includes(normalizedName);
      const matchesPhone =
        !normalizedPhone || credit.client_phone.replace(/\D/g, '').includes(normalizedPhone);
      const matchesStatus = !filteredStatus || credit.status === filteredStatus.id;

      return isInDateRange && matchesName && matchesPhone && matchesStatus;
    });
  }, [credits, dates, debouncedClientName, debouncedClientPhone, filteredStatus]);

  const pageCredits = useMemo(
    () => filteredCredits.slice(first, first + rows),
    [filteredCredits, first],
  );

  const totalAmount = useMemo(
    () => filteredCredits.reduce((sum, credit) => sum + credit.received_amount, 0),
    [filteredCredits],
  );

  const handleCreateCredit = useCallback(
    (payload: ICreditFormPayload) => {
      const now = new Date();
      const createdAt = `${formatDate(now)} ${now.toTimeString().slice(0, 5)}`;

      setCredits((prev) => [
        {
          id: Math.max(...prev.map((credit) => credit.id), 0) + 1,
          created_at: createdAt,
          client_name: payload.client_name,
          client_phone: payload.client_phone,
          status: 'active',
          sessions_count: payload.sessions_count,
          bank: payload.bank,
          amount: payload.amount,
          received_amount: payload.received_amount,
          comment: payload.comment,
          service_types: payload.service_types,
          sessions: payload.sessions,
        },
        ...prev,
      ]);
      setPage(1);
      setFirst(0);
      showSuccess('Kredit uğurla əlavə edildi');
    },
    [showSuccess],
  );

  const handlePageChange = useCallback((event: PaginatorPageChangeEvent) => {
    setFirst(event.first);
    setPage(event.page + 1);
    navigationRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const getSeverity = useCallback((status: CreditStatus) => {
    switch (status) {
      case 'rejected':
        return 'danger';
      case 'finished':
        return 'success';
      case 'active':
        return 'info';
      default:
        return undefined;
    }
  }, []);

  const headerContent = useMemo(
    () => (
      <TableHeader
        onFilterToggle={() => setFilter((prev) => !prev)}
        onRefresh={() => {
          setCredits(mockCredits);
          setPage(1);
          setFirst(0);
        }}
        rightContent={
          <Button
            label="Əlavə et"
            icon="pi pi-plus"
            onClick={() => setIsCreateDialogVisible(true)}
          />
        }
      />
    ),
    [],
  );

  const idBodyTemplate = useCallback(
    (_rowData: ICredit, options: { rowIndex: number }) => (
      <div>{filteredCredits.length - options.rowIndex - first}</div>
    ),
    [filteredCredits.length, first],
  );

  const servicesBodyTemplate = useCallback((rowData: ICredit) => (
    <div>
      {rowData.service_types.map((service) => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  ), []);

  const statusBodyTemplate = useCallback(
    (rowData: ICredit) => {
      const status = creditStatuses.find((item) => item.id === rowData.status);

      return (
        <Tag
          value={status?.name}
          severity={getSeverity(rowData.status)}
          className="status-badge"
        />
      );
    },
    [getSeverity],
  );

  const dateFilterTemplate = useCallback(
    () => (
      <Calendar
        value={dates}
        onChange={(event) => {
          setDates(event.value as Date[]);
          setPage(1);
          setFirst(0);
        }}
        selectionMode="range"
        readOnlyInput
        hideOnRangeSelection
        className="filter-calendar"
        dateFormat="dd/mm/yy"
      />
    ),
    [dates],
  );

  const clientNameFilterTemplate = useCallback(
    () => (
      <InputText
        placeholder="Ad ilə axtarış"
        className="filter-input"
        value={clientName}
        onChange={(event) => {
          setClientName(event.target.value);
          setPage(1);
          setFirst(0);
        }}
      />
    ),
    [clientName, setClientName],
  );

  const clientPhoneFilterTemplate = useCallback(
    () => (
      <InputText
        placeholder="+994 99 999-99-99"
        className="input-phone-filter"
        value={clientPhone}
        onChange={(event) => {
          setClientPhone(event.target.value);
          setPage(1);
          setFirst(0);
        }}
      />
    ),
    [clientPhone, setClientPhone],
  );

  const statusFilterTemplate = useCallback(
    () => (
      <Dropdown
        value={filteredStatus}
        options={creditStatuses}
        onChange={(event) => {
          setFilteredStatus(event.value);
          setPage(1);
          setFirst(0);
        }}
        itemTemplate={(option) => (
          <Tag value={option.name} severity={getSeverity(option.id)} />
        )}
        placeholder="Status"
        className="p-column-filter"
        showClear
        style={{ minWidth: '10rem' }}
        optionLabel="name"
      />
    ),
    [filteredStatus, getSeverity],
  );

  const totalContent = useMemo(
    () => (
      <div className="total-info-content">
        <div className="ml-2">Kreditlər: {formatPrice(totalAmount)}</div>
        <div className="ml-2">Say: {filteredCredits.length}</div>
      </div>
    ),
    [totalAmount, filteredCredits.length],
  );

  return (
    <>
      <div className="table-responsive">
        <DataTable
          value={pageCredits}
          dataKey="id"
          header={headerContent}
          tableStyle={{ minWidth: '60rem' }}
          className="table-container"
          filterDisplay={filter ? 'row' : undefined}
        >
          <Column
            body={idBodyTemplate}
            header="#"
            style={{ width: '3rem', minWidth: '3rem' }}
          />
          <Column
            header="Tarix"
            field="created_at"
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter
            filterElement={dateFilterTemplate}
          />
          <Column
            header="Müştəri"
            field="client_name"
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter
            filterElement={clientNameFilterTemplate}
          />
          <Column
            header="Telefon"
            body={(rowData: ICredit) => formatPhone(rowData.client_phone)}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter
            filterElement={clientPhoneFilterTemplate}
          />
          <Column
            header="Status"
            body={statusBodyTemplate}
            style={{ minWidth: '10rem' }}
            showFilterMenu={false}
            filter
            filterElement={statusFilterTemplate}
          />
          <Column
            header="Seans sayı"
            field="sessions_count"
            style={{ minWidth: '8rem' }}
          />
          <Column header="Bank" field="bank" style={{ minWidth: '8rem' }} />
          <Column
            header="Xidmət"
            body={servicesBodyTemplate}
            style={{ minWidth: '14rem' }}
          />
          <Column
            header="Toplam"
            body={(rowData: ICredit) => formatPrice(rowData.amount)}
            style={{ minWidth: '8rem' }}
          />
          <Column
            header="Alındı"
            body={(rowData: ICredit) => formatPrice(rowData.received_amount)}
            style={{ minWidth: '8rem' }}
          />
        </DataTable>
      </div>

      <div ref={navigationRef}>
        <Paginator
          first={first}
          rows={rows}
          totalRecords={filteredCredits.length}
          onPageChange={handlePageChange}
        />
      </div>

      <div className="total-info">
        <Message
          className="info-message mr-5"
          severity="info"
          content={totalContent}
        />
      </div>

      <Toast ref={toast} />

      <CreateCreditDialog
        visible={isCreateDialogVisible}
        onHide={() => setIsCreateDialogVisible(false)}
        onCreate={handleCreateCredit}
      />
    </>
  );
};

export default CreditsTable;
