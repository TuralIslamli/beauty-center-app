import React, { useState, useCallback } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Nullable } from 'primereact/ts-helpers';

import api from '@/app/api';
import { formatDate } from '@/app/utils';

interface ReportsDialogProps {
  visible: boolean;
  onHide: () => void;
}

const ReportsDialog: React.FC<ReportsDialogProps> = ({ visible, onHide }) => {
  const [dailyReportDate, setDailyReportDate] = useState<Nullable<Date>>(new Date());

  const handleExport = useCallback(() => {
    if (dailyReportDate) {
      api.getDailyReportExcel(formatDate(dailyReportDate));
    }
  }, [dailyReportDate]);

  return (
    <Dialog
      header="Hesabatlar"
      visible={visible}
      onHide={onHide}
      style={{ minWidth: '400px' }}
    >
      <div className="flex flex-column gap-4">
        <div className="flex justify-between align-center gap-4">
          <Calendar
            value={dailyReportDate}
            onChange={(e) => setDailyReportDate(e.value)}
            showIcon
            dateFormat="dd/mm/yy"
          />
          <Button
            severity="success"
            label="Export"
            icon="pi pi-upload"
            onClick={handleExport}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default ReportsDialog;
