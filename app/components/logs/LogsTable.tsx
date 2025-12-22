import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Skeleton } from 'primereact/skeleton';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { JSONTree } from 'react-json-tree';

import api from '../../api';
import { ILog, ILogsData, IService } from '../../types';
import { formatDate, formatPrice } from '@/app/utils';
import { TableHeader } from '../shared';

interface LogsTableProps {
  userPermissions: string[];
}

const LogsTable: React.FC<LogsTableProps> = ({ userPermissions }) => {
  const [logs, setLogs] = useState<ILog[]>();
  const [selectedLog, setSelectedLog] = useState<ILog>();
  const [isLoading, setIsLoading] = useState(false);
  const [isInfoDialogVisible, setIsInfoDialogVisible] = useState(false);
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
  const [total, setTotal] = useState(0);
  const [first, setFirst] = useState(0);

  const getLogs = useCallback(async (page = 1) => {
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
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dates]);

  useEffect(() => {
    if (dates[1]) {
      getLogs();
    }
  }, [getLogs]);

  const handlePageChange = useCallback((event: PaginatorPageChangeEvent) => {
    setFirst(event.first);
    getLogs(event.page + 1);
  }, [getLogs]);

  const handleInfoClick = useCallback((log: ILog) => {
    setSelectedLog(log);
    setIsInfoDialogVisible(true);
  }, []);

  // Body Templates
  const idBodyTemplate = useCallback((rowData: IService, options: { rowIndex: number }) => (
    isLoading ? <Skeleton width="20px" /> : <div>{total - options.rowIndex - first}</div>
  ), [isLoading, total, first]);

  const dateBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? <Skeleton width="100px" /> : rowData.service.created_at.slice(0, -3)
  ), [isLoading]);

  const clientNameBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.service.client_name}</div>
  ), [isLoading]);

  const doctorBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      `${rowData.service?.user?.name} ${rowData.service?.user?.surname}`
    )
  ), [isLoading]);

  const causerBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      `${rowData.price_difference.causer?.name} ${rowData.price_difference?.causer?.surname}`
    )
  ), [isLoading]);

  const serviceTypesBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <div>
        {rowData.service.service_types.map((i) => (
          <div key={i.id}>{i.name}</div>
        ))}
      </div>
    )
  ), [isLoading]);

  const factualPriceBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      formatPrice(rowData.price_difference?.service_types_price_sum)
    )
  ), [isLoading]);

  const resultPriceBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      formatPrice(rowData.price_difference?.service_price_sum)
    )
  ), [isLoading]);

  const advanceAmountBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? <Skeleton width="100px" /> : formatPrice(rowData.service?.advance_amount)
  ), [isLoading]);

  const actionBodyTemplate = useCallback((rowData: ILog) => (
    isLoading ? (
      <Skeleton width="60px" />
    ) : (
      <Button
        icon="pi pi-question"
        rounded
        text
        severity="secondary"
        onClick={() => handleInfoClick(rowData)}
      />
    )
  ), [isLoading, handleInfoClick]);

  const headerContent = useMemo(() => (
    <TableHeader
      leftContent={
        <Calendar
          value={dates}
          onChange={(e) => setDates(e.value as Date[])}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          className="filter-calendar"
          dateFormat="dd/mm/yy"
        />
      }
    />
  ), [dates]);

  return (
    <>
      <DataTable
        value={logs}
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        className="table-container"
        header={headerContent}
      >
        <Column body={idBodyTemplate} header="#" style={{ width: '2%' }} />
        <Column dataType="date" header="Tarix" body={dateBodyTemplate} style={{ width: '10%' }} />
        <Column field="client_name" header="Müştəri" body={clientNameBodyTemplate} style={{ width: '10%' }} />
        <Column header="Xidmət" body={serviceTypesBodyTemplate} style={{ width: '10%' }} />
        <Column header="Doktor" body={doctorBodyTemplate} style={{ width: '10%' }} />
        <Column header="Səbəbkar" body={causerBodyTemplate} style={{ width: '10%' }} />
        <Column header="Faktiki məbləğ" body={factualPriceBodyTemplate} style={{ width: '10%' }} />
        <Column header="Alınan məbləğ" body={resultPriceBodyTemplate} style={{ width: '10%' }} />
        <Column header="Depozit" body={advanceAmountBodyTemplate} style={{ width: '10%' }} />
        <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }} />
      </DataTable>

      <Paginator
        first={first}
        rows={10}
        totalRecords={total}
        onPageChange={handlePageChange}
      />

      <Dialog
        header="Activity logs"
        visible={isInfoDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => setIsInfoDialogVisible(false)}
      >
        <div className="m-0">
          <JSONTree data={selectedLog?.activity_logs} />
        </div>
      </Dialog>
    </>
  );
};

export default LogsTable;
