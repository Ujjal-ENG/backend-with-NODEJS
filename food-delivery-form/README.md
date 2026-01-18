# Food Delivery Form

This project is a food delivery form built with Next.js, Material-UI, and React Hook Form.

## Technologies Used

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Material-UI](https://mui.com/)
- [React Hook Form](https://react-hook-form.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `app/page.tsx`: The main entry point of the application.
- `app/components/react-hook-form/`: Contains the form components.
  - `FoodDeliveryFormReacthOOKfORM.tsx`: The main form component that assembles the different sections.
  - `FoodDeliveryMaster.tsx`: The component for customer information.
  - `AddressSection.tsx`: The component for the delivery address.
  - `CheckoutSection.tsx`: The component for payment and delivery options.
- `app/types/`: Contains the TypeScript types for the application.
- `app/utils/`: Contains utility functions.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.