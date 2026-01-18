"use client";

import { getRenderCount } from "@/app/utils/useRenderCount";
import { Grid, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";

type FoodDeliveryFormProps = {
  customerName: string;
  mobile: number;
  orderNumber: string;
  email: string;
};

const RenderCount = getRenderCount();
export default function FoodDeliveryFormReactHookForm() {
  const { control, handleSubmit, formState, reset, getValues } =
    useForm<FoodDeliveryFormProps>({
      defaultValues: {
        customerName: "Hello World",
        mobile: 2154,
        orderNumber: "",
        email: "",
      },
      mode: "onChange",
    });
  const onSubmit = (data: FoodDeliveryFormProps) => {
    console.log(data);
  };
  console.log(formState);
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-zinc-50 font-sans ">
      <h3 className="text-2xl text-black">React Hook Form</h3>
      <RenderCount />
      <br />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {/* Customer Name */}
          <div className="sm:col-span-2">
            <Controller
              name="customerName"
              control={control}
              rules={{
                required: "Customer name is required",
                minLength: {
                  value: 3,
                  message: "Customer name must be at least 3 characters",
                },
              }}
              render={({ field }) => (
                <TextField
                  required
                  id="customerName"
                  label="Customer Name"
                  {...field}
                  error={!!formState.errors.customerName}
                  helperText={formState.errors.customerName?.message}
                />
              )}
            />
          </div>

          {/* Order Number */}
          <div>
            <Controller
              name="orderNumber"
              control={control}
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
              render={({ field }) => (
                <TextField
                  required
                  id="orderNumber"
                  label="Order Number"
                  {...field}
                  error={!!formState.errors.orderNumber}
                  helperText={formState.errors.orderNumber?.message}
                />
              )}
            />
          </div>

          {/* Mobile */}
          <div>
            <Controller
              name="mobile"
              control={control}
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
              render={({ field }) => (
                <TextField
                  required
                  id="mobile"
                  label="Mobile Number"
                  {...field}
                  type="number"
                  error={!!formState.errors.mobile}
                  helperText={formState.errors.mobile?.message}
                />
              )}
            />
          </div>

          {/* Email */}
          <div className="sm:col-span-2">
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
                validate: (value) => {
                  if (!value.includes("@gmail.com")) {
                    return "Please add valid email";
                  }
                },
              }}
              render={({ field }) => (
                <TextField
                  required
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  {...field}
                  error={!!formState.errors.email}
                  helperText={formState.errors.email?.message}
                />
              )}
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
