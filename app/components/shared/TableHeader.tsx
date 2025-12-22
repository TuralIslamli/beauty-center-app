import React, { ReactNode } from 'react';
import { Button } from 'primereact/button';

interface TableHeaderProps {
  showFilter?: boolean;
  onFilterToggle?: () => void;
  onRefresh?: () => void;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
}

/**
 * Общий компонент заголовка таблицы
 */
const TableHeader: React.FC<TableHeaderProps> = ({
  showFilter = false,
  onFilterToggle,
  onRefresh,
  leftContent,
  rightContent,
}) => {
  return (
    <div className="table-header">
      <div className="table-header-actions">
        {onFilterToggle && (
          <Button
            type="button"
            icon="pi pi-filter-slash"
            label="Filter"
            onClick={onFilterToggle}
          />
        )}
        {onRefresh && (
          <Button
            icon="pi pi-refresh"
            rounded
            raised
            onClick={onRefresh}
          />
        )}
        {leftContent}
      </div>
      <div className="table-header-actions">
        {rightContent}
      </div>
    </div>
  );
};

export default TableHeader;

