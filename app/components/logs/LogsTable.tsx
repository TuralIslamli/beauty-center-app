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

interface ILogsTableProps {
  userPermissions: string[];
}

function LogsTable({ userPermissions }: ILogsTableProps) {
  const [logs, setLogs] = useState<ILog[]>();
  const [selectedLog, setSelectedLog] = useState<ILog>();
  const [isLoading, setIsLoading] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);

  const getLogs = async () => {
    setIsLoading(true);
    try {
      const { data }: ILogsData = await api.getLogs();
      setLogs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getLogs();
  }, []);

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

  const idBodyTemplate = (rowData: IService, options: any) =>
    isLoading ? <Skeleton width="20px" /> : <div>{options.rowIndex + 1}</div>;
  return (
    <>
      <DataTable
        value={logs}
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        style={{ marginBottom: '10px' }}
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
