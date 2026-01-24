import { Grid } from "@mui/material";
import { useFieldArray, useFormContext } from "react-hook-form";
import { FormTextField } from "./FormTextField";
import { FoodDeliveryFormProps, FoodItemType } from "./types";

export default function FoodItems() {
  const { control } = useFormContext<FoodDeliveryFormProps>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "foodItems",
  });

  console.log(fields);
  const handleAddItem = () =>
    append({
      name: "",
      quantity: 1,
      price: 0,
    } as FoodItemType);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-zinc-900">Food Items</div>
          <div className="text-xs text-zinc-500">
            Add items with quantity and price.
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          Add item
        </button>
      </div>

      {fields.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          No items yet. Click &quot;Add item&quot; to start.
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Item {index + 1}
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-md border border-transparent px-2 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>

            <Grid container spacing={2}>
              <Grid sx={{ xs: 12, sm: 6 }}>
                <FormTextField
                  name={`foodItems.${index}.name`}
                  control={control}
                  label="Item Name"
                  rules={{ required: "Item name is required" }}
                  fullWidth
                />
              </Grid>
              <Grid sx={{ xs: 6, sm: 3 }}>
                <FormTextField
                  name={`foodItems.${index}.quantity`}
                  control={control}
                  label="Qty"
                  type="number"
                  rules={{
                    required: "Quantity is required",
                    min: { value: 1, message: "Minimum quantity is 1" },
                  }}
                  fullWidth
                />
              </Grid>
              <Grid sx={{ xs: 6, sm: 3 }}>
                <FormTextField
                  name={`foodItems.${index}.price`}
                  control={control}
                  label="Price"
                  type="number"
                  rules={{
                    required: "Price is required",
                    min: { value: 0, message: "Price cannot be negative" },
                  }}
                  fullWidth
                />
              </Grid>
            </Grid>
          </div>
        ))}
      </div>
    </div>
  );
}
