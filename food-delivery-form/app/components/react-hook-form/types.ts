export type FoodDeliveryFormProps = {
  customerName: string;
  mobile: number;
  orderNumber: string;
  email: string;
  orderPaymentOption: string;
  deliveryType: string;
  address: {
    streetAddress: string;
    landmark: string;
    city: string;
    state: string;
  };
};
