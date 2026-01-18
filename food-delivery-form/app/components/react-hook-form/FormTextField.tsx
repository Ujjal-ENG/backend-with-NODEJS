import { TextField, TextFieldProps } from "@mui/material";
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";

type FormTextFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<
  TextFieldProps,
  | "name"
  | "defaultValue"
  | "label"
  | "onChange"
  | "value"
  | "ref"
  | "error"
  | "helperText"
> & {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  rules?: RegisterOptions<TFieldValues, TName>;
  helperText?: string;
};

export const FormTextField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  rules,
  helperText,
  id,
  ...textFieldProps
}: FormTextFieldProps<TFieldValues, TName>) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    render={({ field, fieldState }) => (
      <TextField
        {...textFieldProps}
        {...field}
        id={id ?? name}
        label={label}
        error={!!fieldState.error}
        helperText={fieldState.error?.message ?? helperText}
      />
    )}
  />
);

FormTextField.displayName = "FormTextField";
