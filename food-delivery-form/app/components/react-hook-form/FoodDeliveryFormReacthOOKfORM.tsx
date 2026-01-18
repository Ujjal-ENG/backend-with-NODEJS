"use client";

import { getRenderCount } from "@/app/utils/useRenderCount";
import { Grid } from "@mui/material";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { AddressSection } from "./AddressSection";
import { CheckoutSection } from "./CheckoutSection";
import { FoodDeliveryMaster } from "./FoodDeliveryMaster";
import { FoodDeliveryFormProps } from "./types";

const orderPaymentOptions = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "Online", value: "online" },
];

const deliveryTypeOptions = [
  { label: "Standard", value: "standard" },
  { label: "Express", value: "express" },
  { label: "Pickup", value: "pickup" },
];

const RenderCount = getRenderCount();
export default function FoodDeliveryFormReactHookForm() {
  const methods: UseFormReturn<FoodDeliveryFormProps> =
    useForm<FoodDeliveryFormProps>({
      defaultValues: {
        customerName: "Hello World",
        mobile: 2154,
        orderNumber: "",
        email: "",
        orderPaymentOption: "",
        deliveryType: "",
        address: {
          streetAddress: "",
          landmark: "",
          city: "",
          state: "",
        },
      },
      mode: "onChange",
    });

  const {
    handleSubmit,
    reset,
    formState: {
      isValid,
      isSubmitSuccessful,

      isSubmitting,
    },
  } = methods;
  const onSubmit = async (data: FoodDeliveryFormProps) => {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    console.log(data);
    reset(data);
  };

  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <div className="w-full max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl text-black">React Hook Form</h3>
          <RenderCount />
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Each section shows the component name and renders row by row.
        </p>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                FoodDeliveryMaster
              </div>
              <Grid container spacing={2}>
                <FoodDeliveryMaster />
              </Grid>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                AddressSection
              </div>
              <Grid container spacing={2}>
                <AddressSection />
              </Grid>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                CheckoutSection
              </div>
              <CheckoutSection
                paymentOptions={orderPaymentOptions}
                deliveryOptions={deliveryTypeOptions}
              />
            </section>

            {/* Submit */}
            <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Submit
              </div>
              <button
                disabled={!isValid || isSubmitting || isSubmitSuccessful}
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 
                         text-white font-medium py-3.5 px-6 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 
                         focus:ring-offset-2 transition-all  duration-200 
                         shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Information
              </button>
            </section>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
