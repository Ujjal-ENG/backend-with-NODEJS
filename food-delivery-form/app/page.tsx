import FoodDeliveryFormReactHookForm from "./components/react-hook-form/FoodDeliveryFormReacthOOKfORM";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans ">
      <main className="flex gap-2.5">
        {/* <FoodDeliveryForm /> */}
        <FoodDeliveryFormReactHookForm />
      </main>
    </div>
  );
}
