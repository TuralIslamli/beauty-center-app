import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Dropdown, DropdownChangeEvent } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Skeleton } from 'primereact/skeleton';
import { useDebounce } from 'primereact/hooks';

import api from '../../api';
import { IBooking, IBookingsData, IService, IServiceType } from '../../types';
import { bookingStatuses } from '../consts';
import { formatDate, formatPrice, formatPhone, haveFilterPermissions } from '@/app/utils';
import { TableHeader } from '../shared';
import CreateUpdateDialog from './CreateUpdateDialog';
import DeleteBookingDialog from './DeleteBookingDialoq';

interface BookingTableProps {
  userPermissions: string[];
}

const BookingTable: React.FC<BookingTableProps> = ({ userPermissions }) => {
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<{ id: number; name: string } | null>(null);
  const [booking, setBooking] = useState<IBooking>();
  
  // Dialogs
  const [isCreateDialogVisible, setIsCreateDialogVisible] = useState(false);
  const [isRejectDialogVisible, setIsRejectDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);
  
  // Filters
  const [filter, setFilter] = useState(false);
  const [clientName, debouncedClientName, setClientName] = useDebounce('', 400);
  const [clientPhone, debouncedClientPhone, setClientPhone] = useDebounce<number | null>(null, 400);
  const [serviceTypesFilter, setServiceTypesFilter] = useState<IServiceType[]>();
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
  
  // Other
  const [isLoading, setIsLoading] = useState(false);
  const [rejectComment, setRejectComment] = useState<string>();

  const toast = useRef<Toast>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

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

  const getBookings = useCallback(async (isOnPageChange = false) => {
    setIsLoading(true);
    try {
      const { data }: IBookingsData = await api.getBookings({
        status: filteredStatus?.id,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        client_name: debouncedClientName,
        client_phone: debouncedClientPhone,
      });

      setBookings(data);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setIsLoading(false);
      if (isOnPageChange) {
        navigationRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [filteredStatus?.id, dates, debouncedClientName, debouncedClientPhone]);

  useEffect(() => {
    if (dates[1]) {
      getBookings();
    }
  }, [filteredStatus?.name, dates, debouncedClientName, debouncedClientPhone, serviceTypesFilter?.length]);

  const handleEditBooking = useCallback((bookingData: IBooking) => {
    setBooking(bookingData);
    setIsCreateDialogVisible(true);
  }, []);

  const handleDeleteClick = useCallback((bookingData: IBooking) => {
    setBooking(bookingData);
    setIsDeleteDialogVisible(true);
  }, []);

  // Body Templates
  const idBodyTemplate = useCallback((rowData: IBooking, options: { rowIndex: number }) => (
    isLoading ? (
      <Skeleton width="20px" />
    ) : (
      <div>
        {!filteredStatus ? bookings.length - options.rowIndex : options.rowIndex + 1}
      </div>
    )
  ), [isLoading, filteredStatus, bookings.length]);

  const dateBodyTemplate = useCallback((rowData: IBooking) => (
    isLoading ? <Skeleton width="100px" /> : rowData.reservation_date.slice(0, -3)
  ), [isLoading]);

  const clientNameBodyTemplate = useCallback((rowData: IBooking) => (
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.client_name}</div>
  ), [isLoading]);

  const clientPhoneBodyTemplate = useCallback((rowData: IBooking) => (
    isLoading ? <Skeleton width="100px" /> : <div>{formatPhone(rowData.client_phone)}</div>
  ), [isLoading]);

  const doctorBodyTemplate = useCallback((rowData: IBooking) => (
    isLoading ? (
      <Skeleton width="150px" />
    ) : (
      rowData.doctor?.name && `${rowData.doctor.name} ${rowData.doctor.surname}`
    )
  ), [isLoading]);

  const serviceTypesBodyTemplate = useCallback((rowData: IService) => (
    isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <div>
        {rowData.service_types.map((i) => (
          <div key={i.id}>{i.name}</div>
        ))}
      </div>
    )
  ), [isLoading]);

  const priceBodyTemplate = useCallback((rowData: IBooking) => (
    isLoading ? <Skeleton width="100px" /> : formatPrice(rowData.advance_amount)
  ), [isLoading]);

  const getSeverity = useCallback((status?: string) => {
    switch (status) {
      case 'Ləğv': return 'danger';
      case 'Gəldi': return 'warning';
      case 'Qəbul edildi': return 'success';
      case 'Gözlənilir':
      case 'Online': return 'info';
      default: return undefined;
    }
  }, []);

  const statusBodyTemplate = useCallback((rowData: IBooking) => {
    const status = bookingStatuses.find((s) => s?.id === rowData.status)?.name;
    return isLoading ? (
      <Skeleton width="100px" />
    ) : (
      <Tag value={status} severity={getSeverity(status)} />
    );
  }, [isLoading, getSeverity]);

  const actionBodyTemplate = useCallback((rowData: IBooking) => (
    isLoading ? (
      <Skeleton width="60px" />
    ) : (
      <>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          className="btn-icon-right"
          onClick={() => handleEditBooking(rowData)}
        />
        {hasPermission('reservation.delete') && (
          <Button
            icon="pi pi-trash"
            rounded
            outlined
            text
            severity="danger"
            onClick={() => handleDeleteClick(rowData)}
          />
        )}
      </>
    )
  ), [isLoading, hasPermission, handleEditBooking, handleDeleteClick]);

  // Filter Templates
  const statusFilterTemplate = useCallback(() => (
    hasPermission('reservation.filter.status') ? (
      <Dropdown
        value={filteredStatus}
        options={[...bookingStatuses]}
        onChange={(e: DropdownChangeEvent) => setFilteredStatus(e.value)}
        itemTemplate={(option) => <Tag value={option.name} severity={getSeverity(option.name)} />}
        placeholder="Status"
        className="p-column-filter"
        showClear
        style={{ minWidth: '10rem' }}
        optionLabel="name"
      />
    ) : null
  ), [hasPermission, filteredStatus, getSeverity]);

  const dateFilterTemplate = useCallback(() => (
    hasPermission('reservation.filter.date') ? (
      <Calendar
        minDate={hasPermission('reservation.get_past_data') ? undefined : new Date()}
        value={dates}
        onChange={(e) => setDates(e.value as Date[])}
        selectionMode="range"
        readOnlyInput
        hideOnRangeSelection
        className="filter-calendar"
        dateFormat="dd/mm/yy"
      />
    ) : null
  ), [hasPermission, dates]);

  const clientNameFilterTemplate = useCallback(() => (
    hasPermission('reservation.filter.client_name') ? (
      <InputText
        placeholder="Ad ilə axtarış"
        className="filter-input"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
      />
    ) : null
  ), [hasPermission, clientName, setClientName]);

  const clientPhoneFilterTemplate = useCallback(() => (
    hasPermission('reservation.filter.client_phone') ? (
      <InputNumber
        className="input-phone-filter"
        id="client_phone"
        placeholder="+994 99 999-99-99"
        value={clientPhone}
        onChange={(e) => setClientPhone(e.value)}
        prefix="+"
        useGrouping={false}
      />
    ) : null
  ), [hasPermission, clientPhone, setClientPhone]);

  const headerContent = useMemo(() => (
    <TableHeader
      onFilterToggle={haveFilterPermissions(userPermissions) ? () => setFilter((prev) => !prev) : undefined}
      onRefresh={() => getBookings()}
      rightContent={
        <Button
          label="Əlavə et"
          icon="pi pi-plus"
          onClick={() => setIsCreateDialogVisible(true)}
        />
      }
    />
  ), [userPermissions, getBookings]);

  return (
    <>
      <div className="table-responsive">
        <DataTable
          value={bookings}
          dataKey="id"
          header={headerContent}
          tableStyle={{ minWidth: '50rem' }}
          className="table-container"
          filterDisplay={filter ? 'row' : undefined}
          paginator
          rows={10}
        >
        <Column body={idBodyTemplate} header="#" style={{ width: '2%' }} />
        <Column
          dataType="date"
          header="Tarix"
          body={dateBodyTemplate}
          style={{ width: '10%' }}
          showFilterMenu={false}
          filter
          filterElement={dateFilterTemplate}
        />
        <Column
          field="client_name"
          header="Müştəri"
          style={{ width: '10%' }}
          filter
          filterElement={clientNameFilterTemplate}
          showFilterMenu={false}
          body={clientNameBodyTemplate}
        />
        <Column
          field="client_phone"
          header="Telefon"
          style={{ width: '10%' }}
          filter
          filterElement={clientPhoneFilterTemplate}
          showFilterMenu={false}
          body={clientPhoneBodyTemplate}
        />
        <Column
          header="Status"
          body={statusBodyTemplate}
          style={{ width: '10%' }}
          showFilterMenu={false}
          filter
          filterElement={statusFilterTemplate}
        />
        <Column
          header="Xidmət"
          style={{ width: '10%' }}
          showFilterMenu={false}
          body={serviceTypesBodyTemplate}
        />
        <Column
          header="Həkim"
          body={doctorBodyTemplate}
          style={{ width: '10%' }}
          showFilterMenu={false}
        />
        <Column header="Depozit" body={priceBodyTemplate} style={{ width: '10%' }} />
        {hasPermission('reservation.update') && (
          <Column body={actionBodyTemplate} exportable={false} style={{ width: '10%' }} />
        )}
        </DataTable>
      </div>

      <Toast ref={toast} />

      <CreateUpdateDialog
        userPermissions={userPermissions}
        visible={isCreateDialogVisible}
        onHide={() => {
          setIsCreateDialogVisible(false);
          setBooking(undefined);
        }}
        onSuccess={showSuccess}
        booking={booking}
        setBooking={setBooking}
        getBookings={getBookings}
      />

      <Dialog
        header="Reject comment"
        visible={isRejectDialogVisible}
        style={{ width: '50vw' }}
        onHide={() => {
          setIsRejectDialogVisible(false);
          setRejectComment('');
        }}
      >
        <p className="m-0">{rejectComment}</p>
      </Dialog>

      <DeleteBookingDialog
        booking={booking}
        visible={isDeleteDialogVisible}
        onHide={() => setIsDeleteDialogVisible(false)}
        onSuccess={showSuccess}
        getBookings={getBookings}
      />
    </>
  );
};

export default BookingTable;
