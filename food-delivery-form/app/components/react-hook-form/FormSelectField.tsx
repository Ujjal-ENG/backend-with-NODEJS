import { MenuItem, TextField, TextFieldProps } from "@mui/material";
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";

type SelectOption = {
  label: string;
  value: string | number;
};

type FormSelectFieldProps<
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
  options: SelectOption[];
  rules?: RegisterOptions<TFieldValues, TName>;
  helperText?: string;
};

export const FormSelectField = <
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  options,
  rules,
  helperText,
  id,
  ...textFieldProps
}: FormSelectFieldProps<TFieldValues, TName>) => (
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
        select
        fullWidth
        size="medium"
        slotProps={{ inputLabel: { shrink: true } }}
        error={!!fieldState.error}
        helperText={fieldState.error?.message ?? helperText}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    )}
  />
);

FormSelectField.displayName = "FormSelectField";
