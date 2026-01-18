import FoodDeliveryForm from "./components/food-delivery-form/FoodDeliveryFormTypical";
import FoodDeliveryFormReactHookForm from "./components/react-hook-form/FoodDeliveryFormReacthOOKfORM";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main>
        <FoodDeliveryForm />
        <FoodDeliveryFormReactHookForm />
      </main>
    </div>
  );
}
