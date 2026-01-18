"use client";

import { getRenderCount } from "@/app/utils/useRenderCount";
import { ChangeEvent, SyntheticEvent, useState } from "react";

type FoodDeliveryFormProps = {
  customerName: string;
  mobile: number;
};
const RenderCount = getRenderCount();
export default function FoodDeliveryFormTypical() {
  const [values, setValue] = useState<FoodDeliveryFormProps>({
    customerName: "",
    mobile: 0,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValue({ ...values, [name]: value });
  };

  const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(values);
    setValue({ customerName: "", mobile: 0 });
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans ">
      <h3 className="text-2xl text-black">Typical Form</h3>
      <RenderCount />
      <br />
      <form onSubmit={onSubmit}>
        {/* Customer Name */}
        <div>
          <label
            htmlFor="customerName"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            value={values?.customerName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                       outline-none transition-all duration-200 
                       placeholder-gray-400 shadow-sm"
            placeholder="Enter full name"
          />
        </div>

        {/* Mobile */}
        <div>
          <label
            htmlFor="mobile"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="mobile"
            name="mobile"
            value={values?.mobile}
            onChange={handleChange}
            required
            pattern="[0-9]{10,15}"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 
                       focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                       outline-none transition-all duration-200 
                       placeholder-gray-400 shadow-sm"
            placeholder="01XXXXXXXXX"
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
