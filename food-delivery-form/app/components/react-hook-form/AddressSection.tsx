import { Control } from "react-hook-form";
import { FormTextField } from "./FormTextField";
import { FoodDeliveryFormProps } from "./types";

type AddressSectionProps = {
  control: Control<FoodDeliveryFormProps>;
};

export const AddressSection = ({ control }: AddressSectionProps) => (
  <>
    <div className="sm:col-span-2 text-black">Delivery Address</div>

    <div className="sm:col-span-2">
      <FormTextField
        name="address.streetAddress"
        control={control}
        label="Street Address"
        rules={{ required: "Street address is required" }}
      />
    </div>

    <div className="sm:col-span-2">
      <FormTextField
        name="address.landmark"
        control={control}
        label="Landmark"
        rules={{
          maxLength: {
            value: 100,
            message: "Landmark must be under 100 characters",
          },
        }}
      />
    </div>

    <div>
      <FormTextField
        name="address.city"
        control={control}
        label="City"
        rules={{ required: "City is required" }}
      />
    </div>

    <div>
      <FormTextField
        name="address.state"
        control={control}
        label="State"
        rules={{ required: "State is required" }}
      />
    </div>
  </>
);

AddressSection.displayName = "AddressSection";
