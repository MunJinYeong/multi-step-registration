import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes
} from "react";
import type { FieldError } from "react-hook-form";

type FieldControlProps =
  | ({
      as?: "input";
    } & InputHTMLAttributes<HTMLInputElement>)
  | ({
      as: "textarea";
    } & TextareaHTMLAttributes<HTMLTextAreaElement>);

interface FieldProps {
  label: string;
  error?: FieldError;
  hint?: string;
  required?: boolean;
  children?: ReactNode;
  controlProps: FieldControlProps;
}

function Field({
  label,
  error,
  hint,
  required = false,
  children,
  controlProps
}: FieldProps) {
  const errorId = error ? `${controlProps.id}-error` : undefined;
  const hintId = hint ? `${controlProps.id}-hint` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = (() => {
    if (controlProps.as === "textarea") {
      const { as: controlAs, ...textareaProps } = controlProps;
      void controlAs;

      return (
      <textarea
        {...textareaProps}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
      />
      );
    }

    const { as: controlAs, ...inputProps } = controlProps;
    void controlAs;

    return (
      <input
        {...inputProps}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
      />
    );
  })();

  return (
    <div className="field">
      <label htmlFor={controlProps.id}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {control}
      {hint ? (
        <p className="field-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error.message}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export default Field;
