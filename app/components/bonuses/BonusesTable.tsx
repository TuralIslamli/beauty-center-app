import React, { useEffect, useState } from "react";
import api from "../../api";
import { IBonus, IBonusesRS, IDoctor, IDoctorRS } from "@/app/types";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dropdown } from "primereact/dropdown";
import { formatDate } from "@/app/utils";

function BonusesTable() {
  const [bonuses, setBonuses] = useState<IBonus[]>();
  const [dates, setDates] = useState<any>([new Date(), new Date()]);
  const [doctors, setDoctors] = useState<IDoctor[]>();
  const [doctor, setDoctor] = useState<IDoctor>();

  const priceBodyTemplate = (rowData: IBonus) => {
    const formatter = new Intl.NumberFormat("az-AZ", {
      style: "currency",
      currency: "AZN",
    });

    const parts = formatter.formatToParts(+rowData.total_amount);
    const currencySymbol =
      parts.find((part) => part.type === "currency")?.value ?? "AZN";
    const formattedPrice = parts
      .filter((part) => part.type !== "currency")
      .map((part) => part.value)
      .join("");

    return `${formattedPrice} ${currencySymbol}`;
  };

  const fetchData = async () => {
    try {
      const { data }: IBonusesRS = await api.getBonuses({
        from_date: dates[0],
        to_date: dates[1],
        user_id: doctor?.id,
      });
      setBonuses(data);
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

  const header = (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <div>
        <Calendar
          value={dates}
          onChange={(e) => setDates(e.value)}
          selectionMode="range"
          readOnlyInput
          hideOnRangeSelection
          style={{ width: "220px", marginRight: "10px" }}
          dateFormat="dd/mm/yy"
        />

        <Dropdown
          filter
          style={{ marginBottom: "10px" }}
          value={doctor}
          onChange={(e) => {
            setDoctor(e.value);
          }}
          options={doctors}
          placeholder="Həkim seçin"
          optionLabel="full_name"
          showClear
        />
      </div>
      <Button
        label="Export"
        icon="pi pi-upload"
        severity="success"
        onClick={onDownloadBonuses}
        style={{ marginRight: "10px" }}
      />
    </div>
  );
  return (
    <div>
      <DataTable
        value={bonuses}
        editMode="row"
        dataKey="id"
        tableStyle={{ minWidth: "50rem" }}
        style={{ marginBottom: "10px" }}
        header={header}
      >
        <Column
          body={getDoctorFullName}
          header="Həkim"
          style={{ width: "40%" }}
        ></Column>
        <Column
          field="total_amount"
          header="Toplam məbləğ"
          body={priceBodyTemplate}
          style={{ width: "40%" }}
        ></Column>
      </DataTable>
    </div>
  );
}

export default BonusesTable;
