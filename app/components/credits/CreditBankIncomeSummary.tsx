import React from 'react';

import { formatPrice } from '@/app/utils';
import { IServiceCreditBankIncome } from './types';

interface CreditBankIncomeSummaryProps {
  incomes: IServiceCreditBankIncome[];
}

const getIncomeAmount = (income: IServiceCreditBankIncome): number => {
  const amount = Number(income.totalAmount || 0);

  return Number.isFinite(amount) ? amount : 0;
};

const CreditBankIncomeSummary: React.FC<CreditBankIncomeSummaryProps> = ({
  incomes,
}) => {
  const total = incomes.reduce((sum, income) => sum + getIncomeAmount(income), 0);

  return (
    <>
      <div className="ml-2">Bank gəlirləri:</div>
      {incomes.length ? (
        incomes.map((income, index) => (
          <div key={`${income.bank || 'unknown'}-${index}`} className="ml-2">
            {income.bank || 'Bank yoxdur'}: {formatPrice(getIncomeAmount(income))}
          </div>
        ))
      ) : (
        <div className="ml-2">Bank üzrə məlumat yoxdur</div>
      )}
      <div className="ml-2">Ümumi: {formatPrice(total)}</div>
    </>
  );
};

export default CreditBankIncomeSummary;
