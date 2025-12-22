import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { DataTable, DataTableExpandedRows } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';

import api from '../../api';
import {
  IBonus,
  IBonusesCoefficientRS,
  IBonusesRS,
  IDoctor,
  IDoctorRS,
  IPerDayBonus,
} from '@/app/types';
import { formatDate, formatPrice } from '@/app/utils';
import { TableHeader } from '../shared';

const BonusesTable: React.FC = () => {
  const [bonuses, setBonuses] = useState<IBonus[]>();
  const [dates, setDates] = useState<Date[]>([new Date(), new Date()]);
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [doctor, setDoctor] = useState<IDoctor>();
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});
  const [coefficient, setCoefficient] = useState<number>();

  const fetchData = useCallback(async () => {
    try {
      const { data }: IBonusesRS = await api.getBonuses({
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        user_id: doctor?.id,
      });
      const { data: coefficientData }: IBonusesCoefficientRS = await api.getBonusesCoefficient();
      setBonuses(data);
      setCoefficient(coefficientData?.coefficient);
    } catch (error) {
      console.error('Failed to fetch bonuses:', error);
    }
  }, [dates, doctor?.id]);

  useEffect(() => {
    if (dates[1]) {
      fetchData();
    }
  }, [fetchData]);

  useEffect(() => {
    if (coefficient) {
      api.patchBonusCoefficient(coefficient);
    }
  }, [coefficient]);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data }: IDoctorRS = await api.getDoctors();
      setDoctors(data);
    };
    fetchDoctors();
  }, []);

  const calculateBonus = useCallback((amount: number | string) => {
    const tempCoefficient = coefficient || 1;
    return formatPrice(+amount / tempCoefficient);
  }, [coefficient]);

  // Body Templates
  const doctorBodyTemplate = useCallback((rowData: IBonus) => (
    `${rowData.user?.name} ${rowData.user?.surname}`
  ), []);

  const totalAmountBodyTemplate = useCallback((rowData: IBonus) => (
    formatPrice(rowData.total_amount)
  ), []);

  const bonusBodyTemplate = useCallback((rowData: IBonus) => (
    calculateBonus(rowData.total_amount)
  ), [calculateBonus]);

  const priceTemplate = useCallback((bonus: IPerDayBonus) => (
    formatPrice(bonus.bonus_per_days)
  ), []);

  const bonusTemplate = useCallback((bonus: IPerDayBonus) => (
    calculateBonus(bonus.bonus_per_days)
  ), [calculateBonus]);

  const handleExport = useCallback(() => {
    api.getBonusesExcel({
      from_date: formatDate(dates[0]),
      to_date: formatDate(dates[1]),
      user_id: doctor?.id,
    });
  }, [dates, doctor?.id]);

  const allowExpansion = useCallback((rowData: IBonus) => (
    rowData.bonus_per_days?.length > 0
  ), []);

  const rowExpansionTemplate = useCallback((data: IBonus) => (
    <div>
      <DataTable value={data.bonus_per_days}>
        <Column field="date" header="Tarix" style={{ width: '20%' }} />
        <Column field="bonus_per_days" header="Məbləğ" body={priceTemplate} style={{ width: '20%' }} />
        <Column field="bonus_per_days" header="Bonus" body={bonusTemplate} style={{ width: '90%' }} />
      </DataTable>
    </div>
  ), [priceTemplate, bonusTemplate]);

  const headerContent = useMemo(() => (
    <TableHeader
      leftContent={
        <div className="flex align-center gap-3">
          <Calendar
            value={dates}
            onChange={(e) => setDates(e.value as Date[])}
            selectionMode="range"
            readOnlyInput
            hideOnRangeSelection
            className="filter-calendar"
            dateFormat="dd/mm/yy"
          />
          <Dropdown
            filter
            value={doctor}
            onChange={(e) => setDoctor(e.value)}
            options={doctors}
            placeholder="Həkim seçin"
            optionLabel="full_name"
            showClear
          />
          <InputNumber
            style={{ maxWidth: '80px' }}
            value={coefficient}
            onValueChange={(e) => setCoefficient(e.value || 0)}
          />
        </div>
      }
      rightContent={
        <Button
          label="Export"
          icon="pi pi-upload"
          severity="success"
          onClick={handleExport}
        />
      }
    />
  ), [dates, doctor, doctors, coefficient, handleExport]);

  return (
    <div>
      <div className="table-responsive">
        <DataTable
          value={bonuses}
          editMode="row"
          dataKey="user.id"
          className="table-container"
          header={headerContent}
          expandedRows={expandedRows}
          onRowToggle={(e) => setExpandedRows(e.data as DataTableExpandedRows)}
          rowExpansionTemplate={rowExpansionTemplate}
        >
          <Column expander={allowExpansion} />
          <Column body={doctorBodyTemplate} header="Həkim" style={{ width: '20%' }} />
          <Column field="total_amount" header="Toplam məbləğ" body={totalAmountBodyTemplate} style={{ width: '20%' }} />
          <Column field="total_amount" header="Bonus" body={bonusBodyTemplate} style={{ width: '60%' }} />
        </DataTable>
      </div>
    </div>
  );
};

export default BonusesTable;
