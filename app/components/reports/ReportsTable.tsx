import { useEffect, useRef, useState } from 'react';
import {
  DataTable,
  DataTableExpandedRows,
  DataTableValueArray,
} from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import {
  IAmountChangeHistory,
  IDoctor,
  IDoctorRS,
  IReport,
  IReportsData,
  IRole,
  ITotalAmount,
} from '../../types';
import api from '../../api';
import React from 'react';
import { Calendar } from 'primereact/calendar';
import { formatDate, haveFilterPermissions } from '@/app/utils';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { useDebounce } from 'primereact/hooks';

interface IServicesTableProps {
  userPermissions: string[];
  role: IRole;
}

function ReportsTable({ userPermissions, role }: IServicesTableProps) {
  const [reports, setReports] = useState<IReport[]>([]);
  const [filter, setFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState<ITotalAmount>();
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
  const [expandedRows, setExpandedRows] = useState<
    DataTableExpandedRows | DataTableValueArray | undefined
  >(undefined);
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce<
    number | null
  >(null, 400);
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [doctor, setDoctor] = useState<IDoctor>();

  const toast = useRef<Toast>(null);

  const getReports = async (isOnPageChange?: boolean) => {
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
      if (userPermissions.includes('service.advance.info')) {
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
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dates[1]) {
      getReports();
    }
  }, [dates[1], debouncedClientName, debouncedClientPhone, doctor]);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (userPermissions.includes('user.input_search')) {
        const { data: doctorsData }: IDoctorRS = await api.getDoctors();
        setDoctors(doctorsData);
      }
    };
    fetchDoctors();
  }, []);

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        {haveFilterPermissions(userPermissions) && (
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Filter"
            onClick={() => setFilter((prev) => !prev)}
            style={{ marginRight: '20px' }}
          />
        )}

        <Button
          icon="pi pi-refresh"
          rounded
          raised
          onClick={() => getReports()}
        />
      </div>
    </div>
  );

  const dateBodyTemplate = (rowData: IReport) =>
    isLoading ? <Skeleton width="100px" /> : rowData.date_time.slice(0, -3);

  const getDoctorFullName = (rowData: IReport) =>
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      `${rowData.user?.name} ${rowData.user?.surname}`
    );

  const clientNameBody = (rowData: IReport) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_name}</div>;

  const formatPhone = (phone?: string | null) => {
    if (!phone) return '';
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  const clientPhoneBody = (rowData: IReport) =>
    isLoading ? <Skeleton width="100px" /> : <div>{formatPhone(rowData.client_phone)}</div>;

  const priceBodyTemplate = (rowData: IReport) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(+rowData?.amount);
    const currencySymbol =
      parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
    const formattedPrice = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('');

    return isLoading ? (
      <Skeleton width="100px" />
    ) : (
      `${formattedPrice} ${currencySymbol}`
    );
  };

  const dateRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.date') && (
        <Calendar
          value={dates}
          onChange={(e) => setDates(e.value)}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          style={{ width: '220px' }}
          dateFormat="dd/mm/yy"
        />
      )
    );
  };

  const clientRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.client_name') && (
        <InputText
          placeholder="Ad ilə axtarış"
          style={{ width: '160px' }}
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
      )
    );
  };

  const phoneRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.client_phone') && (
        <InputNumber
          style={{ width: '180px' }}
          id="client_phone"
          placeholder="+994 99 999-99-99"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.value)}
          prefix="+"
          useGrouping={false}
        />
      )
    );
  };

  const doctorsRowFilterTemplate = () => {
    return (
      userPermissions.includes('service.filter.doctor') && (
        <Dropdown
          filter
          value={doctor}
          onChange={(e) => {
            setDoctor(e.value);
          }}
          options={doctors}
          placeholder="Həkim seçin"
          optionLabel="full_name"
          showClear
        />
      )
    );
  };

  const content = (
    <div>
      <div className="ml-2">Depozit: {totalAmount?.advance} AZN</div>
      <div className="ml-2">Xidmətlər: {totalAmount?.amount} AZN</div>
      <div className="ml-2">Toplam: {totalAmount?.total} AZN</div>
    </div>
  );

  const idBodyTemplate = (rowData: IReport, options: any) =>
    isLoading ? <Skeleton width="20px" /> : <div>{options?.rowIndex + 1}</div>;

  const serviceTypeBody = (rowData: IReport) =>
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <div>{rowData.service_type === 'service' ? 'xidmət' : 'depozit'}</div>
    );

  const allowExpansion = (rowData: IReport) => {
    return rowData.amount_change_history!.length > 1;
  };

  const dateRowTemplate = (rowData: IAmountChangeHistory) =>
    isLoading ? <Skeleton width="100px" /> : rowData.created_at.slice(0, -3);

  const getDoctorRowFullName = (rowData: IAmountChangeHistory) =>
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      `${rowData.causer?.name} ${rowData.causer?.surname}`
    );

  const rowExpansionTemplate = (data: IReport) => {
    return (
      <div className="p-3">
        <DataTable value={data.amount_change_history}>
          <Column field="date" header="Tarix" body={dateRowTemplate}></Column>
          <Column
            field="amount"
            header="Məbləğ"
            body={priceBodyTemplate}
          >
          </Column>
          <Column
            field="status"
            header="Qəbul edən"
            body={getDoctorRowFullName}
          ></Column>
        </DataTable>
      </div>
    );
  };

  return (
    <>
      <DataTable
        value={reports}
        dataKey="id"
        header={header}
        tableStyle={{ minWidth: '50rem' }}
        style={{ marginBottom: '10px' }}
        filterDisplay={filter ? 'row' : undefined}
        paginator
        rows={10}
        expandedRows={expandedRows}
        onRowToggle={(e) => {
          setExpandedRows(e.data);
        }}
        rowExpansionTemplate={rowExpansionTemplate}
      >
        <Column expander={allowExpansion} style={{ width: '2%' }} />
        <Column
          body={idBodyTemplate}
          header="#"
          style={{ width: '2%' }}
        ></Column>
        <Column
          dataType="date"
          header="Tarix"
          body={dateBodyTemplate}
          style={{ width: '10%' }}
          showFilterMenu={false}
          filter
          filterElement={dateRowFilterTemplate}
        ></Column>
        <Column
          field="client_name"
          header="Müştəri"
          style={{ width: '10%' }}
          filter
          filterElement={clientRowFilterTemplate}
          showFilterMenu={false}
          body={clientNameBody}
        ></Column>
        {userPermissions.includes('service.variable.select_phone') && (
          <Column
            field="client_phone"
            header="Telefon"
            style={{ width: '10%' }}
            filter
            filterElement={phoneRowFilterTemplate}
            showFilterMenu={false}
            body={clientPhoneBody}
          ></Column>
        )}
        <Column
          header="Mənbə"
          style={{ width: '10%' }}
          showFilterMenu={false}
          body={serviceTypeBody}
        ></Column>
        <Column
          header="Qəbul edən"
          body={getDoctorFullName}
          style={{ width: '10%' }}
          filter={userPermissions.includes('service.variable.user_id')}
          filterElement={doctorsRowFilterTemplate}
          showFilterMenu={false}
        ></Column>
        <Column
          header="Məbləğ"
          body={priceBodyTemplate}
          style={{ width: '10%' }}
        ></Column>
      </DataTable>
      {userPermissions.includes('service.get_all.total_amount') && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Message
            style={{
              border: 'solid #696cff',
              borderWidth: '0 0 0 6px',
              marginTop: '20px',
              marginRight: '20px',
            }}
            severity="info"
            content={content}
          />
        </div>
      )}

      <Toast ref={toast} />
    </>
  );
}

export default ReportsTable;
