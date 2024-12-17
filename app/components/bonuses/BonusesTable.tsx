import React, { useEffect, useState } from 'react';
import api from '../../api';
import {
  IBonus,
  IBonusesCoefficientRS,
  IBonusesRS,
  IDoctor,
  IDoctorRS,
} from '@/app/types';
import { DataTable, DataTableExpandedRows } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { formatDate } from '@/app/utils';
import { InputNumber } from 'primereact/inputnumber';

function BonusesTable() {
  const [bonuses, setBonuses] = useState<IBonus[]>();
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [doctor, setDoctor] = useState<IDoctor>();
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});
  const [coefficient, setCoefficient] = useState<number>();

  const priceBodyTemplate = (rowData: IBonus) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(+rowData.total_amount);
    const currencySymbol =
      parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
    const formattedPrice = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('');

    return `${formattedPrice} ${currencySymbol}`;
  };

  const bonusBodyTemplate = (rowData: IBonus) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const tempCoefficient = coefficient || 1;

    const parts = formatter.formatToParts(
      +rowData.total_amount / tempCoefficient
    );

    const currencySymbol =
      parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
    const formattedPrice = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('');

    return `${formattedPrice} ${currencySymbol}`;
  };

  const priceTemplate = (bonus: IBonus) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const parts = formatter.formatToParts(+bonus.bonus_per_days);
    const currencySymbol =
      parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
    const formattedPrice = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('');

    return `${formattedPrice} ${currencySymbol}`;
  };

  const bonusTemplate = (bonus: IBonus) => {
    const formatter = new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
    });

    const tempCoefficient = coefficient || 1;

    const parts = formatter.formatToParts(
      +bonus.bonus_per_days / tempCoefficient
    );
    const currencySymbol =
      parts.find((part) => part.type === 'currency')?.value ?? 'AZN';
    const formattedPrice = parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join('');

    return `${formattedPrice} ${currencySymbol}`;
  };

  const fetchData = async () => {
    try {
      const { data }: IBonusesRS = await api.getBonuses({
        from_date: formatDate(dates[0]),
        to_date: formatDate(dates[1]),
        user_id: doctor?.id,
      });
      const { data: coefficient }: IBonusesCoefficientRS =
        await api.getBonusesCoefficient();
      setBonuses(data);
      setCoefficient(coefficient?.coefficient);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (dates[1]) {
      fetchData();
    }
  }, [dates[1], doctor]);

  useEffect(() => {
    if (coefficient) api.patchBonusCoefficient(coefficient);
  }, [coefficient]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: doctorsData }: IDoctorRS = await api.getDoctors();
      setDoctors(doctorsData);
    };
    fetchData();
  }, []);

  const getDoctorFullName = (rowData: IBonus) => {
    return `${rowData.user?.name} ${rowData.user?.surname}`;
  };

  const onDownloadBonuses = () => {
    api.getBonusesExcel({
      from_date: formatDate(dates[0]),
      to_date: formatDate(dates[1]),
      user_id: doctor?.id,
    });
  };

  const rowExpansionTemplate = (data: IBonus) => {
    return (
      <div>
        <DataTable value={data.bonus_per_days}>
          <Column field="date" header="Tarix" style={{ width: '20%' }}></Column>
          <Column
            field="bonus_per_days"
            header="Məbləğ"
            body={priceTemplate}
            style={{ width: '20%' }}
          ></Column>
          <Column
            field="bonus_per_days"
            header="Bonus"
            body={bonusTemplate}
            style={{ width: '90%' }}
          ></Column>
        </DataTable>
      </div>
    );
  };

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div>
        <Calendar
          value={dates}
          onChange={(e) => setDates(e.value)}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          style={{ width: '220px', marginRight: '10px' }}
          dateFormat="dd/mm/yy"
        />

        <Dropdown
          filter
          style={{ marginBottom: '10px' }}
          value={doctor}
          onChange={(e) => {
            setDoctor(e.value);
          }}
          options={doctors}
          placeholder="Həkim seçin"
          optionLabel="full_name"
          showClear
        />
        <InputNumber
          style={{ marginLeft: '10px', maxWidth: 10 }}
          value={coefficient}
          onValueChange={(e) => setCoefficient(e.value || 0)}
        />
      </div>
      <Button
        label="Export"
        icon="pi pi-upload"
        severity="success"
        onClick={onDownloadBonuses}
        style={{ marginRight: '10px' }}
      />
    </div>
  );

  const allowExpansion = (rowData: IBonus) => {
    return rowData.bonus_per_days!.length > 0;
  };

  const handleRowToggle = (e: { data: DataTableExpandedRows }) => {
    setExpandedRows(e.data);
  };

  return (
    <div>
      <DataTable
        value={bonuses}
        editMode="row"
        dataKey="date"
        style={{ marginBottom: '10px' }}
        header={header}
        expandedRows={expandedRows}
        onRowToggle={handleRowToggle}
        rowExpansionTemplate={rowExpansionTemplate}
      >
        <Column expander={allowExpansion} />
        <Column
          body={getDoctorFullName}
          header="Həkim"
          style={{ width: '20%' }}
        ></Column>
        <Column
          field="total_amount"
          header="Toplam məbləğ"
          body={priceBodyTemplate}
          style={{ width: '20%' }}
        ></Column>
        <Column
          field="total_amount"
          header="Bonus"
          body={bonusBodyTemplate}
          style={{ width: '60%' }}
        ></Column>
      </DataTable>
    </div>
  );
}

export default BonusesTable;
