import api from "@/app/api";
import { formatDate } from "@/app/utils";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Dialog } from "primereact/dialog";
import { Nullable } from "primereact/ts-helpers";
import React, { useState } from "react";

interface IDialogProps {
  dialog: boolean;
  setDialog: (state: boolean) => void;
}
const ReportsDialog = ({ dialog, setDialog }: IDialogProps) => {
  const [dailyReportDate, setDailyReportDate] = useState<Nullable<Date>>(
    new Date()
  );

  const [bonusesReportDates, setBonusesReportDates] = useState<
    Nullable<(Date | null)[]>
  >([new Date(), new Date()]);

  const [generalReportDates, setGeneralReportDates] = useState<any>([
    new Date(),
    new Date(),
  ]);

  return (
    <Dialog
      header="Reports"
      visible={dialog}
      onHide={() => {
        if (!dialog) return;
        setDialog(false);
      }}
    >
      <div
        style={{ minWidth: "40vw", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <Calendar
            value={dailyReportDate}
            onChange={(e) => setDailyReportDate(e.value)}
            style={{ width: "170px" }}
            showIcon
            dateFormat="dd/mm/yy"
          />
          <Button
            severity="success"
            label="Export"
            icon="pi pi-upload"
            style={{ width: "180px" }}
            onClick={() => api.getDailyReportExcel(formatDate(dailyReportDate))}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default ReportsDialog;
