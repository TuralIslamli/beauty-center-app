import React, { useCallback, useRef } from 'react';
import { Button } from 'primereact/button';
import { Calendar, CalendarProps } from 'primereact/calendar';

const mergeClassNames = (...classNames: Array<string | undefined>) =>
  classNames.filter(Boolean).join(' ');

const FilterDateCalendar: React.FC<CalendarProps> = ({
  className,
  panelClassName,
  headerTemplate,
  ...props
}) => {
  const calendarRef = useRef<Calendar>(null);

  const handleClose = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    calendarRef.current?.hide();
  }, []);

  const renderHeader = useCallback(
    () => (
      <>
        {headerTemplate?.()}
        <div className="filter-calendar-panel-header">
          <Button
            type="button"
            icon="pi pi-times"
            rounded
            text
            aria-label="Bağla"
            className="filter-calendar-panel-close"
            onClick={handleClose}
          />
        </div>
      </>
    ),
    [handleClose, headerTemplate],
  );

  return (
    <Calendar
      ref={calendarRef}
      {...props}
      showButtonBar
      className={mergeClassNames('filter-calendar', className)}
      panelClassName={mergeClassNames('filter-calendar-panel', panelClassName)}
      appendTo={typeof document !== 'undefined' ? document.body : undefined}
      headerTemplate={renderHeader}
    />
  );
};

export default FilterDateCalendar;
