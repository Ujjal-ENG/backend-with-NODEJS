import { getRenderCount } from "@/app/utils/useRenderCount";
import { useEffect } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import { FormSelectField } from "./FormSelectField";

type Option = {
  label: string;
  value: string;
};

type CheckoutSectionProps = {
  paymentOptions: Option[];
  deliveryOptions: Option[];
};

const RenderCount = getRenderCount();

export const CheckoutSection = ({
  paymentOptions,
  deliveryOptions,
}: CheckoutSectionProps) => {
  const { control } = useFormContext();
  const { errors } = useFormState<CheckoutSectionProps>({
    name: ["paymentOptions", "deliveryOptions"],
    exact: true,
  });

  const paymentType = useWatch({
    control,
    name: "orderPaymentOption",
  });
  useEffect(() => {
    if (paymentType === "online") {
      alert("Please verify the payment after the order is placed");
    }
  }, [paymentType]);
  console.log("erros from checkout section ", errors);
  return (
    <div className="flex justify-between align-middle gap-2 mt-4">
      <RenderCount />
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
};

export default CheckoutSection;
