import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { IExpense, IExpensesData } from '@/app/types';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import AddDialog from './AddDialog';
import DeleteDialog from './DeleteDialog';
import { formatDate } from '@/app/utils';
import { Skeleton } from 'primereact/skeleton';
import { Calendar } from 'primereact/calendar';
import { Message } from 'primereact/message';

interface IBookingTimeProps {
  userPermissions: string[];
}

function ExpensesTable({ userPermissions }: IBookingTimeProps) {
  const [expense, setExpense] = useState<IExpense>();
  const [deleteDialog, setDeleteDiaolog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [rows, setRows] = useState<number>(10);
  const [dialog, setDialog] = useState(false);
  const toast = useRef<Toast>(null);
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
  const [filter, setFilter] = useState(false);
  const [totalAmount, setTotalAmount] = useState<string>('0');
  const [first, setFirst] = useState(0);

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
    setFirst(event.first);
  };

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data, meta }: IExpensesData = await api.getExpenses({
        page,
        size: rows,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
      });
      const { amount }: any = await api.getExpensesTotal({
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
      });
      setTotalAmount(amount);
      setExpenses(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dates[1]) {
      fetchData();
    }
  }, [dates[1]]);

  const confirmDeleteServiceType = (expense: IExpense) => {
    setExpense(expense);
    setDeleteDiaolog(true);
  };

  const editExpense = (user: IExpense) => {
    setExpense(user);
    setDialog(true);
  };

  const content = <div>{totalAmount} AZN</div>;

  const header = userPermissions?.includes('expense.create') && (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <Button
          type="button"
          icon="pi pi-filter-slash"
          label="Filter"
          onClick={() => setFilter((prev) => !prev)}
          style={{ marginRight: '20px' }}
        />

        <Button
          icon="pi pi-refresh"
          rounded
          raised
          onClick={() => fetchData()}
        />
      </div>
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
      <Button
        label="Əlavə et"
        icon="pi pi-plus"
        onClick={() => setDialog(true)}
      />
    </div>
  );

  const actionBodyTemplate = (rowData: IExpense) => {
    return (
      <React.Fragment>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          style={{ marginRight: '10px' }}
          onClick={() => editExpense(rowData)}
        />

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

  const dateBodyTemplate = (rowData: IExpense) =>
    isLoading ? <Skeleton width="100px" /> : rowData.created_at?.slice(0, -3);

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

  const nameBody = (rowData: IExpense) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.name}</div>;

  const descriptionBody = (rowData: IExpense) =>
    isLoading ? <Skeleton width="100px" /> : <div>{rowData.description}</div>;

  const priceBodyTemplate = (rowData: IExpense) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(+rowData.amount);
    const currencySymbol =
      parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
    const formattedPrice = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('');

    return `${formattedPrice} ${currencySymbol}`;
  };

  return (
    <div>
      <DataTable
        value={expenses}
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        header={header}
        style={{ marginBottom: '10px' }}
        filterDisplay={filter ? 'row' : undefined}
      >
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
          header="Ad"
          style={{ width: '10%' }}
          showFilterMenu={false}
          body={nameBody}
        ></Column>
        <Column
          header="Izah"
          style={{ width: '10%' }}
          showFilterMenu={false}
          body={descriptionBody}
        ></Column>
        <Column
          field="price"
          header="Məbləğ"
          body={priceBodyTemplate}
          style={{ width: '10%' }}
        ></Column>
        {userPermissions?.includes('expense.delete') && (
          <Column
            body={actionBodyTemplate}
            exportable={false}
            style={{ width: '10%' }}
          ></Column>
        )}
      </DataTable>
      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={onPageChange}
      />
      <Toast ref={toast} />
      <AddDialog
        expense={expense}
        dialog={dialog}
        setDialog={setDialog}
        showSuccess={showSuccess}
        getExpenses={fetchData}
      />
      <DeleteDialog
        expense={expense}
        deleteDialog={deleteDialog}
        setDeleteDialog={setDeleteDiaolog}
        setExpenses={setExpenses}
        showSuccess={showSuccess}
      />
    </div>
  );
}

export default ExpensesTable;
