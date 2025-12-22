import React from 'react';
import { Skeleton } from 'primereact/skeleton';
import { formatPrice } from '@/app/utils';

interface PriceCellProps {
  amount: number | string;
  isLoading?: boolean;
}

/**
 * Компонент для отображения цены в ячейке таблицы
 */
const PriceCell: React.FC<PriceCellProps> = ({ amount, isLoading = false }) => {
  if (isLoading) {
    return <Skeleton width="100px" />;
  }
  
  return <span>{formatPrice(amount)}</span>;
};

export default PriceCell;

