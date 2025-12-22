import React, { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
  inline?: boolean;
}

/**
 * Общий компонент для поля формы с лейблом и ошибкой
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  children,
  inline = false,
}) => {
  if (inline) {
    return (
      <div className="form-field-inline">
        {children}
        <label htmlFor={htmlFor}>{label}</label>
      </div>
    );
  }

  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <div className="form-error">{error}</div>}
    </div>
  );
};

export default FormField;

