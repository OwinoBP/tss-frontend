"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/data/countries";
import { submitCheckoutAction, type CheckoutActionResult } from "@/lib/actions/checkout.actions";
import type { AddressFieldErrors } from "@/lib/checkout-validation";
import { cn } from "@/lib/utils";
import type { Cart } from "@/types/cart";
import type { OrderAddress, PaymentGateway } from "@/types/order";

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * Colocated under `app/checkout/` — single consumer, single route segment
 * (see docs/component-principles.md). Wraps a real `<form action={formAction}>`
 * (via `useActionState`), the same real-form-not-bare-onClick precedent
 * `AddToCartButton` established — order submission itself still works as a
 * plain POST without JavaScript. The "ship to a different address" toggle
 * is the one piece of this form that genuinely needs JS to be interactive
 * (see docs/decisions.md, "Checkout" for why that's an accepted, narrow
 * exception rather than a CSS-only toggle).
 *
 * Required-field/email/country validation happens twice on purpose: HTML5
 * `required`/`type="email"` here for immediate feedback, and again in
 * `lib/checkout-validation.ts` inside the Server Action — confirmed live
 * that WooCommerce itself barely validates checkout input server-side (see
 * docs/decisions.md, "Checkout"), so the second check is load-bearing, not
 * redundant.
 *
 * `submitCheckoutAction` never actually resolves on success — it
 * `redirect()`s to `/checkout/success/[orderNumber]` instead (see that
 * file's top comment for why). `state`/`useActionState` here only ever
 * carries a *rejected* submission's field errors back to this form.
 */
export function CheckoutForm({
  cart,
  paymentGateways,
}: {
  cart: Cart;
  paymentGateways: PaymentGateway[];
}) {
  const [shipToDifferentAddress, setShipToDifferentAddress] = useState(false);

  const [state, formAction, isPending] = useActionState<CheckoutActionResult | null, FormData>(
    submitCheckoutAction,
    null,
  );

  const hasNoGateways = paymentGateways.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {state ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-base font-medium text-foreground">Billing address</legend>
        <AddressFields prefix="billing" errors={state?.billingErrors} requireEmail />
      </fieldset>

      {cart.needsShippingAddress ? (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 text-base font-medium text-foreground">Shipping</legend>

          <label className="flex w-fit items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name="shipToDifferentAddress"
              checked={shipToDifferentAddress}
              onChange={(event) => setShipToDifferentAddress(event.target.checked)}
              className="size-4 rounded border-input"
            />
            Ship to a different address
          </label>

          {shipToDifferentAddress ? (
            <AddressFields prefix="shipping" errors={state?.shippingErrors} requireEmail={false} />
          ) : null}
        </fieldset>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-medium text-foreground">Payment method</legend>

        {hasNoGateways ? (
          <p className="text-sm text-muted-foreground">
            No payment methods are currently available. Please check back soon.
          </p>
        ) : (
          paymentGateways.map((gateway) => (
            <label
              key={gateway.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm has-[:checked]:border-ring"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={gateway.id}
                defaultChecked={paymentGateways.length === 1}
                required
                className="mt-0.5 size-4"
              />
              <span className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{gateway.title}</span>
                {gateway.description ? (
                  <span className="text-xs text-muted-foreground">{gateway.description}</span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </fieldset>

      <Button type="submit" size="lg" disabled={isPending || hasNoGateways}>
        {isPending ? "Placing order…" : "Place order"}
      </Button>
    </form>
  );
}

function AddressFields({
  prefix,
  errors,
  requireEmail,
}: {
  prefix: "billing" | "shipping";
  errors?: AddressFieldErrors;
  requireEmail: boolean;
}) {
  const name = (field: keyof OrderAddress) => `${prefix}.${field}`;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="First name" htmlFor={name("firstName")} error={errors?.firstName}>
        <Input id={name("firstName")} name={name("firstName")} required aria-invalid={Boolean(errors?.firstName)} />
      </Field>
      <Field label="Last name" htmlFor={name("lastName")} error={errors?.lastName}>
        <Input id={name("lastName")} name={name("lastName")} required aria-invalid={Boolean(errors?.lastName)} />
      </Field>

      <Field label="Company (optional)" htmlFor={name("company")} className="sm:col-span-2">
        <Input id={name("company")} name={name("company")} />
      </Field>

      <Field label="Address" htmlFor={name("address1")} error={errors?.address1} className="sm:col-span-2">
        <Input id={name("address1")} name={name("address1")} required aria-invalid={Boolean(errors?.address1)} />
      </Field>
      <Field label="Apartment, suite, etc. (optional)" htmlFor={name("address2")} className="sm:col-span-2">
        <Input id={name("address2")} name={name("address2")} />
      </Field>

      <Field label="City" htmlFor={name("city")} error={errors?.city}>
        <Input id={name("city")} name={name("city")} required aria-invalid={Boolean(errors?.city)} />
      </Field>
      <Field label="State / county (optional)" htmlFor={name("state")}>
        <Input id={name("state")} name={name("state")} />
      </Field>

      <Field label="Postcode" htmlFor={name("postcode")} error={errors?.postcode}>
        <Input id={name("postcode")} name={name("postcode")} required aria-invalid={Boolean(errors?.postcode)} />
      </Field>
      <Field label="Country" htmlFor={name("country")} error={errors?.country}>
        <select
          id={name("country")}
          name={name("country")}
          required
          defaultValue=""
          aria-invalid={Boolean(errors?.country)}
          className={SELECT_CLASSNAME}
        >
          <option value="" disabled>
            Select a country
          </option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={requireEmail ? "Email" : "Email (optional)"} htmlFor={name("email")} error={errors?.email}>
        <Input
          id={name("email")}
          name={name("email")}
          type="email"
          required={requireEmail}
          aria-invalid={Boolean(errors?.email)}
        />
      </Field>
      <Field label="Phone (optional)" htmlFor={name("phone")}>
        <Input id={name("phone")} name={name("phone")} type="tel" />
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
