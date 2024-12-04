import { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ILog, ILogsData, IService } from '../../types';
import api from '../../api';
import React from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { JSONTree } from 'react-json-tree';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { formatDate } from '@/app/utils';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';

interface ILogsTableProps {
  userPermissions: string[];
}

function LogsTable({ userPermissions }: ILogsTableProps) {
  const [logs, setLogs] = useState<ILog[]>();
  const [selectedLog, setSelectedLog] = useState<ILog>();
  const [isLoading, setIsLoading] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
  const [total, setTotal] = useState(0);
  const [first, setFirst] = useState(1);

  const getLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data, meta }: ILogsData = await api.getLogs({
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        page,
      });
      setLogs(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dates[1]) {
      getLogs();
    }
  }, [dates[1]]);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    setFirst(event.first);
    getLogs(event.page + 1);
  };

  const dateBodyTemplate = (rowData: ILog) =>
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      rowData.service.created_at.slice(0, -3)
    );

  const getDoctorFullName = (rowData: ILog) =>
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      `${rowData.price_difference.causer?.name} ${rowData.price_difference?.causer?.surname}`
    );

  const clientNameBody = (rowData: ILog) => {
    return isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <div>{rowData.service.client_name}</div>
    );
  };

  const priceBodyTemplate = (rowData: ILog) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(
      +rowData?.price_difference?.service_types_price_sum
    );
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

  const resultPriceBodyTemplate = (rowData: ILog) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(
      +rowData?.price_difference?.service_price_sum
    );
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

  const serviceTypesBody = (rowData: ILog) =>
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <div>
        {rowData.service.service_types.map((i) => (
          <div key={i.id}>{i.name}</div>
        ))}
      </div>
    );

  const actionBodyTemplate = (rowData: ILog) =>
    isLoading ? (
      <Skeleton width="60px" />
    ) : (
      <React.Fragment>
        <Button
          icon="pi pi-question"
          rounded
          text
          severity="secondary"
          style={{ marginRight: '10px' }}
          onClick={() => {
            setSelectedLog(rowData);
            setInfoDialog(true);
          }}
        />
      </React.Fragment>
    );

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <Calendar
          value={dates}
          onChange={(e) => setDates(e.value)}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          style={{ width: '220px', marginRight: '10px' }}
          dateFormat="dd/mm/yy"
        />
      </div>
    </div>
  );

  const idBodyTemplate = (rowData: IService, options: any) =>
    isLoading ? (
      <Skeleton width="20px" />
    ) : (
      <div>{total - options.rowIndex - first}</div>
    );
  return (
    <>
      <DataTable
        value={logs}
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        style={{ marginBottom: '10px' }}
        header={header}
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
        ></Column>
        <Column
          field="client_name"
          header="Müştəri"
          style={{ width: '10%' }}
          body={clientNameBody}
        ></Column>
        <Column
          header="Xidmət"
          style={{ width: '10%' }}
          body={serviceTypesBody}
        ></Column>
        <Column
          header="Səbəbkar"
          body={getDoctorFullName}
          style={{ width: '10%' }}
        ></Column>
        <Column
          header="Faktiki məbləğ"
          body={priceBodyTemplate}
          style={{ width: '10%' }}
        ></Column>
        <Column
          header="Alınan məbləğ"
          body={resultPriceBodyTemplate}
          style={{ width: '10%' }}
        ></Column>
        <Column
          body={actionBodyTemplate}
          exportable={false}
          style={{ width: '10%' }}
        ></Column>
      </DataTable>
      <Paginator
        first={first}
        rows={10}
        totalRecords={total}
        onPageChange={onPageChange}
      />
      <Dialog
        header="Activity logs"
        visible={infoDialog}
        style={{ width: '50vw' }}
        onHide={() => setInfoDialog(false)}
      >
        <p className="m-0">
          <JSONTree data={selectedLog?.activity_logs} />
        </p>
      </Dialog>
    </>
  );
}

export default LogsTable;
