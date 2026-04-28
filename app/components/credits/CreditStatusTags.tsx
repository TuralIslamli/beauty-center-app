import React from 'react';
import { Tag } from 'primereact/tag';

import { bookingStatuses } from '../consts';
import { ICredit } from './types';
import { getBookingStatusSeverity, getVisitStatusCounts } from './utils';

interface CreditStatusTagsProps {
  credit: ICredit;
}

const CreditStatusTags: React.FC<CreditStatusTagsProps> = ({ credit }) => {
  const statusCounts = getVisitStatusCounts(credit);

  return (
    <div className="flex flex-column gap-1">
      {Object.entries(statusCounts).map(([statusId, count]) => {
        const status = bookingStatuses.find(
          (item) => item.id === Number(statusId),
        );

        return (
          <Tag
            key={statusId}
            value={count > 1 ? `${status?.name} (${count})` : status?.name}
            severity={getBookingStatusSeverity(status?.name)}
            className="status-badge"
          />
        );
      })}
    </div>
  );
};

export default CreditStatusTags;
