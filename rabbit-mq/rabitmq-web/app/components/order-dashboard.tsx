"use client";

import {
  FormEvent,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3001";

const PRODUCT_CATALOG = [
  {
    sku: "starter-kit",
    name: "Starter Kit",
    description: "Basic onboarding package for a first RabbitMQ workflow.",
    unitPrice: 49,
  },
  {
    sku: "priority-pack",
    name: "Priority Pack",
    description:
      "Higher-value order to highlight multiple downstream services.",
    unitPrice: 89,
  },
  {
    sku: "ops-bundle",
    name: "Ops Bundle",
    description:
      "Large order that is good for fulfillment and analytics demos.",
    unitPrice: 129,
  },
] as const;

const SERVICE_LANES = [
  {
    name: "Orders API",
    description: "Receives checkout payloads and publishes `order.created`.",
  },
  {
    name: "Payment Service",
    description: "Consumes the order event and approves payment.",
  },
  {
    name: "Inventory Service",
    description: "Reserves stock after payment succeeds.",
  },
  {
    name: "Fulfillment Service",
    description: "Marks the package ready for warehouse processing.",
  },
  {
    name: "Notification Service",
    description:
      "Sends the confirmation email after fulfillment accepts the order.",
  },
] as const;

type OrderStatus =
  | "CREATED"
  | "PAYMENT_APPROVED"
  | "INVENTORY_RESERVED"
  | "READY_FOR_FULFILLMENT"
  | "NOTIFICATION_SENT";

interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderTimelineEvent {
  id: string;
  type: string;
  title: string;
  detail: string;
  service: string;
  happenedAt: string;
}

interface OrderRecord {
  id: string;
  customerName: string;
  email: string;
  address: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimelineEvent[];
  publishFailures: string[];
  crashedConsumer: string | null;
}

interface DashboardData {
  rabbitMq: {
    enabled: boolean;
    connected: boolean;
    url: string;
    exchange: string;
    queues: string[];
  };
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    stageCounts: Record<OrderStatus, number>;
    totalRevenue: number;
    totalEventsProcessed: number;
    lastEventAt: string | null;
  };
  recentOrders: OrderRecord[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function OrderDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [customerName, setCustomerName] = useState("Ujjal Roy");
  const [email, setEmail] = useState("ujjal@example.com");
  const [address, setAddress] = useState("Dhaka, Bangladesh");
  const [notes, setNotes] = useState(
    "Please email the order confirmation after inventory is reserved.",
  );
  const [productSku, setProductSku] =
    useState<(typeof PRODUCT_CATALOG)[number]["sku"]>("priority-pack");
  const [quantity, setQuantity] = useState(2);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const selectedProduct =
    PRODUCT_CATALOG.find((product) => product.sku === productSku) ??
    PRODUCT_CATALOG[0];
  const activeOrderId = selectedOrder?.id;
  const activeOrderStatus = selectedOrder?.status;

  const loadDashboard = useEffectEvent(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Dashboard request failed.");
      }

      const payload = (await response.json()) as DashboardData;
      setDashboard(payload);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to load dashboard data.";
      setError(message);
    }
  });

  const loadOrder = useEffectEvent(async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Order request failed.");
      }

      const payload = (await response.json()) as OrderRecord;
      setSelectedOrder(payload);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Unable to refresh order timeline.";
      setError(message);
    }
  });

  useEffect(() => {
    void loadDashboard();

    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!activeOrderId || activeOrderStatus === "NOTIFICATION_SENT") {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadOrder(activeOrderId);
      void loadDashboard();
    }, 1400);

    return () => window.clearInterval(intervalId);
  }, [activeOrderId, activeOrderStatus]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName,
          email,
          address,
          notes,
          items: [
            {
              sku: selectedProduct.sku,
              name: selectedProduct.name,
              quantity,
              unitPrice: selectedProduct.unitPrice,
            },
          ],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          message?: string | string[];
        };
        const message = Array.isArray(payload.message)
          ? payload.message.join(", ")
          : (payload.message ?? "Order creation failed.");
        throw new Error(message);
      }

      const order = (await response.json()) as OrderRecord;

      startTransition(() => {
        setSelectedOrder(order);
        setFeedback(`Order ${order.id} was published to RabbitMQ.`);
      });
      const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard`, {
        cache: "no-store",
      });

      if (dashboardResponse.ok) {
        const dashboardPayload =
          (await dashboardResponse.json()) as DashboardData;
        setDashboard(dashboardPayload);
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create the order.";
      setError(message);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-4xl border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(255,211,118,0.34),transparent_32%),linear-gradient(145deg,rgba(12,24,38,0.96),rgba(26,48,52,0.92))] p-7 shadow-[0_30px_90px_rgba(4,10,18,0.45)] sm:p-9">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(85,195,157,0.22),transparent_65%)]" />
          <div className="relative flex flex-col gap-8">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.28em] text-[#f4d38a]">
                RabbitMQ Practice Project
              </span>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
                  Order processing with queue-driven backend services.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  Submit a storefront order, publish `order.created`, and watch
                  payment, inventory, fulfillment, and notification services
                  move it through the workflow.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Orders Created"
                value={String(dashboard?.stats.totalOrders ?? 0)}
                accent="text-[#ffd376]"
              />
              <MetricCard
                label="Events Processed"
                value={String(dashboard?.stats.totalEventsProcessed ?? 0)}
                accent="text-[#78f0d4]"
              />
              <MetricCard
                label="Revenue Simulated"
                value={currencyFormatter.format(
                  dashboard?.stats.totalRevenue ?? 0,
                )}
                accent="text-[#9fe870]"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {SERVICE_LANES.map((service) => (
                <article
                  key={service.name}
                  className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur"
                >
                  <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-white/80">
                    {service.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {service.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-4xl border border-[#19304a] bg-[#081521]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[#8fb0c7]">
                Create Order
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                Publish a new message
              </h2>
            </div>
            <StatusPill
              connected={dashboard?.rabbitMq.connected ?? false}
              enabled={dashboard?.rabbitMq.enabled ?? false}
            />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Customer Name">
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className={inputClassName}
                placeholder="Customer name"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClassName}
                  placeholder="name@example.com"
                  type="email"
                />
              </Field>
              <Field label="Quantity">
                <input
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(Number(event.target.value) || 1)
                  }
                  className={inputClassName}
                  min={1}
                  type="number"
                />
              </Field>
            </div>

            <Field label="Address">
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className={inputClassName}
                placeholder="Shipping or billing address"
              />
            </Field>

            <Field label="Product">
              <select
                value={productSku}
                onChange={(event) =>
                  startTransition(() =>
                    setProductSku(
                      event.target
                        .value as (typeof PRODUCT_CATALOG)[number]["sku"],
                    ),
                  )
                }
                className={inputClassName}
              >
                {PRODUCT_CATALOG.map((product) => (
                  <option key={product.sku} value={product.sku}>
                    {product.name} ·{" "}
                    {currencyFormatter.format(product.unitPrice)}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className={`${inputClassName} min-h-28 resize-none`}
                placeholder="Optional order note"
              />
            </Field>

            <div className="rounded-2xl border border-[#23405f] bg-[#0b1d2c] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-[#8fb0c7]">
                    Selected SKU
                  </p>
                  <h3 className="mt-1 text-xl font-medium text-white">
                    {selectedProduct.name}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedProduct.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm uppercase tracking-[0.22em] text-[#8fb0c7]">
                    Total
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#ffd376]">
                    {currencyFormatter.format(
                      selectedProduct.unitPrice * quantity,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <button
              className="flex w-full items-center justify-center rounded-full bg-[#ffd376] px-5 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#091018] transition hover:bg-[#ffe09a] disabled:cursor-not-allowed disabled:opacity-65"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Publishing..." : "Create Order"}
            </button>
          </form>

          {feedback ? (
            <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {feedback}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <ChaosPanel apiBase={API_BASE_URL} />
        </section>
      </section>

      <RabbitMqFlowDiagram
        activeStatus={selectedOrder?.status ?? null}
        publishFailures={selectedOrder?.publishFailures ?? []}
        crashedConsumer={selectedOrder?.crashedConsumer ?? null}
      />

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-[#1c3143] bg-[#0b1520]/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#8fb0c7]">
                Latest Order
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                Timeline
              </h2>
            </div>
            {selectedOrder ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/80">
                {selectedOrder.status.replaceAll("_", " ")}
              </span>
            ) : null}
          </div>

          {selectedOrder ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-[#203445] bg-[#0f1c28] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#8fb0c7]">
                      Order Reference
                    </p>
                    <h3 className="mt-2 text-2xl font-medium text-white">
                      {selectedOrder.id}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      {selectedOrder.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#8fb0c7]">
                      Updated
                    </p>
                    <p className="mt-2 text-sm text-slate-200">
                      {formatDateTime(selectedOrder.updatedAt)}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#ffd376]">
                      {currencyFormatter.format(selectedOrder.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedOrder.timeline.map((event, index) => (
                  <TimelineEvent
                    key={event.id}
                    event={event}
                    index={index}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyState message="Create an order to start the RabbitMQ workflow and stream status updates here." />
          )}
        </div>

        <div className="grid gap-6">
          <section className="rounded-[28px] border border-[#1c3143] bg-[#0b1520]/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#8fb0c7]">
                  Queue State
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                  RabbitMQ topology
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/80">
                {dashboard?.rabbitMq.exchange ?? "orders.topic"}
              </span>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {(dashboard?.rabbitMq.queues ?? []).map((queue) => (
                <article
                  key={queue}
                  className="rounded-2xl border border-[#203445] bg-[#0f1c28] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-[#8fb0c7]">
                    Queue
                  </p>
                  <h3 className="mt-2 text-lg font-medium text-white">
                    {queue}
                  </h3>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#1c3143] bg-[#0b1520]/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#8fb0c7]">
                  Recent Orders
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
                  Storefront activity
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {dashboard?.recentOrders.length ? (
                dashboard.recentOrders.map((order) => (
                  <button
                    key={order.id}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#203445] bg-[#0f1c28] px-4 py-4 text-left transition hover:border-[#2d5273] hover:bg-[#112234]"
                    onClick={() => setSelectedOrder(order)}
                    type="button"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-[#8fb0c7]">
                        {order.id}
                      </p>
                      <p className="mt-2 text-lg font-medium text-white">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {order.status.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-[#ffd376]">
                        {currencyFormatter.format(order.totalAmount)}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {formatDateTime(order.createdAt)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <EmptyState message="No orders yet. Submit the form above to seed the dashboard." />
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-[#8fb0c7]">
        {label}
      </span>
      {children}
    </label>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: Readonly<{
  label: string;
  value: string;
  accent: string;
}>) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.24em] text-white/60">
        {label}
      </p>
      <p className={`mt-3 text-3xl font-semibold tracking-[-0.04em] ${accent}`}>
        {value}
      </p>
    </article>
  );
}

function StatusPill({
  enabled,
  connected,
}: Readonly<{
  enabled: boolean;
  connected: boolean;
}>) {
  const label = !enabled
    ? "Disabled"
    : connected
      ? "Connected"
      : "Disconnected";
  const styles = !enabled
    ? "border-white/10 bg-white/5 text-white/70"
    : connected
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : "border-amber-400/30 bg-amber-400/10 text-amber-200";

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.22em] ${styles}`}
    >
      RabbitMQ {label}
    </span>
  );
}

function EmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-[#203445] bg-[#0f1c28] p-6 text-sm leading-7 text-slate-300">
      {message}
    </div>
  );
}

function TimelineEvent({
  event,
  index,
}: Readonly<{ event: OrderTimelineEvent; index: number }>) {
  const type = event.type;
  const isCrash = type === "consumer.crash";
  const isRecovered = type === "consumer.recovered";
  const isDeadLettered = type === "consumer.dead-lettered";
  const isPublishFailed = type === "publish.failed";

  const borderClass = isCrash
    ? "border-orange-400/30 bg-[#1a0e00]"
    : isDeadLettered || isPublishFailed
      ? "border-rose-400/30 bg-[#1a0808]"
      : isRecovered
        ? "border-[#78f0d4]/25 bg-[#0b2420]"
        : "border-[#1f3347] bg-[#0b1824]";

  const badgeClass = isCrash
    ? "bg-orange-500 text-white"
    : isDeadLettered || isPublishFailed
      ? "bg-rose-500 text-white"
      : isRecovered
        ? "bg-[#78f0d4] text-[#081018]"
        : "bg-[#78f0d4] text-[#081018]";

  const badgeSymbol = isCrash
    ? "↺"
    : isDeadLettered || isPublishFailed
      ? "✗"
      : isRecovered
        ? "✓"
        : index + 1;

  const titleClass = isCrash
    ? "text-orange-300"
    : isDeadLettered || isPublishFailed
      ? "text-rose-300"
      : isRecovered
        ? "text-[#78f0d4]"
        : "text-white";

  const serviceClass = isCrash
    ? "text-orange-400/80"
    : isDeadLettered || isPublishFailed
      ? "text-rose-400/80"
      : "text-[#8fb0c7]";

  return (
    <article
      className={`relative rounded-2xl border p-4 pl-14 ${borderClass}`}
    >
      <span
        className={`absolute left-5 top-5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${badgeClass}`}
      >
        {badgeSymbol}
      </span>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`text-lg font-medium ${titleClass}`}>
            {event.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-300">{event.detail}</p>
        </div>
        <div className={`text-right text-xs uppercase tracking-[0.18em] ${serviceClass}`}>
          <p>{event.service}</p>
          <p className="mt-2 text-[11px] tracking-[0.16em] text-slate-400">
            {formatDateTime(event.happenedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

function ChaosPanel({ apiBase }: Readonly<{ apiBase: string }>) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function triggerCrash() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`${apiBase}/debug/crash-notification`, {
        method: "POST",
      });
      const data = (await res.json()) as { pendingCrashes: number };
      setStatus(
        `Scheduled. Next ${data.pendingCrashes} notification delivery will NACK + requeue.`,
      );
    } catch {
      setStatus("Failed to reach API.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-orange-400/20 bg-[#130d00] p-5">
      <p className="mb-1 text-xs uppercase tracking-[0.26em] text-orange-400/80">
        Chaos Engineering
      </p>
      <p className="mb-4 text-sm leading-6 text-slate-300">
        Simulate a notification-service crash. The consumer will throw, RabbitMQ
        will receive{" "}
        <code className="rounded bg-white/8 px-1 font-mono text-xs text-orange-300">
          NACK requeue=true
        </code>{" "}
        and redeliver the message. Up to{" "}
        <code className="rounded bg-white/8 px-1 font-mono text-xs text-rose-300">
          2 retries
        </code>{" "}
        before dead-lettering.
      </p>
      <button
        onClick={triggerCrash}
        disabled={busy}
        className="flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300 transition hover:bg-orange-500/25 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
      >
        <span>↯</span>
        {busy ? "Scheduling…" : "Crash Notification Service"}
      </button>
      {status ? (
        <p className="mt-3 text-xs text-orange-300/80">{status}</p>
      ) : null}
    </div>
  );
}

// ─── RabbitMQ flow diagram ────────────────────────────────────────────────────

const WORKFLOW_STEPS: Array<{
  step: number;
  publisher: string;
  routingKey: string;
  queue: string;
  consumer: string;
  /** The order status that means this step has been completed. */
  completedWhen: OrderStatus;
}> = [
  {
    step: 1,
    publisher: "orders-api",
    routingKey: "order.created",
    queue: "orders.payments",
    consumer: "payment-service",
    completedWhen: "PAYMENT_APPROVED",
  },
  {
    step: 2,
    publisher: "payment-service",
    routingKey: "order.payment-approved",
    queue: "orders.inventory",
    consumer: "inventory-service",
    completedWhen: "INVENTORY_RESERVED",
  },
  {
    step: 3,
    publisher: "inventory-service",
    routingKey: "order.inventory-reserved",
    queue: "orders.fulfillment",
    consumer: "fulfillment-service",
    completedWhen: "READY_FOR_FULFILLMENT",
  },
  {
    step: 4,
    publisher: "fulfillment-service",
    routingKey: "order.ready-for-fulfillment",
    queue: "orders.notifications",
    consumer: "notification-service",
    completedWhen: "NOTIFICATION_SENT",
  },
];

const STATUS_ORDER: OrderStatus[] = [
  "CREATED",
  "PAYMENT_APPROVED",
  "INVENTORY_RESERVED",
  "READY_FOR_FULFILLMENT",
  "NOTIFICATION_SENT",
];

function stepState(
  ws: (typeof WORKFLOW_STEPS)[number],
  activeStatus: OrderStatus | null,
  publishFailures: string[],
  crashedConsumer: string | null,
): "done" | "active" | "pending" | "failed" | "crashed" {
  if (publishFailures.includes(ws.routingKey)) return "failed";
  if (crashedConsumer === ws.consumer) return "crashed";
  if (!activeStatus) return "pending";
  const statusIdx = STATUS_ORDER.indexOf(activeStatus);
  const doneIdx = STATUS_ORDER.indexOf(ws.completedWhen);
  if (statusIdx >= doneIdx) return "done";
  // The step *before* completedWhen is the one currently running
  if (statusIdx === doneIdx - 1) return "active";
  return "pending";
}

function RabbitMqFlowDiagram({
  activeStatus,
  publishFailures,
  crashedConsumer,
}: {
  activeStatus: OrderStatus | null;
  publishFailures: string[];
  crashedConsumer: string | null;
}) {
  const hasFailed = publishFailures.length > 0;

  return (
    <section className="rounded-[28px] border border-[#1c3143] bg-[#0b1520]/90 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)] sm:p-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#8fb0c7]">
            Live topology
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
            RabbitMQ message flow
          </h2>
        </div>
        <div className="flex items-center gap-5 text-xs uppercase tracking-[0.18em]">
          <span className="flex items-center gap-2 text-[#78f0d4]">
            <span className="h-2 w-2 rounded-full bg-[#78f0d4]" />
            Done
          </span>
          <span className="flex items-center gap-2 text-[#ffd376]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ffd376]" />
            Active
          </span>
          <span className="flex items-center gap-2 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-600" />
            Pending
          </span>
          <span className="flex items-center gap-2 text-orange-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            Crashed
          </span>
          <span className="flex items-center gap-2 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Failed
          </span>
        </div>
      </div>

      {/* Exchange badge */}
      <div className="mb-5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd376]/30 bg-[#ffd376]/10 px-4 py-2">
          <span className="text-xs uppercase tracking-[0.22em] text-[#8fb0c7]">
            Exchange
          </span>
          <span className="font-mono text-sm font-medium text-[#ffd376]">
            orders.topic
          </span>
        </div>
      </div>

      {/* Main pipeline */}
      <div className="flex flex-col gap-3">
        {WORKFLOW_STEPS.map((ws) => {
          const state = stepState(ws, activeStatus, publishFailures, crashedConsumer);
          return <FlowStep key={ws.step} step={ws} state={state} />;
        })}

        {/* Analytics wildcard row */}
        <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-[#1f3347] bg-[#0b1824] p-4">
          <span className="shrink-0 rounded-full bg-[#1c3040] px-2 py-0.5 font-mono text-[11px] text-slate-400">
            order.*
          </span>
          <FlowArrow />
          <span className="shrink-0 rounded-xl border border-[#203445] bg-[#112030] px-3 py-1.5 font-mono text-xs text-slate-300">
            orders.analytics
          </span>
          <FlowArrow />
          <span className="shrink-0 rounded-xl border border-[#203445] bg-[#112030] px-3 py-1.5 font-mono text-xs text-slate-300">
            analytics-service
          </span>
          <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-slate-500">
            wildcard · all events
          </span>
        </div>

        {/* ACK / NACK explainer */}
        <div className="mt-4 rounded-2xl border border-[#1c3143] bg-[#060f1a] p-5">
          <p className="mb-4 text-xs uppercase tracking-[0.26em] text-[#8fb0c7]">
            How ACK / NACK works
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-xl border border-[#78f0d4]/20 bg-[#0b2420] p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#78f0d4] text-xs font-bold text-[#081018]">
                ✓
              </span>
              <div>
                <p className="font-mono text-xs font-medium text-[#78f0d4]">
                  channel.ack(msg)
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Consumer processed successfully. RabbitMQ removes the message
                  from the queue permanently.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-orange-400/20 bg-[#1a1000] p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                ↺
              </span>
              <div>
                <p className="font-mono text-xs font-medium text-orange-300">
                  nack(msg, requeue=true)
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Consumer crashed. Message is returned to the queue head and
                  redelivered. Use for transient failures.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-rose-400/20 bg-[#1a0808] p-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                ✗
              </span>
              <div>
                <p className="font-mono text-xs font-medium text-rose-300">
                  nack(msg, requeue=false)
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  Max retries exhausted. Message is dropped or routed to a
                  dead-letter exchange for manual inspection.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dead letter queue — visible only when a publish failed */}
        {hasFailed ? (
          <div className="mt-2 flex flex-wrap items-start gap-3 rounded-2xl border border-rose-400/30 bg-[#1a0808] p-4">
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-500 text-xs font-semibold text-white">
                ✗
              </span>
              <span className="font-mono text-xs text-rose-400">
                publish failed
              </span>
            </div>
            <span className="shrink-0 text-slate-600">→</span>
            <span className="shrink-0 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-1.5 font-mono text-xs text-rose-300">
              orders.dead-letter
            </span>
            <div className="ml-2 flex flex-wrap gap-2">
              {publishFailures.map((key) => (
                <span
                  key={key}
                  className="rounded-full border border-rose-500/25 bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] text-rose-300"
                >
                  {key}
                </span>
              ))}
            </div>
            <p className="w-full text-[11px] leading-5 text-slate-400">
              Channel unavailable when these messages were published. In
              production a dead-letter exchange catches unrouted messages so
              they can be replayed or inspected.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FlowStep({
  step,
  state,
}: {
  step: (typeof WORKFLOW_STEPS)[number];
  state: "done" | "active" | "pending" | "failed" | "crashed";
}) {
  const borderColor =
    state === "done"
      ? "border-[#78f0d4]/30"
      : state === "active"
        ? "border-[#ffd376]/40"
        : state === "failed"
          ? "border-rose-400/40"
          : state === "crashed"
            ? "border-orange-400/40"
            : "border-[#1f3347]";

  const bgColor =
    state === "done"
      ? "bg-[#0b2420]"
      : state === "active"
        ? "bg-[#1a1a08]"
        : state === "failed"
          ? "bg-[#1a0808]"
          : state === "crashed"
            ? "bg-[#1a0e00]"
            : "bg-[#0b1824]";

  const stepNumColor =
    state === "done"
      ? "bg-[#78f0d4] text-[#081018]"
      : state === "active"
        ? "bg-[#ffd376] text-[#091018]"
        : state === "failed"
          ? "bg-rose-500 text-white"
          : state === "crashed"
            ? "bg-orange-500 text-white animate-pulse"
            : "bg-[#1a2d3d] text-slate-400";

  const routingKeyColor =
    state === "done"
      ? "bg-[#0e2e25] text-[#78f0d4] border-[#78f0d4]/20"
      : state === "active"
        ? "bg-[#2a1f00] text-[#ffd376] border-[#ffd376]/25 animate-pulse"
        : state === "failed"
          ? "bg-rose-500/10 text-rose-300 border-rose-400/25 animate-pulse"
          : state === "crashed"
            ? "bg-orange-500/10 text-orange-300 border-orange-400/25"
            : "bg-[#0f1c28] text-slate-500 border-[#1f3347]";

  const queueColor =
    state === "done"
      ? "border-[#78f0d4]/20 bg-[#0e2e25] text-[#78f0d4]"
      : state === "active"
        ? "border-[#ffd376]/25 bg-[#2a1f00] text-[#ffd376]"
        : state === "failed"
          ? "border-rose-400/25 bg-rose-500/10 text-rose-300"
          : state === "crashed"
            ? "border-orange-400/25 bg-orange-500/10 text-orange-300"
            : "border-[#203445] bg-[#0f1c28] text-slate-400";

  const consumerColor =
    state === "crashed"
      ? "border-orange-400/25 bg-orange-500/10 text-orange-300"
      : "border-[#203445] bg-[#0f1c28] text-slate-300";

  const stateLabelColor =
    state === "done"
      ? "text-[#78f0d4]"
      : state === "active"
        ? "text-[#ffd376]"
        : state === "failed"
          ? "text-rose-400"
          : state === "crashed"
            ? "text-orange-400"
            : "text-slate-600";

  const stateSymbol =
    state === "done"
      ? "✓"
      : state === "failed"
        ? "✗"
        : state === "crashed"
          ? "↺"
          : step.step;

  const stateLabel =
    state === "crashed" ? "NACK ↺ retry" : state;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-2xl border p-3 transition-colors duration-500 sm:flex-nowrap sm:gap-3 ${borderColor} ${bgColor}`}
    >
      {/* Step number */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${stepNumColor}`}
      >
        {stateSymbol}
      </span>

      {/* Publisher */}
      <span className="shrink-0 rounded-xl border border-[#203445] bg-[#0f1c28] px-3 py-1.5 font-mono text-xs text-slate-300">
        {step.publisher}
      </span>

      <FlowArrow />

      {/* Routing key */}
      <span
        className={`shrink-0 rounded-full border px-3 py-1 font-mono text-[11px] ${routingKeyColor}`}
      >
        {step.routingKey}
      </span>

      {state === "failed" ? (
        <span className="shrink-0 text-rose-500" aria-hidden>
          ✗
        </span>
      ) : (
        <FlowArrow />
      )}

      {/* Queue */}
      <span
        className={`shrink-0 rounded-xl border px-3 py-1.5 font-mono text-xs ${queueColor}`}
      >
        {state === "failed" ? "undelivered" : step.queue}
      </span>

      {state !== "failed" ? (
        <>
          <FlowArrow />
          {/* Consumer */}
          <span
            className={`shrink-0 rounded-xl border px-3 py-1.5 font-mono text-xs ${consumerColor}`}
          >
            {step.consumer}
            {state === "crashed" ? " ↺" : ""}
          </span>
        </>
      ) : null}

      {/* State label */}
      <span
        className={`ml-auto shrink-0 text-[11px] uppercase tracking-[0.18em] ${stateLabelColor}`}
      >
        {stateLabel}
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <span className="shrink-0 text-slate-600" aria-hidden>
      →
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const inputClassName =
  "w-full rounded-2xl border border-[#23405f] bg-[#0b1d2c] px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#78f0d4]";
