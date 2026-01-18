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
    formState: { isSubmitSuccessful, isSubmitted, isSubmitting, submitCount },
  } = methods;
  const onSubmit = (data: FoodDeliveryFormProps) => {
    setTimeout(() => {
      console.log(data);
    }, 400);
  };

  // console.log("isValidating", isValidating);
  console.log("isSubmitted", isSubmitted);
  console.log("isSubmitSuccessful", isSubmitSuccessful);
  console.log("isSubmitting", isSubmitting);
  console.log("submitCount", submitCount);
  return (
    <div className="flex flex-col w-full min-h-screen items-center justify-center bg-zinc-50 font-sans ">
      <h3 className="text-2xl text-black">React Hook Form</h3>
      <RenderCount />
      <br />
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2}>
            <FoodDeliveryMaster />
            <AddressSection />
          </Grid>
          <CheckoutSection
            paymentOptions={orderPaymentOptions}
            deliveryOptions={deliveryTypeOptions}
          />
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
      </FormProvider>
    </div>
  );
}
