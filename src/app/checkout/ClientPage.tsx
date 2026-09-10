"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Home,
  Loader2,
  MapPin,
  Truck,
} from "lucide-react";

import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";


const STEPS = [
  { id: "address", label: "Address", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "review", label: "Review", icon: Truck },
  { id: "confirmation", label: "Confirmation", icon: CheckCircle2 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface AddressFormData {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface AddressFieldErrors {
  fullName?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface PaymentFormData {
  cardHolder: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface PaymentFieldErrors {
  cardHolder?: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
}

function validateAddress(form: AddressFormData): AddressFieldErrors {
  const errors: AddressFieldErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Full name is required.";
  if (!form.street.trim()) errors.street = "Street address is required.";
  if (!form.city.trim()) errors.city = "City is required.";
  if (!form.state.trim()) errors.state = "State/Province is required.";
  if (!form.postalCode.trim()) errors.postalCode = "Postal code is required.";
  if (!form.country.trim()) errors.country = "Country is required.";
  return errors;
}

function validatePayment(form: PaymentFormData): PaymentFieldErrors {
  const errors: PaymentFieldErrors = {};
  if (!form.cardHolder.trim()) errors.cardHolder = "Card holder name is required.";
  const cardDigits = form.cardNumber.replace(/\s/g, "");
  if (!cardDigits) {
    errors.cardNumber = "Card number is required.";
  } else if (cardDigits.length < 13 || cardDigits.length > 19 || !/^\d+$/.test(cardDigits)) {
    errors.cardNumber = "Enter a valid card number.";
  }
  if (!form.expiry.trim()) {
    errors.expiry = "Expiry date is required.";
  } else if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(form.expiry.replace(/\s/g, ""))) {
    errors.expiry = "Enter a valid MM/YY expiry date.";
  }
  if (!form.cvv.trim()) {
    errors.cvv = "CVV is required.";
  } else if (!/^\d{3,4}$/.test(form.cvv)) {
    errors.cvv = "Enter a valid 3-4 digit CVV.";
  }
  return errors;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

function CheckoutPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Tabs defaultValue="address" className="w-full">
        <TabsList aria-label="Checkout steps" className="grid w-full grid-cols-4 mb-8">
          {STEPS.map((step) => (
            <TabsTrigger key={step.id} value={step.id} disabled>
              <step.icon className="mr-2 h-4 w-4" aria-hidden />
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Card>
          <CardContent className="space-y-6 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { cart, loading: cartLoading, clear } = useCart();

  const [currentStep, setCurrentStep] = React.useState<StepId>("address");
  const [submitting, setSubmitting] = React.useState(false);

  const [addressForm, setAddressForm] = React.useState<AddressFormData>({
    fullName: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United States",
  });
  const [addressErrors, setAddressErrors] = React.useState<AddressFieldErrors>({});
  const [addressTouched, setAddressTouched] = React.useState<Record<keyof AddressFormData, boolean>>({
    fullName: false,
    street: false,
    city: false,
    state: false,
    postalCode: false,
    country: false,
  });

  const [paymentForm, setPaymentForm] = React.useState<PaymentFormData>({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [paymentErrors, setPaymentErrors] = React.useState<PaymentFieldErrors>({});
  const [paymentTouched, setPaymentTouched] = React.useState<Record<keyof PaymentFormData, boolean>>({
    cardHolder: false,
    cardNumber: false,
    expiry: false,
    cvv: false,
  });

  if (authLoading || cartLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <CheckoutPageSkeleton />
      </div>
    );
  }

  if (!user) {
    router.push(`/login?next=/checkout`);
    return null;
  }

  if (!cart || cart.items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleAddressChange = (field: keyof AddressFormData, value: string) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    if (addressTouched[field]) {
      const errors = validateAddress({ ...addressForm, [field]: value });
      setAddressErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  };

  const handleAddressBlur = (field: keyof AddressFormData) => {
    setAddressTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateAddress(addressForm);
    setAddressErrors((prev) => ({ ...prev, [field]: errors[field] }));
  };

  const handleAddressSubmit = () => {
    const errors = validateAddress(addressForm);
    setAddressErrors(errors);
    setAddressTouched({
      fullName: true,
      street: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
    });
    if (!errors.fullName && !errors.street && !errors.city && !errors.state && !errors.postalCode && !errors.country) {
      setCurrentStep("payment");
    }
  };

  const handlePaymentChange = (field: keyof PaymentFormData, value: string) => {
    let formattedValue = value;
    if (field === "cardNumber") formattedValue = formatCardNumber(value);
    if (field === "expiry") formattedValue = formatExpiry(value);
    if (field === "cvv") formattedValue = value.replace(/\D/g, "").slice(0, 4);

    setPaymentForm((prev) => ({ ...prev, [field]: formattedValue }));
    if (paymentTouched[field]) {
      const errors = validatePayment({ ...paymentForm, [field]: formattedValue });
      setPaymentErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  };

  const handlePaymentBlur = (field: keyof PaymentFormData) => {
    setPaymentTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validatePayment(paymentForm);
    setPaymentErrors((prev) => ({ ...prev, [field]: errors[field] }));
  };

  const handlePaymentSubmit = () => {
    const errors = validatePayment(paymentForm);
    setPaymentErrors(errors);
    setPaymentTouched({
      cardHolder: true,
      cardNumber: true,
      expiry: true,
      cvv: true,
    });
    if (!errors.cardHolder && !errors.cardNumber && !errors.expiry && !errors.cvv) {
      setCurrentStep("review");
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    try {
      await api.post<void>("/cart/checkout");
      await clear();
      setCurrentStep("confirmation");
      toast({ title: "Order placed!", description: "Your order is being processed." });
    } catch (error) {
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Could not place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8 flex items-center justify-center">
      <ol className="flex items-center" aria-label="Checkout progress">
        {STEPS.map((step, index) => {
          const isActive = STEPS.findIndex((s) => s.id === currentStep) >= index;
          const isCompleted = STEPS.findIndex((s) => s.id === currentStep) > index;
          const StepIcon = step.icon;
          return (
            <li key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                aria-current={step.id === currentStep ? "step" : undefined}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                ) : (
                  <StepIcon className="h-5 w-5" aria-hidden />
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-1 w-16 mx-2 transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "hidden text-sm font-medium sm:block",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );

  const renderAddressStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
        <CardDescription>
          Enter the address where your order should be delivered.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleAddressSubmit(); }} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                value={addressForm.fullName}
                onChange={(e) => handleAddressChange("fullName", e.target.value)}
                onBlur={() => handleAddressBlur("fullName")}
                aria-invalid={addressTouched.fullName && addressErrors.fullName ? true : undefined}
                aria-describedby={addressTouched.fullName && addressErrors.fullName ? "fullName-error" : undefined}
                placeholder="John Doe"
              />
              {addressTouched.fullName && addressErrors.fullName && (
                <p id="fullName-error" className="text-sm text-destructive" role="alert">
                  {addressErrors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                name="street"
                autoComplete="street-address"
                required
                value={addressForm.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                onBlur={() => handleAddressBlur("street")}
                aria-invalid={addressTouched.street && addressErrors.street ? true : undefined}
                aria-describedby={addressTouched.street && addressErrors.street ? "street-error" : undefined}
                placeholder="123 Main Street, Apt 4B"
              />
              {addressTouched.street && addressErrors.street && (
                <p id="street-error" className="text-sm text-destructive" role="alert">
                  {addressErrors.street}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                autoComplete="address-level2"
                required
                value={addressForm.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                onBlur={() => handleAddressBlur("city")}
                aria-invalid={addressTouched.city && addressErrors.city ? true : undefined}
                aria-describedby={addressTouched.city && addressErrors.city ? "city-error" : undefined}
                placeholder="New York"
              />
              {addressTouched.city && addressErrors.city && (
                <p id="city-error" className="text-sm text-destructive" role="alert">
                  {addressErrors.city}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State / Province</Label>
              <Input
                id="state"
                name="state"
                autoComplete="address-level1"
                required
                value={addressForm.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                onBlur={() => handleAddressBlur("state")}
                aria-invalid={addressTouched.state && addressErrors.state ? true : undefined}
                aria-describedby={addressTouched.state && addressErrors.state ? "state-error" : undefined}
                placeholder="NY"
              />
              {addressTouched.state && addressErrors.state && (
                <p id="state-error" className="text-sm text-destructive" role="alert">
                  {addressErrors.state}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                name="postalCode"
                autoComplete="postal-code"
                required
                value={addressForm.postalCode}
                onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                onBlur={() => handleAddressBlur("postalCode")}
                aria-invalid={addressTouched.postalCode && addressErrors.postalCode ? true : undefined}
                aria-describedby={addressTouched.postalCode && addressErrors.postalCode ? "postalCode-error" : undefined}
                placeholder="10001"
              />
              {addressTouched.postalCode && addressErrors.postalCode && (
                <p id="postalCode-error" className="text-sm text-destructive" role="alert">
                  {addressErrors.postalCode}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                autoComplete="country"
                required
                value={addressForm.country}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                onBlur={() => handleAddressBlur("country")}
                aria-invalid={addressTouched.country && addressErrors.country ? true : undefined}
                aria-describedby={addressTouched.country && addressErrors.country ? "country-error" : undefined}
                placeholder="United States"
              />
              {addressTouched.country && addressErrors.country && (
                <p id="country-error" className="text-sm text-destructive" role="alert">
                  {addressErrors.country}
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleAddressSubmit} disabled={submitting}>
          Continue to Payment
          <ChevronRight className="ml-2 h-4 w-4" aria-hidden />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>
          Enter your payment information. This is a simulated form — no real charges will be made.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handlePaymentSubmit(); }} noValidate>
          <div className="space-y-2">
            <Label htmlFor="cardHolder">Card Holder Name</Label>
            <Input
              id="cardHolder"
              name="cardHolder"
              autoComplete="cc-name"
              required
              value={paymentForm.cardHolder}
              onChange={(e) => handlePaymentChange("cardHolder", e.target.value)}
              onBlur={() => handlePaymentBlur("cardHolder")}
              aria-invalid={paymentTouched.cardHolder && paymentErrors.cardHolder ? true : undefined}
              aria-describedby={paymentTouched.cardHolder && paymentErrors.cardHolder ? "cardHolder-error" : undefined}
              placeholder="John Doe"
            />
            {paymentTouched.cardHolder && paymentErrors.cardHolder && (
              <p id="cardHolder-error" className="text-sm text-destructive" role="alert">
                {paymentErrors.cardHolder}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              name="cardNumber"
              autoComplete="cc-number"
              required
              value={paymentForm.cardNumber}
              onChange={(e) => handlePaymentChange("cardNumber", e.target.value)}
              onBlur={() => handlePaymentBlur("cardNumber")}
              aria-invalid={paymentTouched.cardNumber && paymentErrors.cardNumber ? true : undefined}
              aria-describedby={paymentTouched.cardNumber && paymentErrors.cardNumber ? "cardNumber-error" : undefined}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              inputMode="numeric"
            />
            {paymentTouched.cardNumber && paymentErrors.cardNumber && (
              <p id="cardNumber-error" className="text-sm text-destructive" role="alert">
                {paymentErrors.cardNumber}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry (MM/YY)</Label>
              <Input
                id="expiry"
                name="expiry"
                autoComplete="cc-exp"
                required
                value={paymentForm.expiry}
                onChange={(e) => handlePaymentChange("expiry", e.target.value)}
                onBlur={() => handlePaymentBlur("expiry")}
                aria-invalid={paymentTouched.expiry && paymentErrors.expiry ? true : undefined}
                aria-describedby={paymentTouched.expiry && paymentErrors.expiry ? "expiry-error" : undefined}
                placeholder="12/28"
                maxLength={5}
              />
              {paymentTouched.expiry && paymentErrors.expiry && (
                <p id="expiry-error" className="text-sm text-destructive" role="alert">
                  {paymentErrors.expiry}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                name="cvv"
                autoComplete="cc-csc"
                required
                type="password"
                value={paymentForm.cvv}
                onChange={(e) => handlePaymentChange("cvv", e.target.value)}
                onBlur={() => handlePaymentBlur("cvv")}
                aria-invalid={paymentTouched.cvv && paymentErrors.cvv ? true : undefined}
                aria-describedby={paymentTouched.cvv && paymentErrors.cvv ? "cvv-error" : undefined}
                placeholder="123"
                maxLength={4}
                inputMode="numeric"
              />
              {paymentTouched.cvv && paymentErrors.cvv && (
                <p id="cvv-error" className="text-sm text-destructive" role="alert">
                  {paymentErrors.cvv}
                </p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep("address")} disabled={submitting}>
          <ChevronRight className="mr-2 h-4 w-4 rotate-180" aria-hidden />
          Back
        </Button>
        <Button onClick={handlePaymentSubmit} disabled={submitting}>
          Review Order
          <ChevronRight className="ml-2 h-4 w-4" aria-hidden />
        </Button>
      </CardFooter>
    </Card>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
          <CardDescription>Review your items before placing the order.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {item.productName || `Product #${item.productId}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <span className="font-medium tabular-nums whitespace-nowrap">
                  {formatCurrency(item.totalPrice)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipping Address</CardTitle>
        </CardHeader>
        <CardContent>
          <address className="not-italic space-y-1">
            <p className="font-medium">{addressForm.fullName}</p>
            <p>{addressForm.street}</p>
            <p>
              {addressForm.city}, {addressForm.state} {addressForm.postalCode}
            </p>
            <p>{addressForm.country}</p>
          </address>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-medium">{paymentForm.cardHolder}</p>
          <p className="text-muted-foreground">
            •••• •••• •••• {paymentForm.cardNumber.slice(-4)}
          </p>
          <p className="text-muted-foreground">Expires {paymentForm.expiry}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal ({cart.items.length} items)</span>
            <span className="tabular-nums">{formatCurrency(cart.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span className="tabular-nums">{formatCurrency(cart.tax)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(cart.total)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button
            onClick={handlePlaceOrder}
            disabled={submitting}
            size="lg"
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Placing Order…
              </>
            ) : (
              "Place Order"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentStep("payment")}
            disabled={submitting}
            className="w-full"
          >
            <ChevronRight className="mr-2 h-4 w-4 rotate-180" aria-hidden />
            Back to Payment
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderConfirmationStep = () => (
    <Card className="text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden />
        </div>
        <CardTitle className="text-2xl">Order Placed!</CardTitle>
        <CardDescription>
          Thank you for your order. Your order is being processed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Since the order is created asynchronously, you won&apos;t receive an order number immediately.
          You&apos;ll receive a confirmation email once the order is confirmed.
        </p>
        <div className="text-sm text-muted-foreground">
          Order total: <span className="font-semibold">{formatCurrency(cart.total)}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-3">
        <Button asChild size="lg" className="w-full max-w-xs">
          <Link href="/orders">
            View Your Orders
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full max-w-xs">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" aria-hidden />
            Continue Shopping
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-1 text-muted-foreground">
          Complete your purchase in a few simple steps.
        </p>
      </div>

      {renderStepIndicator()}

      <Tabs value={currentStep} onValueChange={(value: string) => setCurrentStep(value as StepId)} className="w-full">
        <TabsList aria-label="Checkout steps" className="hidden grid w-full grid-cols-4 mb-8 sm:grid">
          {STEPS.map((step) => (
            <TabsTrigger key={step.id} value={step.id} disabled>
              <step.icon className="mr-2 h-4 w-4" aria-hidden />
              {step.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="address" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          {renderAddressStep()}
        </TabsContent>
        <TabsContent value="payment" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          {renderPaymentStep()}
        </TabsContent>
        <TabsContent value="review" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          {renderReviewStep()}
        </TabsContent>
        <TabsContent value="confirmation" className="focus-visible:ring-0 focus-visible:ring-offset-0">
          {renderConfirmationStep()}
        </TabsContent>
      </Tabs>
    </div>
  );
}