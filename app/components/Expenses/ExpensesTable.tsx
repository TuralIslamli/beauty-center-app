import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { Skeleton } from 'primereact/skeleton';
import { Message } from 'primereact/message';

import api from '../../api';
import { IExpense, IExpensesData } from '@/app/types';
import { formatDate, formatPrice, haveFilterPermissions } from '@/app/utils';
import { TableHeader } from '../shared';
import AddDialog from './AddDialog';
import DeleteDialog from './DeleteDialog';

interface ExpensesTableProps {
  userPermissions: string[];
}

const ExpensesTable: React.FC<ExpensesTableProps> = ({ userPermissions }) => {
  const [expense, setExpense] = useState<IExpense>();
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [total, setTotal] = useState(0);
  const [rows] = useState(10);
  const [first, setFirst] = useState(0);
  const [filter, setFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState('0');
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
  const [isAddDialogVisible, setIsAddDialogVisible] = useState(false);
  const [isDeleteDialogVisible, setIsDeleteDialogVisible] = useState(false);

  const toast = useRef<Toast>(null);

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions],
  );

  const showSuccess = useCallback((message: string) => {
    toast.current?.show({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000,
    });
  }, []);

  const fetchData = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const { data, meta }: IExpensesData = await api.getExpenses({
          page,
          size: rows,
          from_date: formatDate(dates[0]),
          to_date: formatDate(dates[1]),
        });
        const { amount }: { amount: string } = await api.getExpensesTotal({
          from_date: formatDate(dates[0]),
          to_date: formatDate(dates[1]),
        });
        setTotalAmount(amount);
        setExpenses(data);
        setTotal(meta?.total);
      } catch (error) {
        console.error('Failed to fetch expenses:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [rows, dates],
  );

  useEffect(() => {
    if (dates[1]) {
      fetchData();
    }
  }, [fetchData]);

  const handlePageChange = useCallback(
    (event: PaginatorPageChangeEvent) => {
      fetchData(event.page + 1);
      setFirst(event.first);
    },
    [fetchData],
  );

  const handleEditClick = useCallback((expenseData: IExpense) => {
    setExpense(expenseData);
    setIsAddDialogVisible(true);
  }, []);

  const handleDeleteClick = useCallback((expenseData: IExpense) => {
    setExpense(expenseData);
    setIsDeleteDialogVisible(true);
  }, []);

  // Body Templates
  const dateBodyTemplate = useCallback(
    (rowData: IExpense) =>
      isLoading ? <Skeleton width="100px" /> : rowData.created_at?.slice(0, -3),
    [isLoading],
  );

  const nameBodyTemplate = useCallback(
    (rowData: IExpense) =>
      isLoading ? <Skeleton width="100px" /> : <div>{rowData.name}</div>,
    [isLoading],
  );

  const descriptionBodyTemplate = useCallback(
    (rowData: IExpense) =>
      isLoading ? <Skeleton width="100px" /> : <div>{rowData.description}</div>,
    [isLoading],
  );

  const priceBodyTemplate = useCallback(
    (rowData: IExpense) => formatPrice(rowData.amount),
    [],
  );

  const actionBodyTemplate = useCallback(
    (rowData: IExpense) => (
      <>
        <Button
          icon="pi pi-pencil"
          rounded
          text
          severity="secondary"
          className="btn-icon-right"
          onClick={() => handleEditClick(rowData)}
        />
        <Button
          icon="pi pi-trash"
          rounded
          text
          severity="danger"
          onClick={() => handleDeleteClick(rowData)}
        />
      </>
    ),
    [handleEditClick, handleDeleteClick],
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

  const headerContent = useMemo(
    () =>
      hasPermission('expense.create') ? (
        <TableHeader
          onFilterToggle={() => setFilter((prev) => !prev)}
          onRefresh={() => fetchData()}
          leftContent={
            <Message
              className="info-message"
              severity="info"
              content={<div>{totalAmount} AZN</div>}
            />
          }
          rightContent={
            <Button
              label="Əlavə et"
              icon="pi pi-plus"
              onClick={() => setIsAddDialogVisible(true)}
            />
          }
        />
      ) : null,
    [hasPermission, fetchData, totalAmount],
  );

  return (
    <div>
      <div className="table-responsive">
        <DataTable
          value={expenses}
          dataKey="id"
          tableStyle={{ minWidth: '60rem' }}
          header={headerContent}
          className="table-container"
          filterDisplay={filter ? 'row' : undefined}
        >
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
            header="Ad"
            body={nameBodyTemplate}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
          />
          <Column
            header="Izah"
            body={descriptionBodyTemplate}
            style={{ minWidth: '12rem' }}
            showFilterMenu={false}
          />
          <Column
            field="price"
            header="Məbləğ"
            body={priceBodyTemplate}
            style={{ minWidth: '8rem' }}
          />
          {hasPermission('expense.delete') && (
            <Column
              body={actionBodyTemplate}
              exportable={false}
              style={{ minWidth: '8rem' }}
            />
          )}
        </DataTable>
      </div>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={handlePageChange}
      />

      <Toast ref={toast} />

      <AddDialog
        expense={expense}
        visible={isAddDialogVisible}
        onHide={() => {
          setIsAddDialogVisible(false);
          setExpense(undefined);
        }}
        onSuccess={showSuccess}
        getExpenses={fetchData}
      />

      <DeleteDialog
        expense={expense}
        visible={isDeleteDialogVisible}
        onHide={() => setIsDeleteDialogVisible(false)}
        setExpenses={setExpenses}
        onSuccess={showSuccess}
      />
    </div>
  );
};

export default ExpensesTable;
