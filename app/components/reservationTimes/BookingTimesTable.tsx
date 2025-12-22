import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { DataTable, DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column, ColumnEditorOptions } from 'primereact/column';
import { InputNumber, InputNumberValueChangeEvent } from 'primereact/inputnumber';
import { InputMask, InputMaskChangeEvent } from 'primereact/inputmask';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import api from '../../api';
import { IBookingTime, IBookingTimeData } from '@/app/types';
import { TableHeader } from '../shared';
import AddDialog from './AddDialog';
import DeleteDialog from './DeleteDialog';

interface BookingTimesTableProps {
  userPermissions?: string[];
}

const BookingTimesTable: React.FC<BookingTimesTableProps> = ({ userPermissions = [] }) => {
  const [bookingTime, setBookingTime] = useState<IBookingTime>();
  const [bookingTimes, setBookingTimes] = useState<IBookingTime[]>([]);
  const [total, setTotal] = useState(0);
  const [rows] = useState(10);
  const [first, setFirst] = useState(0);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

  const toast = useRef<Toast>(null);

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions]
  );

  const showSuccess = useCallback((message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }, []);

  const sortTimes = useCallback((times: IBookingTime[]) => {
    return times?.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      if (timeA[0] !== timeB[0]) {
        return timeA[0] - timeB[0];
      }
      return timeA[1] - timeB[1];
    });
  }, []);

  const fetchData = useCallback(async (page = 1) => {
    try {
      const { data, meta }: IBookingTimeData = await api.getBookingTimes({
        page,
        size: rows,
      });
      setBookingTimes(sortTimes(data));
      setTotal(meta?.total);
    } catch (error) {
      console.error('Failed to fetch booking times:', error);
    }
  }, [rows, sortTimes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((event: PaginatorPageChangeEvent) => {
    setFirst(event.first);
    fetchData(event.page + 1);
  }, [fetchData]);

  const handleRowEditComplete = useCallback(async ({ newData }: DataTableRowEditCompleteEvent) => {
    const { id, time, reservation_count = 0 } = newData;

    try {
      await api.updateBookingTime({ id, time, reservation_count });
      
      setBookingTimes((prev) =>
        prev.map((item) =>
          item.id === id ? { ...newData, time, reservation_count, id } : item
        )
      );

      showSuccess('Rezerv saatı uğurla yeniləndi');
    } catch (error) {
      console.error('Failed to update booking time:', error);
    }
  }, [showSuccess]);

  const handleDeleteClick = useCallback((time: IBookingTime) => {
    setBookingTime(time);
    setIsDeleteDialogVisible(true);
  }, []);

  // Editor Components
  const timeEditor = useCallback((options: ColumnEditorOptions) => (
    <InputMask
      mask="99:99"
      value={options.value}
      onChange={(event: InputMaskChangeEvent) => options.editorCallback!(event.target.value)}
    />
  ), []);

  const countEditor = useCallback((options: ColumnEditorOptions) => (
    <InputNumber
      value={options.value}
      onValueChange={(e: InputNumberValueChangeEvent) => options.editorCallback!(e.value)}
    />
  ), []);

  const allowEdit = useCallback((rowData: IBookingTime) => rowData?.time !== 'Blue Band', []);

  const actionBodyTemplate = useCallback((rowData: IBookingTime) => (
    <Button
      icon="pi pi-trash"
      rounded
      text
      severity="danger"
      onClick={() => handleDeleteClick(rowData)}
    />
  ), [handleDeleteClick]);

  const headerContent = hasPermission('reservation_time.create') ? (
    <TableHeader
      rightContent={
        <Button
          label="Əlavə et"
          icon="pi pi-plus"
          onClick={() => setIsAddDialogVisible(true)}
        />
      }
    />
  ) : null;

  return (
    <div>
      <DataTable
        value={bookingTimes}
        editMode="row"
        dataKey="id"
        onRowEditComplete={handleRowEditComplete}
        tableStyle={{ minWidth: '50rem' }}
        header={headerContent}
        className="table-container"
      >
        <Column
          field="time"
          header="Saat"
          editor={timeEditor}
          style={{ width: '40%' }}
        />
        <Column
          field="reservation_count"
          header="Limit"
          editor={countEditor}
          style={{ width: '40%' }}
        />
        {hasPermission('reservation_time.update') && (
          <Column
            rowEditor={allowEdit}
            headerStyle={{ width: '10%' }}
            bodyStyle={{ textAlign: 'center' }}
          />
        )}
        {hasPermission('reservation_time.delete') && (
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: '1%' }}
          />
        )}
      </DataTable>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={handlePageChange}
      />

      <Toast ref={toast} />

      <AddDialog
        visible={isAddDialogVisible}
        onHide={() => setIsAddDialogVisible(false)}
        onSuccess={showSuccess}
        setBookingTimes={setBookingTimes}
      />

      <DeleteDialog
        bookingTime={bookingTime}
        visible={isDeleteDialogVisible}
        onHide={() => setIsDeleteDialogVisible(false)}
        setBookingTimes={setBookingTimes}
        onSuccess={showSuccess}
      />
    </div>
  );
};

export default BookingTimesTable;
