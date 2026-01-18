import { Control } from "react-hook-form";
import { FormSelectField } from "./FormSelectField";
import { FoodDeliveryFormProps } from "./types";

type Option = {
  label: string;
  value: string;
};

type CheckoutSectionProps = {
  control: Control<FoodDeliveryFormProps>;
  paymentOptions: Option[];
  deliveryOptions: Option[];
};

export const CheckoutSection = ({
  control,
  paymentOptions,
  deliveryOptions,
}: CheckoutSectionProps) => (
  <div className="flex justify-between align-middle gap-2 mt-4">
    <FormSelectField
      name="orderPaymentOption"
      control={control}
      label="Order Payment Option"
      options={paymentOptions}
      rules={{ required: "Payment option is required" }}
    />

    <FormSelectField
      name="deliveryType"
      control={control}
      label="Delivery Type"
      options={deliveryOptions}
      rules={{ required: "Delivery type is required" }}
    />
  </div>
);

CheckoutSection.displayName = "CheckoutSection";
