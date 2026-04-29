import React from 'react';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';

import { IDoctor } from '@/app/types';
import { creditSessionStatuses } from './consts';
import { ICreditSession } from './types';

export type CreditSessionErrors = Record<number, { doctor?: string }>;

interface CreditSessionsEditorProps {
  sessions: ICreditSession[];
  doctors: IDoctor[];
  errors?: CreditSessionErrors;
  onSessionChange: (index: number, value: Partial<ICreditSession>) => void;
}

const CreditSessionsEditor: React.FC<CreditSessionsEditorProps> = ({
  sessions,
  doctors,
  errors,
  onSessionChange,
}) => (
  <div className="credit-sessions">
    {sessions.map((session, index) => (
      <div key={session.id} className="credit-session-row">
        <span className="credit-session-index">{index + 1}</span>
        <div className="credit-session-field">
          <Calendar
            value={session.date}
            onChange={(event) =>
              onSessionChange(index, { date: event.value as Date | null })
            }
            dateFormat="dd-mm-yy"
            readOnlyInput
            placeholder="Tarix"
            showIcon
          />
        </div>
        <div className="credit-session-field">
          <Dropdown
            filter
            value={session.doctor}
            onChange={(event) => onSessionChange(index, { doctor: event.value })}
            options={doctors}
            optionLabel="full_name"
            placeholder="Doktor seçin"
            className="credit-session-doctor"
            invalid={!!errors?.[index]?.doctor}
          />
          {errors?.[index]?.doctor && (
            <div className="form-error">{errors[index].doctor}</div>
          )}
        </div>
        <div className="credit-session-field">
          <Dropdown
            value={creditSessionStatuses.find(
              (status) => status.id === session.status,
            )}
            onChange={(event) =>
              onSessionChange(index, { status: event.value.id })
            }
            options={creditSessionStatuses}
            optionLabel="name"
            placeholder="Status"
            className="credit-session-status"
          />
        </div>
      </div>
    ))}
  </div>
);

export default CreditSessionsEditor;
