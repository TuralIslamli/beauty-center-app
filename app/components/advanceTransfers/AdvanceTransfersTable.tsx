import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import React, { useEffect, useRef, useState } from 'react';
import { IAdvanceInfo, IAdvanceListData, IUser, IUserData } from '../../types';
import api from '../../api';
import { Toast } from 'primereact/toast';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { formatDate, getRoleName, haveFilterPermissions } from '@/app/utils';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';

interface IProps {
  userPermissions: string[];
}

function AdvanceTransfersTable({ userPermissions }: IProps) {
  const [advanceList, setAdvanceList] = useState<IAdvanceInfo[]>([]);
  const [first, setFirst] = useState(0);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<number>(10);
  const [page, setPage] = useState(1);
  const toast = useRef<Toast>(null);
  const [filter, setFilter] = useState(false);
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const [dates, setDates] = useState<any>([tenDaysAgo, new Date()]);

  const fetchData = async (page: number) => {
    try {
      const { data, meta }: IAdvanceListData = await api.getAdvances({
        page,
        size: rows,
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
      });
      setAdvanceList(data);
      setTotal(meta?.total);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (dates[1]) {
      fetchData(page);
    }
  }, [dates[1]]);

  const onPageChange = (event: PaginatorPageChangeEvent) => {
    fetchData(event.page + 1);
    setPage(event.page + 1);
    setFirst(event.first);
  };

  const roleBody = (rowData: IAdvanceInfo) => {
    return <div>{getRoleName(rowData?.user?.role?.id)}</div>;
  };

  const userBody = (rowData: IAdvanceInfo) => {
    return (
      <div>
        {rowData?.user
          ? `${rowData?.user?.name} ${rowData?.user?.surname}`
          : 'sistem'}
      </div>
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
      </div>
    </div>
  );

  return (
    <>
      <DataTable
        value={advanceList}
        editMode="row"
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        style={{ marginBottom: '10px' }}
        header={header}
        filterDisplay={filter ? 'row' : undefined}
      >
        <Column
          field="transferred_at"
          header="Tarix və saat"
          style={{ width: '20%' }}
          filter
          filterElement={dateRowFilterTemplate}
        ></Column>
        <Column
          field="user"
          header="Bağlayan şəxs"
          body={userBody}
          style={{ width: '20%' }}
        ></Column>
        <Column
          field="role"
          body={roleBody}
          header="Rol"
          style={{ width: '20%' }}
        ></Column>
      </DataTable>
      <Paginator
        first={first}
        rows={rows}
        totalRecords={total}
        onPageChange={onPageChange}
      />
      <Toast ref={toast} />
    </>
  );
}

export default AdvanceTransfersTable;
