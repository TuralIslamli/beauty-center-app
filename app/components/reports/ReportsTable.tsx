import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { IReport, IReportsData, IRole, ITotalAmount } from '../../types';
import api from '../../api';
import React from 'react';
import { Calendar } from 'primereact/calendar';
import { formatDate, haveFilterPermissions } from '@/app/utils';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';

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
  const toast = useRef<Toast>(null);

  const getReports = async (isOnPageChange?: boolean) => {
    setIsLoading(true);
    try {
      const { data }: IReportsData = await api.getReports({
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
      });

      setReports(data);
      if (userPermissions.includes('service.advance.info')) {
        const total: ITotalAmount = await api.getTotalAmount({
          from_date: formatDate(dates[0]),
          to_date: formatDate(dates[1]),
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
  }, [dates[1]]);

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

  const clientPhoneBody = (rowData: IReport) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_phone}</div>;

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

  const content = (
    <div>
      <div className="ml-2">Depozit: {totalAmount?.advance} AZN</div>
      <div className="ml-2">Xidmətlər: {totalAmount?.amount} AZN</div>
      <div className="ml-2">Toplam: {totalAmount?.total} AZN</div>
    </div>
  );

  const idBodyTemplate = (rowData: IReport, options: any) =>
    isLoading ? <Skeleton width="20px" /> : <div>{options?.rowIndex + 1}</div>;

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
      >
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
          showFilterMenu={false}
          body={clientNameBody}
        ></Column>
        {userPermissions.includes('service.variable.select_phone') && (
          <Column
            field="client_phone"
            header="Telefon"
            style={{ width: '10%' }}
            showFilterMenu={false}
            body={clientPhoneBody}
          ></Column>
        )}
        <Column
          header="Mənbə"
          style={{ width: '10%' }}
          showFilterMenu={false}
        ></Column>
        <Column
          header="Qəbul edən"
          body={getDoctorFullName}
          style={{ width: '10%' }}
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
