import type { InputHTMLAttributes, ReactNode } from 'react';
import './input.scss';

type CommonInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  errorMessage?: string;
  helperText?: string;
  wrapperClassName?: string;
  controlWrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  helperClassName?: string;
  errorClassName?: string;
  trailingContent?: ReactNode;
};

/**
 * Reusable input primitive that standardizes label, helper text, and error rendering.
 * @param props Input element props plus optional UI helper fields for consistent form usage.
 * @returns A labeled input with optional helper and error messages for accessible forms.
 */
function Input({
  id,
  label,
  errorMessage,
  helperText,
  className,
  wrapperClassName = '',
  controlWrapperClassName = '',
  labelClassName = '',
  inputClassName = '',
  helperClassName = '',
  errorClassName = '',
  trailingContent,
  ...inputProps
}: CommonInputProps) {
  // Reuses explicit id when provided and falls back to name for proper label/input association.
  const inputId = id ?? inputProps.name;
  // Ensures screen readers announce helper/error messages when they exist.
  const helperId = helperText && inputId ? `${inputId}-hint` : undefined;
  const errorId = errorMessage && inputId ? `${inputId}-error` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`common-input ${wrapperClassName}`.trim()}>
      {label ? (
        <label htmlFor={inputId} className={labelClassName}>
          {label}
        </label>
      ) : null}
      {/* Wrapper anchors optional trailing controls to the input itself, improving layout precision. */}
      <div className={`common-input__control-wrapper ${controlWrapperClassName}`.trim()}>
        <input
          id={inputId}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={describedBy}
          className={`common-input__control ${inputClassName} ${className ?? ''}`.trim()}
          {...inputProps}
        />
        {/* Slot allows context-specific UI like password visibility toggles without duplicating input logic. */}
        {trailingContent ? <div className="common-input__trailing">{trailingContent}</div> : null}
      </div>
      {helperText ? (
        <p id={helperId} className={`common-input__helper ${helperClassName}`.trim()}>
          {helperText}
        </p>
      ) : null}
      {errorMessage ? (
        <p id={errorId} className={`common-input__error ${errorClassName}`.trim()} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export default Input;
