import { supabase } from "@/lib/supabase";

/**
 * Builds the "order approved" confirmation message for the admin's
 * "Copy confirmation email" action. This mirrors the exact content rendered by
 * the `send-order-approved-email` Edge Function + the `order_approved` template,
 * so what an admin copies is what the customer would have received.
 *
 * It reads the authoritative row (service calls run as the signed-in admin, who
 * is allowed to read these tables under RLS). CNIC details and receipt images
 * are NOT included.
 */

const SUBJECT_TEMPLATE = "RAES TECH | Order {{order_number}} approved";

const BODY_TEMPLATE =
  "<h1>Your order {{order_number}} has been approved</h1>" +
  "<p>Hi {{first_name}},</p>" +
  "<p>Great news — your order has been approved and is being prepared for delivery.</p>" +
  "<p><strong>Order:</strong> {{order_number}}<br>" +
  "<strong>Item:</strong> {{product_name}} — {{variant_name}} {{color}}<br>" +
  "<strong>Approved amount:</strong> {{total}} PKR<br>" +
  "<strong>Payment:</strong> {{payment_method}}</p>" +
  "{{payment_verified}}" +
  "{{instalment_block}}" +
  "<p>Your order will be delivered to your shipping address. Please keep your phone and CNIC handy for verification at delivery.</p>" +
  "<p>Thank you for shopping with RAES TECH.</p>";

function fill(tpl: string, vars: Record<string, string>): string {
  return (tpl ?? "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => vars[k] ?? "");
}

export interface ApprovalMessage {
  recipient: string | null;
  subject: string;
  body: string;
  // Plain-text variant (line breaks) for easy fallback copying.
  bodyText: string;
  productName: string;
  variantName: string;
  color: string;
  total: number;
  paymentMethod: string;
  paymentVerified: boolean;
  reference: string;
}

function paymentVerifiedBlock(verified: boolean, method: string): string {
  if (verified) {
    return `<p><strong>Payment:</strong> verified ✓</p>`;
  }
  // Only say "verified" when the transfer was verified. Otherwise state the
  // next step without claiming verification.
  return `<p>Payment via ${method || "bank transfer"} will be confirmed before dispatch.</p>`;
}

/**
 * Build the confirmation message for an approved Buy Now order.
 */
export async function buildOrderApprovalMessage(orderId: string): Promise<ApprovalMessage | null> {
  const { data: order } = await supabase!.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return null;

  const { data: items } = await supabase!.from("order_items").select("*").eq("order_id", orderId).limit(1);
  const item = items?.[0] ?? {};

  let firstName = order.shipping_full_name || "there";
  let email = order.email ?? null;
  if (order.user_id) {
    const { data: profile } = await supabase!.from("profiles").select("full_name,email").eq("id", order.user_id).maybeSingle();
    if (profile) {
      if (profile.full_name) firstName = profile.full_name.split(" ")[0];
      if (!email) email = profile.email;
    }
  }

  const paymentStatus = String(order.payment_status ?? "");
  const paymentVerified = paymentStatus === "verified";

  const reference = String(order.order_number ?? orderId);
  const productName = String(item.product_name ?? "");
  const variantName = String(item.variant_name ?? item.sku ?? "");
  const color = String(item.color ?? "");
  const total = Number(order.total ?? 0);
  const method = String(order.payment_method ?? "bank_transfer");

  const subject = fill(SUBJECT_TEMPLATE, { order_number: reference });
  const body = fill(BODY_TEMPLATE, {
    order_number: reference,
    first_name: firstName,
    product_name: productName,
    variant_name: variantName,
    color,
    total: total.toLocaleString(),
    payment_method: method,
    payment_verified: paymentVerifiedBlock(paymentVerified, method),
    instalment_block: "",
  });

  const bodyText =
    `Your order ${reference} has been approved\n\n` +
    `Hi ${firstName},\n\n` +
    `Order: ${reference}\n` +
    `Item: ${productName} — ${variantName} ${color}\n` +
    `Approved amount: ${total.toLocaleString()} PKR\n` +
    `Payment: ${method}\n` +
    (paymentVerified ? `Payment: verified ✓\n` : `Payment via ${method} will be confirmed before dispatch.\n`) +
    `\nYour order will be delivered to your shipping address. Please keep your phone and CNIC handy for verification at delivery.\n\n` +
    `Thank you for shopping with RAES TECH.`;

  return {
    recipient: email,
    subject,
    body,
    bodyText,
    productName,
    variantName,
    color,
    total,
    paymentMethod: method,
    paymentVerified,
    reference,
  };
}

/**
 * Build the confirmation message for an approved instalment application.
 */
export async function buildInstalmentApprovalMessage(appId: string): Promise<ApprovalMessage | null> {
  const { data: app } = await supabase!.from("instalment_applications").select("*").eq("id", appId).maybeSingle();
  if (!app) return null;

  let firstName = app.full_name || "there";
  let email = app.email ?? null;
  if (app.user_id) {
    const { data: profile } = await supabase!.from("profiles").select("email,full_name").eq("id", app.user_id).maybeSingle();
    if (profile) {
      if (profile.full_name) firstName = profile.full_name.split(" ")[0];
      if (!email) email = profile.email;
    }
  }

  let productName = "Your phone";
  let variantName = "Instalment order";
  if (app.variant_id) {
    const { data: variant } = await supabase!.from("product_variants").select("storage,ram,product_id").eq("id", app.variant_id).maybeSingle();
    if (variant) {
      variantName = `${variant.storage} / ${variant.ram}`;
      const { data: product } = await supabase!.from("products").select("name").eq("id", variant.product_id).maybeSingle();
      if (product) productName = product.name;
    }
  }

  const reference = String(app.application_number ?? appId);
  const total = Number(app.total_payable ?? 0);
  const advance = Number(app.advance_payment ?? 0);
  const monthly = Number(app.monthly_payment ?? 0);
  const tenure = Number(app.tenure_months ?? 0);
  const color = String(app.colour ?? "");
  const method = "instalments";

  const paymentStatus = String(app.payment_status ?? "");
  const paymentVerified = paymentStatus === "verified";

  const instalmentBlock =
    `<p><strong>Instalment plan:</strong> ${tenure} months</p>` +
    `<p><strong>Advance:</strong> ${advance.toLocaleString()} PKR<br>` +
    `<strong>Monthly payment:</strong> ${monthly.toLocaleString()} PKR</p>`;

  const subject = fill(SUBJECT_TEMPLATE, { order_number: reference });
  const body = fill(BODY_TEMPLATE, {
    order_number: reference,
    first_name: firstName,
    product_name: productName,
    variant_name: variantName,
    color,
    total: total.toLocaleString(),
    payment_method: method,
    payment_verified: paymentVerifiedBlock(paymentVerified, method),
    instalment_block: instalmentBlock,
  });

  const bodyText =
    `Your order ${reference} has been approved\n\n` +
    `Hi ${firstName},\n\n` +
    `Order: ${reference}\n` +
    `Item: ${productName} — ${variantName} ${color}\n` +
    `Approved amount: ${total.toLocaleString()} PKR\n` +
    `Payment: ${method}\n` +
    (paymentVerified ? `Payment: verified ✓\n` : `Payment via ${method} will be confirmed before dispatch.\n`) +
    `Instalment plan: ${tenure} months\n` +
    `Advance: ${advance.toLocaleString()} PKR\n` +
    `Monthly payment: ${monthly.toLocaleString()} PKR\n` +
    `\nYour order will be delivered to your shipping address. Please keep your phone and CNIC handy for verification at delivery.\n\n` +
    `Thank you for shopping with RAES TECH.`;

  return {
    recipient: email,
    subject,
    body,
    bodyText,
    productName,
    variantName,
    color,
    total,
    paymentMethod: method,
    paymentVerified,
    reference,
  };
}
