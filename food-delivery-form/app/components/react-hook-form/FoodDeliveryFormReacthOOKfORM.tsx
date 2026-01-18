"use client";

import { getRenderCount } from "@/app/utils/useRenderCount";
import { TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";

type FoodDeliveryFormProps = {
  customerName: string;
  mobile: number;
};

const renderCount = getRenderCount();
export default function FoodDeliveryFormReactHookForm() {
  const { control, handleSubmit } = useForm<FoodDeliveryFormProps>({
    defaultValues: {
      customerName: "Hello World",
      mobile: 2154,
    },
  });
  const onSubmit = (data: FoodDeliveryFormProps) => {
    console.log(data);
  };
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-zinc-50 font-sans ">
      <h3 className="text-2xl">React Hook Form</h3>
      {renderCount()}
      <br />
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Customer Name */}
        <div>
          <label
            htmlFor="customerName"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Customer Name <span className="text-red-500">*</span>
          </label>
          <Controller
            name="customerName"
            control={control}
            render={({ field }) => (
              <TextField
                required
                id="outlined-required"
                label="Required"
                {...field}
              />
            )}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            We&apos;ll use this name to contact you
          </p>
        </div>

        {/* Mobile */}
        <div>
          <label
            htmlFor="mobile"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <Controller
            name="mobile"
            control={control}
            render={({ field }) => (
              <TextField
                required
                id="outlined-required"
                label="Required"
                type="number"
                {...field}
              />
            )}
          />

          <p className="mt-1.5 text-xs text-gray-500">
            We&apos;ll use this number to contact you
          </p>
        </div>

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
