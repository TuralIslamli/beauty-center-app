import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { IBookingTime, IBookingTimeData } from '@/app/types';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { DataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column, ColumnEditorOptions } from 'primereact/column';
import {
  InputNumber,
  InputNumberValueChangeEvent,
} from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import AddDialog from './AddDialog';
import DeleteDialog from './DeleteDialog';
import { InputMask, InputMaskChangeEvent } from 'primereact/inputmask';

interface IBookingTimeProps {
  userPermissions?: string[];
}

function BookingTimes({ userPermissions }: IBookingTimeProps) {
  const [bookingTime, setBookingTime] = useState<IBookingTime>();
  const [deleteDialog, setDeleteDiaolog] = useState(false);
  const [bookingTimes, setBookingTimes] = useState<IBookingTime[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [dialog, setDialog] = useState(false);
  const toast = useRef<Toast>(null);

  const showSuccess = (message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  };

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    fetchData(event.page + 1);
  };

  const onRowEditComplete = ({ newData }: DataTableRowEditCompleteEvent) => {
    let { id, time, reservation_count } = newData;
    reservation_count = reservation_count || 0;
    try {
      api.updateBookingTime({ id, time, reservation_count });
      const updatedBookingTime = {
        ...newData,
        time,
        reservation_count,
        id,
      };

      const updatedBookingTimes = bookingTimes.map((bookingTime) =>
        bookingTime.id === updatedBookingTime.id
          ? updatedBookingTime
          : bookingTime
      );
      setBookingTimes(updatedBookingTimes);

      showSuccess('Rezerv saatı yeniləndi');
    } catch (error) {
      console.error(error);
    }
  };

  const priceEditor = (options: ColumnEditorOptions) => {
    return (
      <InputNumber
        value={options.value}
        onValueChange={(e: InputNumberValueChangeEvent) =>
          options.editorCallback!(e.value)
        }
      />
    );
  };

  const textEditor = (options: ColumnEditorOptions) => {
    return (
      <InputMask
        mask="99:99"
        value={options.value}
        onChange={(event: InputMaskChangeEvent) =>
          options.editorCallback!(event.target.value)
        }
      />
    );
  };

  const allowEdit = (rowData: IBookingTime) => {
    return rowData?.time !== 'Blue Band';
  };

  const fetchData = async (page = 1) => {
    try {
      const { data, meta }: IBookingTimeData = await api.getBookingTimes({
        page,
        size: rows,
      });

      setBookingTimes(
        data?.sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          if (timeA[0] !== timeB[0]) {
            return timeA[0] - timeB[0];
          }
          return timeA[1] - timeB[1];
        })
      );
      setTotal(meta?.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmDeleteServiceType = (bookingTime: IBookingTime) => {
    setBookingTime(bookingTime);
    setDeleteDiaolog(true);
  };

  const header = userPermissions?.includes('reservation_time.create') && (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button
        label="Əlavə et"
        icon="pi pi-plus"
        onClick={() => setDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: IBookingTime) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => confirmDeleteServiceType(rowData)}
        />
      </React.Fragment>
    );
  };

  return (
    <div>
      <DataTable
        value={bookingTimes}
        editMode="row"
        dataKey="id"
        onRowEditComplete={onRowEditComplete}
        tableStyle={{ minWidth: '50rem' }}
        header={header}
        style={{ marginBottom: '10px' }}
      >
        <Column
          field="time"
          header="Saat"
          editor={(options) => textEditor(options)}
          style={{ width: '40%' }}
        ></Column>
        <Column
          field="reservation_count"
          header="Limit"
          // body={priceBodyTemplate}
          editor={(options) => priceEditor(options)}
          style={{ width: '40%' }}
        ></Column>
        {userPermissions?.includes('reservation_time.update') && (
          <Column
            rowEditor={allowEdit}
            headerStyle={{ width: '10%' }}
            bodyStyle={{ textAlign: 'center' }}
          ></Column>
        )}
        {userPermissions?.includes('reservation_time.delete') && (
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: '1%' }}
          ></Column>
        )}
      </DataTable>
      <Paginator rows={rows} totalRecords={total} onPageChange={onPageChange} />
      <Toast ref={toast} />
      <AddDialog
        dialog={dialog}
        setDialog={setDialog}
        showSuccess={showSuccess}
        setBookingTimes={setBookingTimes}
      />
      <DeleteDialog
        bookingTime={bookingTime}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDiaolog}
        setBookingTimes={setBookingTimes}
        showSuccess={showSuccess}
      />
    </div>
  );
}

export default BookingTimes;
