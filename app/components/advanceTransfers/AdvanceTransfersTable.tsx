import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Toast } from 'primereact/toast';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { Calendar } from 'primereact/calendar';

import api from '../../api';
import { IAdvanceInfo, IAdvanceListData } from '../../types';
import { formatDate, getRoleName, haveFilterPermissions, getDaysAgo } from '@/app/utils';
import { TableHeader } from '../shared';

interface AdvanceTransfersTableProps {
  userPermissions: string[];
}

const AdvanceTransfersTable: React.FC<AdvanceTransfersTableProps> = ({ userPermissions }) => {
  const [advanceList, setAdvanceList] = useState<IAdvanceInfo[]>([]);
  const [first, setFirst] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows] = useState(10);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(false);
  const [dates, setDates] = useState<Date[]>([getDaysAgo(10), new Date()]);

  const toast = useRef<Toast>(null);

  const hasPermission = useCallback(
    (permission: string) => userPermissions.includes(permission),
    [userPermissions]
  );

  const fetchData = useCallback(async (currentPage: number) => {
    try {
      const { data, meta }: IAdvanceListData = await api.getAdvances({
        page: currentPage,
        size: rows,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
      });
      setAdvanceList(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error('Failed to fetch advance transfers:', error);
    }
  }, [rows, dates]);

  useEffect(() => {
    if (dates[1]) {
      fetchData(page);
    }
  }, [fetchData, dates, page]);

  const handlePageChange = useCallback((event: PaginatorPageChangeEvent) => {
    fetchData(event.page + 1);
    setPage(event.page + 1);
    setFirst(event.first);
  }, [fetchData]);

  // Body Templates
  const userBodyTemplate = useCallback((rowData: IAdvanceInfo) => (
    <div>
      {rowData?.user
        ? `${rowData.user.name} ${rowData.user.surname}`
        : 'sistem'}
    </div>
  ), []);

  const roleBodyTemplate = useCallback((rowData: IAdvanceInfo) => (
    <div>{getRoleName(rowData?.user?.role?.id)}</div>
  ), []);

  // Filter Templates
  const dateFilterTemplate = useCallback(() => (
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
    ) : null
  ), [hasPermission, dates]);

  const headerContent = useMemo(() => (
    <TableHeader
      onFilterToggle={haveFilterPermissions(userPermissions) ? () => setFilter((prev) => !prev) : undefined}
    />
  ), [userPermissions]);

  return (
    <>
      <DataTable
        value={advanceList}
        editMode="row"
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        className="table-container"
        header={headerContent}
        filterDisplay={filter ? 'row' : undefined}
      >
        <Column
          field="transferred_at"
          header="Tarix və saat"
          style={{ width: '20%' }}
          filter
          filterElement={dateFilterTemplate}
        />
        <Column
          field="user"
          header="Bağlayan şəxs"
          body={userBodyTemplate}
          style={{ width: '20%' }}
        />
        <Column
          field="role"
          body={roleBodyTemplate}
          header="Rol"
          style={{ width: '20%' }}
        />
      </DataTable>

      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={handlePageChange}
      />

      <Toast ref={toast} />
    </>
  );
};

export default AdvanceTransfersTable;
