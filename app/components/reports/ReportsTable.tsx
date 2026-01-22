import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  DataTable,
  DataTableExpandedRows,
  DataTableValueArray,
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { useDebounce } from 'primereact/hooks';

import api from '../../api';
import {
  IAmountChangeHistory,
  IDoctor,
  IDoctorRS,
  IReport,
  IReportsData,
  IRole,
  ITotalAmount,
} from '../../types';
import {
  formatDate,
  formatPrice,
  formatPhone,
  haveFilterPermissions,
} from '@/app/utils';
import { TableHeader } from '../shared';

interface ReportsTableProps {
  userPermissions: string[];
  role: IRole;
}

const ReportsTable: React.FC<ReportsTableProps> = ({ userPermissions }) => {
  const [reports, setReports] = useState<IReport[]>([]);
  const [filter, setFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState<ITotalAmount>();
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
  const [expandedRows, setExpandedRows] = useState<
    DataTableExpandedRows | DataTableValueArray
  >();
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce<
    number | null
  >(null, 400);
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [doctor, setDoctor] = useState<IDoctor>();

  const toast = useRef<Toast>(null);

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions],
  );

  const getReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data }: IReportsData = await api.getReports({
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        client_name: debouncedClientName,
        client_phone: debouncedClientPhone,
        user_id: doctor?.id,
      });

      setReports(data);

      if (hasPermission('service.advance.info')) {
        const total: ITotalAmount = await api.getTotalAmount({
          from_date: formatDate(dates[0]),
          to_date: formatDate(dates[1]),
          client_name: debouncedClientName,
          client_phone: debouncedClientPhone,
          user_id: doctor?.id,
        });
        setTotalAmount(total);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    dates,
    debouncedClientName,
    debouncedClientPhone,
    doctor?.id,
    hasPermission,
  ]);

  useEffect(() => {
    if (dates[1]) {
      getReports();
    }
  }, [getReports]);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (hasPermission('user.input_search')) {
        const { data }: IDoctorRS = await api.getDoctors();
        setDoctors(data);
      }
    };
    fetchDoctors();
  }, [hasPermission]);

  // Body Templates
  const idBodyTemplate = useCallback(
    (rowData: IReport, options: { rowIndex: number }) =>
      isLoading ? <Skeleton width="20px" /> : <div>{options.rowIndex + 1}</div>,
    [isLoading],
  );

  const dateBodyTemplate = useCallback(
    (rowData: IReport) =>
      isLoading ? <Skeleton width="100px" /> : rowData.date_time.slice(0, -3),
    [isLoading],
  );

  const clientNameBodyTemplate = useCallback(
    (rowData: IReport) =>
      isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_name}</div>,
    [isLoading],
  );

  const clientPhoneBodyTemplate = useCallback(
    (rowData: IReport) =>
      isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <div>{formatPhone(rowData.client_phone)}</div>
      ),
    [isLoading],
  );

  const doctorBodyTemplate = useCallback(
    (rowData: IReport) =>
      isLoading ? (
        <Skeleton width="150px" />
      ) : (
        `${rowData.user?.name} ${rowData.user?.surname}`
      ),
    [isLoading],
  );

  const serviceTypeBodyTemplate = useCallback(
    (rowData: IReport) =>
      isLoading ? (
        <Skeleton width="100px" />
      ) : (
        <div>{rowData.service_type === 'service' ? 'xidmət' : 'depozit'}</div>
      ),
    [isLoading],
  );

  const priceBodyTemplate = useCallback(
    (rowData: IReport) =>
      isLoading ? <Skeleton width="100px" /> : formatPrice(rowData.amount),
    [isLoading],
  );

  // Filter Templates
  const dateFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.date') ? (
        <Calendar
          value={dates}
          onChange={(e) => setDates(e.value as Date[])}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          className="filter-calendar"
          dateFormat="dd/mm/yy"
        />
      ) : null,
    [hasPermission, dates],
  );

  const clientNameFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.client_name') ? (
        <InputText
          placeholder="Ad ilə axtarış"
          className="filter-input"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      ) : null,
    [hasPermission, clientName, setClientName],
  );

  const clientPhoneFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.client_phone') ? (
        <InputNumber
          className="input-phone-filter"
          id="client_phone"
          placeholder="+994 99 999-99-99"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.value)}
          prefix="+"
          useGrouping={false}
        />
      ) : null,
    [hasPermission, clientPhone, setClientPhone],
  );

  const doctorFilterTemplate = useCallback(
    () =>
      hasPermission('service.filter.doctor') ? (
        <Dropdown
          filter
          value={doctor}
          onChange={(e) => setDoctor(e.value)}
          options={doctors}
          placeholder="Həkim seçin"
          optionLabel="full_name"
          showClear
        />
      ) : null,
    [hasPermission, doctor, doctors],
  );

  // Row Expansion Templates
  const allowExpansion = useCallback(
    (rowData: IReport) => (rowData.amount_change_history?.length ?? 0) > 1,
    [],
  );

  const dateRowTemplate = useCallback(
    (rowData: IAmountChangeHistory) =>
      isLoading ? <Skeleton width="100px" /> : rowData.created_at.slice(0, -3),
    [isLoading],
  );

  const causerBodyTemplate = useCallback(
    (rowData: IAmountChangeHistory) =>
      isLoading ? (
        <Skeleton width="150px" />
      ) : (
        `${rowData.causer?.name} ${rowData.causer?.surname}`
      ),
    [isLoading],
  );

  const rowExpansionTemplate = useCallback(
    (data: IReport) => (
      <div className="p-3">
        <DataTable value={data.amount_change_history}>
          <Column field="date" header="Tarix" body={dateRowTemplate} />
          <Column field="amount" header="Məbləğ" body={priceBodyTemplate} />
          <Column
            field="status"
            header="Qəbul edən"
            body={causerBodyTemplate}
          />
        </DataTable>
      </div>
    ),
    [dateRowTemplate, priceBodyTemplate, causerBodyTemplate],
  );

  const totalContent = useMemo(
    () => (
      <div className="total-info-content">
        <div className="ml-2">Depozit: {totalAmount?.advance} AZN</div>
        <div className="ml-2">Xidmətlər: {totalAmount?.amount} AZN</div>
        <div className="ml-2">Toplam: {totalAmount?.total} AZN</div>
      </div>
    ),
    [totalAmount],
  );

  const headerContent = useMemo(
    () => (
      <TableHeader
        onFilterToggle={
          haveFilterPermissions(userPermissions)
            ? () => setFilter((prev) => !prev)
            : undefined
        }
        onRefresh={getReports}
      />
    ),
    [userPermissions, getReports],
  );

  return (
    <>
      <div className="table-responsive">
        <DataTable
          value={reports}
          dataKey="id"
          header={headerContent}
          tableStyle={{ minWidth: '60rem' }}
          className="table-container"
          filterDisplay={filter ? 'row' : undefined}
          paginator
          rows={10}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander={allowExpansion} style={{ width: '2%' }} />
          <Column
            body={idBodyTemplate}
            header="#"
            style={{ width: '3rem', minWidth: '3rem' }}
          />
          <Column
            dataType="date"
            header="Tarix"
            body={dateBodyTemplate}
            style={{ minWidth: '14rem' }}
            showFilterMenu={false}
            filter
            filterElement={dateFilterTemplate}
          />
          <Column
            field="client_name"
            header="Müştəri"
            style={{ minWidth: '12rem' }}
            filter
            filterElement={clientNameFilterTemplate}
            showFilterMenu={false}
            body={clientNameBodyTemplate}
          />
          {hasPermission('service.variable.select_phone') && (
            <Column
              field="client_phone"
              header="Telefon"
              style={{ minWidth: '12rem' }}
              filter
              filterElement={clientPhoneFilterTemplate}
              showFilterMenu={false}
              body={clientPhoneBodyTemplate}
            />
          )}
          <Column
            header="Mənbə"
            style={{ minWidth: '10rem' }}
            showFilterMenu={false}
            body={serviceTypeBodyTemplate}
          />
          <Column
            header="Qəbul edən"
            body={doctorBodyTemplate}
            style={{ minWidth: '12rem' }}
            filter={hasPermission('service.variable.user_id')}
            filterElement={doctorFilterTemplate}
            showFilterMenu={false}
          />
          <Column
            header="Məbləğ"
            body={priceBodyTemplate}
            style={{ minWidth: '8rem' }}
          />
        </DataTable>
      </div>

      {hasPermission('service.get_all.total_amount') && (
        <div className="total-info">
          <Message
            className="info-message"
            severity="info"
            content={totalContent}
          />
        </div>
      )}

      <Toast ref={toast} />
    </>
  );
};

export default ReportsTable;
