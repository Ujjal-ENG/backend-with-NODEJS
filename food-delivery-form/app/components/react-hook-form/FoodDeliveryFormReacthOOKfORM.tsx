"use client";

import { getRenderCount } from "@/app/utils/useRenderCount";
import { Grid } from "@mui/material";
import { useForm } from "react-hook-form";
import { FormSelectField } from "./FormSelectField";
import { FormTextField } from "./FormTextField";

type FoodDeliveryFormProps = {
  customerName: string;
  mobile: number;
  orderNumber: string;
  email: string;
  orderPaymentOption: string;
  deliveryType: string;
};

const RenderCount = getRenderCount();
export default function FoodDeliveryFormReactHookForm() {
  const { control, handleSubmit, getValues } = useForm<FoodDeliveryFormProps>({
    defaultValues: {
      customerName: "Hello World",
      mobile: 2154,
      orderNumber: "",
      email: "",
      orderPaymentOption: "",
      deliveryType: "",
    },
    mode: "onChange",
  });
  const onSubmit = (data: FoodDeliveryFormProps) => {
    console.log(data);
  };
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-zinc-50 font-sans ">
      <h3 className="text-2xl text-black">React Hook Form</h3>
      <RenderCount />
      <br />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
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
              required
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
              required
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

          {/* Order Payment Option */}
          <div className="sm:col-span-2">
            <FormSelectField
              name="orderPaymentOption"
              control={control}
              label="Order Payment Option"
              required
              options={[
                { label: "Cash", value: "cash" },
                { label: "Card", value: "card" },
                { label: "Online", value: "online" },
              ]}
              rules={{ required: "Payment option is required" }}
            />
          </div>

          {/* Delivery Type */}
          <div className="sm:col-span-2">
            <FormSelectField
              name="deliveryType"
              control={control}
              label="Delivery Type"
              required
              options={[
                { label: "Standard", value: "standard" },
                { label: "Express", value: "express" },
                { label: "Pickup", value: "pickup" },
              ]}
              rules={{ required: "Delivery type is required" }}
            />
          </div>
        </Grid>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 
                       text-white font-medium py-3.5 px-6 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 
                       focus:ring-offset-2 transition-all  duration-200 
                       shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Submit Information
          </button>
        </div>
      </form>
    </div>
  );
}
