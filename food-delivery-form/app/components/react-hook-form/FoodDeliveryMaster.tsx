import { FoodDeliveryMasterFormTypes } from "@/app/types/food-deliver-master.type";
import { useFormState } from "react-dom";
import { useFormContext } from "react-hook-form";
import { FormTextField } from "./FormTextField";

export const FoodDeliveryMaster = () => {
  const { control, getValues } = useFormContext();
  const { errors } = useFormState<FoodDeliveryMasterFormTypes>({
    name: ["customerName", "orderNumber", "mobile", "email"],
  });
  console.log("errors", errors);
  return (
    <>
      {/* Customer Name */}
      <div className="sm:col-span-2">
        <FormTextField
          name="customerName"
          control={control}
          label="Customer Name"
          required
          rules={{
            required: "Customer name is required",
            minLength: {
              value: 3,
              message: "Customer name must be at least 3 characters",
            },
          }}
        />
      </div>

      {/* Order Number */}
      <div>
        <FormTextField
          name="orderNumber"
          control={control}
          label="Order Number"
          rules={{
            required: "Order number is required",
            minLength: {
              value: 4,
              message: "Order number must be at least 4 characters",
            },
            pattern: {
              value: /^[A-Za-z0-9-]+$/,
              message:
                "Order number can only contain letters, numbers, or dashes",
            },
            validate: (value) => {
              const customerName = getValues("customerName").toLowerCase();
              if (!customerName.includes("ujjal")) {
                return "PLease add customer name to Ujjal";
              }
              const stringValue = String(value ?? "");
              if (stringValue.length < 4) {
                return "Order number must be at least 4 characters";
              }
              if (!/^[A-Za-z0-9-]+$/.test(stringValue)) {
                return "Order number can only contain letters, numbers, or dashes";
              }
              return true;
            },
          }}
        />
      </div>

      {/* Mobile */}
      <div>
        <FormTextField
          name="mobile"
          control={control}
          label="Mobile Number"
          type="number"
          required
          rules={{
            required: "Mobile number is required",
            validate: (value) => {
              const stringValue = String(value ?? "");
              if (!/^\d+$/.test(stringValue)) {
                return "Mobile number must contain only digits";
              }
              if (stringValue.length < 7) {
                return "Mobile number must be at least 7 digits";
              }
              if (stringValue.length > 15) {
                return "Mobile number must be at most 15 digits";
              }
              return true;
            },
          }}
        />
      </div>

      {/* Email */}
      <div className="sm:col-span-2">
        <FormTextField
          name="email"
          control={control}
          label="Email"
          type="email"
          autoComplete="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid email address",
            },
            validate: (value: string) => {
              if (!value.includes("@gmail.com")) {
                return "Please add valid email";
              }
            },
          }}
        />
      </div>
    </>
  );
};
