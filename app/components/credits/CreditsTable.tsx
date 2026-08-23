import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { Tag } from 'primereact/tag';
import { Checkbox, CheckboxChangeEvent } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { useDebounce } from 'primereact/hooks';

import api from '@/app/api';
import {
  IDoctor,
  IDoctorRS,
  IServiceCreditBank,
  IServiceCreditBanksData,
} from '@/app/types';
import {
  formatDate,
  formatPhone,
  formatPrice,
  useHasPermission,
} from '@/app/utils';
import { FilterDateCalendar, TableHeader } from '../shared';
import CreateCreditDialog from './CreateCreditDialog';
import CreditBankIncomeSummary from './CreditBankIncomeSummary';
import CreditDeleteDialog from './CreditDeleteDialog';
import CreditStatusTags from './CreditStatusTags';
import CreditTableActions from './CreditTableActions';
import { CREDIT_ROWS, creditVisitStatuses } from './consts';
import {
  ICredit,
  ICreditFormPayload,
  IServiceCreditBankIncome,
  IServiceCreditBankIncomesData,
  IServiceCreditData,
  IServiceCreditsData,
} from './types';
import {
  buildCreditFromPayload,
  buildServiceCreditPayload,
  getBookingStatusSeverity,
  getCreditFromResponse,
  ServiceCreditResponse,
} from './utils';

interface CreditsTableProps {
  userPermissions: string[];
}

const CreditsTable: React.FC<CreditsTableProps> = ({ userPermissions }) => {
  const [credits, setCredits] = useState<ICredit[]>([]);
  const [bankIncomes, setBankIncomes] = useState<IServiceCreditBankIncome[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<ICredit>();
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  const [editingCreditId, setEditingCreditId] = useState<number | null>(null);
  const [filter, setFilter] = useState(false);
  const [filteredStatuses, setFilteredStatuses] = useState<number[]>([]);
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [doctor, setDoctor] = useState<IDoctor>();
  const [banks, setBanks] = useState<IServiceCreditBank[]>([]);
  const [filteredBanks, setFilteredBanks] = useState<IServiceCreditBank[]>([]);
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce('', 400);
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
  const [page, setPage] = useState(1);
  const [first, setFirst] = useState(0);

  const toast = useRef<Toast>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  const hasPermission = useHasPermission(userPermissions);
  const canCreateCredit = hasPermission('service_credit.create');
  const canEditCredit =
    hasPermission('service_credit.update') &&
    hasPermission('service_credit.get_one');
  const canDeleteCredit = hasPermission('service_credit.delete');
  const canViewBankIncome = hasPermission('service_credit.get_bank_income');
  const canSetCreditBank = hasPermission('service_credit_bank.get_all');
  const hasCreditActions = canEditCredit || canDeleteCredit;

  const showSuccess = useCallback((message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }, []);

  const getCredits = useCallback(
    async (currentPage = 1, isOnPageChange = false) => {
      if (!hasPermission('service_credit.get_all')) {
        return;
      }

      const fromDate = dates[0] ? formatDate(dates[0]) : undefined;
      const toDate = dates[1] ? formatDate(dates[1]) : fromDate;
      const normalizedName = debouncedClientName.trim();
      const normalizedPhone = debouncedClientPhone.replace(/\D/g, '');
      const filters = {
        status: filteredStatuses.length ? filteredStatuses : undefined,
        from_date: fromDate,
        to_date: toDate,
        client_name: normalizedName || undefined,
        client_phone: normalizedPhone || undefined,
        doctor_id: doctor?.id,
        bank_id: filteredBanks.length
          ? filteredBanks.map((bank) => bank.id)
          : undefined,
      };

      setIsLoading(true);
      try {
        const { data, meta } = await api.getServiceCredits<IServiceCreditsData>({
          page: currentPage,
          size: CREDIT_ROWS,
          ...filters,
        });

        setCredits(data);
        setTotal(meta?.total ?? data.length);
        setPage(currentPage);

        if (canViewBankIncome) {
          const { data: incomeData } =
            await api.getServiceCreditBankIncomes<IServiceCreditBankIncomesData>(
              filters,
            );
          setBankIncomes(incomeData ?? []);
        } else {
          setBankIncomes([]);
        }
      } catch (error) {
        console.error('Failed to fetch service credits:', error);
      } finally {
        setIsLoading(false);
        if (isOnPageChange) {
          navigationRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    [
      canViewBankIncome,
      dates,
      debouncedClientName,
      debouncedClientPhone,
      doctor?.id,
      filteredBanks,
      filteredStatuses,
      hasPermission,
    ],
  );

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data }: IDoctorRS = await api.getDoctors();
        setDoctors(data ?? []);
      } catch (error) {
        console.error('Failed to fetch doctors:', error);
        setDoctors([]);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!canSetCreditBank) return;

    const fetchBanks = async () => {
      try {
        const { data }: IServiceCreditBanksData =
          await api.getServiceCreditBanks();
        setBanks(data ?? []);
      } catch (error) {
        console.error('Failed to fetch service credit banks:', error);
        setBanks([]);
      }
    };

    fetchBanks();
  }, [canSetCreditBank]);

  useEffect(() => {
    if (dates[0] && !dates[1]) return;

    setPage(1);
    setFirst(0);
    getCredits(1);
  }, [dates, getCredits]);

  const handleSaveCredit = useCallback(
    async (payload: ICreditFormPayload, credit?: ICredit) => {
      if (credit?.id) {
        if (!hasPermission('service_credit.update')) {
          return;
        }

        const response = await api.updateServiceCredit<ServiceCreditResponse>({
          id: credit.id,
          ...buildServiceCreditPayload(payload, {
            includeBank: canSetCreditBank,
          }),
        });
        const updatedCredit =
          getCreditFromResponse(response) ?? buildCreditFromPayload(payload, credit);

        setCredits((prev) =>
          prev.map((item) => (item.id === credit.id ? updatedCredit : item)),
        );
        await getCredits(page);
        showSuccess('Kredit yeniləndi');
        return;
      }

      if (!canCreateCredit) {
        return;
      }

      await api.createServiceCredit<ServiceCreditResponse>(
        buildServiceCreditPayload(payload, {
          includeBank: canSetCreditBank,
        }),
      );
      setPage(1);
      setFirst(0);
      await getCredits(1);
      showSuccess('Kredit uğurla əlavə edildi');
    },
    [canCreateCredit, canSetCreditBank, getCredits, hasPermission, page, showSuccess],
  );

  const handlePageChange = useCallback(
    (event: PaginatorPageChangeEvent) => {
      setFirst(event.first);
      getCredits(event.page + 1, true);
    },
    [getCredits],
  );

  const handleCreateClick = useCallback(() => {
    if (!canCreateCredit) {
      return;
    }

    setSelectedCredit(undefined);
    setIsCreateDialogVisible(true);
  }, [canCreateCredit]);

  const handleEditClick = useCallback(async (credit: ICredit) => {
    if (!canEditCredit) {
      return;
    }

    setEditingCreditId(credit.id);
    try {
      const { data }: IServiceCreditData = await api.getServiceCredit(credit.id);
      setSelectedCredit(data);
      setIsCreateDialogVisible(true);
    } catch (error) {
      console.error('Failed to fetch service credit:', error);
    } finally {
      setEditingCreditId(null);
    }
  }, [canEditCredit]);

  const handleDeleteClick = useCallback((credit: ICredit) => {
    if (!canDeleteCredit) {
      return;
    }

    setSelectedCredit(credit);
    setIsDeleteDialogVisible(true);
  }, [canDeleteCredit]);

  const handleDeleteCredit = useCallback(async () => {
    if (!selectedCredit?.id || !canDeleteCredit) return;

    try {
      await api.deleteServiceCredit(selectedCredit.id);
      const nextPage = credits.length === 1 && page > 1 ? page - 1 : page;

      setIsDeleteDialogVisible(false);
      setSelectedCredit(undefined);
      setFirst((nextPage - 1) * CREDIT_ROWS);
      await getCredits(nextPage);
      showSuccess('Kredit silindi');
    } catch (error) {
      console.error('Failed to delete service credit:', error);
    }
  }, [
    canDeleteCredit,
    credits.length,
    getCredits,
    page,
    selectedCredit?.id,
    showSuccess,
  ]);

  const headerContent = useMemo(
    () => (
      <TableHeader
        onFilterToggle={() => setFilter((prev) => !prev)}
        onRefresh={() => getCredits(page)}
        rightContent={
          canCreateCredit ? (
            <Button
              label="Əlavə et"
              icon="pi pi-plus"
              onClick={handleCreateClick}
            />
          ) : null
        }
      />
    ),
    [canCreateCredit, getCredits, handleCreateClick, page],
  );

  const idBodyTemplate = useCallback(
    (_rowData: ICredit, options: { rowIndex: number }) =>
      isLoading ? (
        <Skeleton width="20px" />
      ) : (
        <div>{total - options.rowIndex - first}</div>
      ),
    [isLoading, total, first],
  );

  const dateBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? <Skeleton width="100px" /> : rowData.created_at?.slice(0, -3),
    [isLoading],
  );

  const clientNameBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_name}</div>,
    [isLoading],
  );

  const clientPhoneBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <div>{formatPhone(rowData.client_phone)}</div>
      ),
    [isLoading],
  );

  const statusBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? <Skeleton width="100px" /> : <CreditStatusTags credit={rowData} />,
    [isLoading],
  );

  const getCreditDoctors = useCallback((credit: ICredit) => {
    const creditDoctors = new Map<number, string>();

    credit.visits?.forEach((visit) => {
      if (!visit.doctor) return;

      const fullName = `${visit.doctor.name} ${visit.doctor.surname}`.trim();

      if (fullName) {
        creditDoctors.set(visit.doctor.id, fullName);
      }
    });

    credit.sessions?.forEach((session) => {
      if (session.doctor?.id && session.doctor.full_name) {
        creditDoctors.set(session.doctor.id, session.doctor.full_name);
      }
    });

    return Array.from(creditDoctors, ([id, name]) => ({ id, name }));
  }, []);

  const doctorBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <div>
          {getCreditDoctors(rowData).map((creditDoctor) => (
            <div key={creditDoctor.id}>{creditDoctor.name}</div>
          ))}
        </div>
      ),
    [getCreditDoctors, isLoading],
  );

  const sessionsCountBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? (
        <Skeleton width="40px" />
      ) : (
        rowData.visits?.length ?? rowData.sessions_count ?? rowData.sessions?.length ?? 0
      ),
    [isLoading],
  );

  const bankBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? (
        <Skeleton width="80px" />
      ) : typeof rowData.bank === 'string' ? (
        rowData.bank
      ) : (
        rowData.bank?.name
      ),
    [isLoading],
  );

  const servicesBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <div>
          {rowData.service_types.map((service) => (
            <div key={service.id}>{service.name}</div>
          ))}
        </div>
      ),
    [isLoading],
  );

  const amountBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? <Skeleton width="80px" /> : formatPrice(rowData.amount),
    [isLoading],
  );

  const actionBodyTemplate = useCallback(
    (rowData: ICredit) =>
      isLoading ? (
        <Skeleton width="70px" />
      ) : (
        <CreditTableActions
          credit={rowData}
          editingCreditId={editingCreditId}
          canEdit={canEditCredit}
          canDelete={canDeleteCredit}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ),
    [
      canDeleteCredit,
      canEditCredit,
      editingCreditId,
      handleDeleteClick,
      handleEditClick,
      isLoading,
    ],
  );

  const dateFilterTemplate = useCallback(
    () => (
      <FilterDateCalendar
        value={dates}
        onChange={(event) => {
          setDates((event.value as Date[]) ?? []);
          setPage(1);
          setFirst(0);
        }}
        selectionMode="range"
        readOnlyInput
        hideOnRangeSelection
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

  const handleStatusFilterChange = useCallback(
    (statusId: number, event: CheckboxChangeEvent) => {
      const isChecked = event.checked ?? false;

      setFilteredStatuses((prev) =>
        isChecked
          ? Array.from(new Set([...prev, statusId]))
          : prev.filter((id) => id !== statusId),
      );
      setPage(1);
      setFirst(0);
    },
    [],
  );

  const statusFilterTemplate = useCallback(
    () => (
      <div className="credit-status-filter">
        {creditVisitStatuses.map((status) => (
          <label className="credit-status-filter-option" key={status.id}>
            <Checkbox
              inputId={`credit-status-filter-${status.id}`}
              checked={filteredStatuses.includes(status.id)}
              onChange={(event) => handleStatusFilterChange(status.id, event)}
            />
            <Tag
              value={status.name}
              severity={getBookingStatusSeverity(status.name)}
            />
          </label>
        ))}
      </div>
    ),
    [filteredStatuses, handleStatusFilterChange],
  );

  const doctorFilterTemplate = useCallback(
    () => (
      <Dropdown
        filter
        value={doctor}
        onChange={(event) => {
          setDoctor(event.value ?? undefined);
          setPage(1);
          setFirst(0);
        }}
        options={doctors}
        placeholder="Həkim seçin"
        optionLabel="full_name"
        showClear
      />
    ),
    [doctor, doctors],
  );

  const bankFilterTemplate = useCallback(
    () => (
      <MultiSelect
        filter
        value={filteredBanks}
        onChange={(event) => {
          setFilteredBanks(event.value ?? []);
          setPage(1);
          setFirst(0);
        }}
        options={banks}
        placeholder="Bank seçin"
        optionLabel="name"
        showClear
        style={{ minWidth: '12rem' }}
      />
    ),
    [banks, filteredBanks],
  );

  const totalContent = useMemo(
    () => (
      <div className="total-info-content">
        <CreditBankIncomeSummary incomes={bankIncomes} />
      </div>
    ),
    [bankIncomes, total],
  );

  return (
    <>
      <div className="table-responsive">
        <DataTable
          value={credits}
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
            body={dateBodyTemplate}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter
            filterElement={dateFilterTemplate}
          />
          <Column
            header="Müştəri"
            body={clientNameBodyTemplate}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter
            filterElement={clientNameFilterTemplate}
          />
          <Column
            header="Telefon"
            body={clientPhoneBodyTemplate}
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
            header="Həkim"
            body={doctorBodyTemplate}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
            filter
            filterElement={doctorFilterTemplate}
          />
          <Column
            header="Seans sayı"
            body={sessionsCountBodyTemplate}
            style={{ minWidth: '8rem' }}
          />
          <Column
            header="Bank"
            body={bankBodyTemplate}
            style={{ minWidth: '8rem' }}
            showFilterMenu={false}
            filter={canSetCreditBank}
            filterElement={bankFilterTemplate}
          />
          <Column
            header="Toplam"
            body={amountBodyTemplate}
            style={{ minWidth: '8rem' }}
          />
          {hasCreditActions && (
            <Column
              body={actionBodyTemplate}
              exportable={false}
              style={{ minWidth: '8rem' }}
            />
          )}
        </DataTable>
      </div>

      <div ref={navigationRef}>
        <Paginator
          first={first}
          rows={CREDIT_ROWS}
          totalRecords={total}
          onPageChange={handlePageChange}
        />
      </div>

      {canViewBankIncome && (
        <div className="total-info">
          <Message
            className="info-message mr-5"
            severity="info"
            content={totalContent}
          />
        </div>
      )}

      <Toast ref={toast} />

      <CreateCreditDialog
        visible={isCreateDialogVisible}
        onHide={() => {
          setIsCreateDialogVisible(false);
          setSelectedCredit(undefined);
        }}
        onSave={handleSaveCredit}
        initialCredit={selectedCredit}
        userPermissions={userPermissions}
      />

      <CreditDeleteDialog
        credit={selectedCredit}
        visible={isDeleteDialogVisible}
        onHide={() => setIsDeleteDialogVisible(false)}
        onConfirm={handleDeleteCredit}
      />
    </>
  );
};

export default CreditsTable;
