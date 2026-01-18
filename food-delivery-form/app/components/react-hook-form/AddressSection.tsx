import { getRenderCount } from "@/app/utils/useRenderCount";
import { useFormContext } from "react-hook-form";
import { FormTextField } from "./FormTextField";

const RenderCount = getRenderCount();
export const AddressSection = () => {
  const { control } = useFormContext();
  return (
    <>
      <div className="sm:col-span-2 text-black">Delivery Address</div>
      <RenderCount />

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
};

AddressSection.displayName = "AddressSection";
