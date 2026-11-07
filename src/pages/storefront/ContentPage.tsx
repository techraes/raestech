import { useParams, Link } from "react-router-dom";
import { Seo } from "@/lib/seo";
import { NotFoundPage } from "./NotFoundPage";

interface ContentDoc {
  title: string;
  sections: { heading: string; body: string }[];
}

/**
 * Default policy page content. In production these documents live in the
 * `content_pages` table and are edited from the Admin Panel. This local map
 * ensures every legal page works out of the box and matches the catalog data.
 */
const CONTENT: Record<string, ContentDoc> = {
  terms: {
    title: "Terms & Conditions",
    sections: [
      { heading: "Agreement", body: "These terms govern your use of RAES TECH. By placing an order you agree to them." },
      { heading: "Orders & pricing", body: "Displayed prices are in PKR. During the 11.11 sale, Buy Now prices reflect a 22% discount on the listed price. Instalment purchases get 11% off the listed price with a default 20% advance and 0% markup." },
      { heading: "Payment", body: "Cash on Delivery is not available. Payment is by manual transfer to the Faysal Bank account provided at checkout. Orders dispatch only after payment is verified." },
      { heading: "Returns & refunds", body: "Returns and refunds follow our Return & Refund Policy. Refund requests must be raised within the stated return period." },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      { heading: "What we collect", body: "We collect your name, contact details, address, order history, payment records and, for instalment applications, CNIC data and supporting documents." },
      { heading: "How we use it", body: "Data is used to process orders, payments, instalments, deliver orders and provide support. We never sell your personal data." },
      { heading: "CNIC documents", body: "Identity documents are stored in a private, access-controlled storage and are only visible to authorised staff. Retrieval uses short-lived signed links and is logged." },
      { heading: "Retention", body: "We retain records as required for legal, tax and financial reporting, and delete identity documents once no longer needed or per your lawful request." },
    ],
  },
  "shipping-policy": {
    title: "Shipping Policy",
    sections: [
      { heading: "Coverage", body: "We deliver nationwide across Pakistan." },
      { heading: "Charges", body: "A standard shipping charge applies; shipping is free on orders above the free-shipping threshold set by the store." },
      { heading: "Dispatch", body: "Orders dispatch after payment verification. You will receive tracking updates via your order timeline." },
      { heading: "Estimates", body: "Delivery times vary by city. Exact estimates are shown at checkout and in your order." },
    ],
  },
  "return-policy": {
    title: "Return & Refund Policy",
    sections: [
      { heading: "Return eligibility", body: "Return eligibility depends on the product condition, supplier terms and warranty type stated on the listing." },
      { heading: "Process", body: "Raise a return request from your account. Our team reviews it and, if approved, records refund details." },
      { heading: "Refunds", body: "Approved refunds are processed back to the original payment method." },
    ],
  },
  "warranty-policy": {
    title: "Warranty Policy",
    sections: [
      { heading: "Varies by listing", body: "Warranty type, duration and provider vary by phone model, condition and supplier. Always check the exact warranty shown on the product page." },
      { heading: "Exclusions", body: "Warranty exclusions are stated per listing. Physical damage, unauthorised service and water damage are typically excluded." },
      { heading: "No universal coverage", body: "We do not advertise universal warranty coverage. The warranty shown on your selected variant is the applicable one." },
    ],
  },
  faqs: {
    title: "Frequently Asked Questions",
    sections: [
      { heading: "How does Buy Now work?", body: "Pay the full amount in one go and you get 22% off the listed price during the 11.11 sale." },
      { heading: "How do instalments work?", body: "During the 11.11 sale you get 11% off the listed price, then pay a 20% advance on the discounted price and the balance in equal monthly payments over 3, 6, 9 or 12 months at 0% markup." },
      { heading: "Do you offer Cash on Delivery?", body: "No. Payment is by manual bank transfer, verified before dispatch." },
      { heading: "How do I pay?", body: "Transfer the amount to the Faysal Bank account shown on your order, then upload your receipt from My Orders." },
      { heading: "Are JV phones unlocked?", body: "No. JV / SIM-locked phones are clearly labelled and work only with an interposer or while SIM-time lasts." },
    ],
  },
  "instalment-agreement": {
    title: "Instalment Agreement",
    sections: [
      { heading: "Overview", body: "During the 11.11 sale, instalment purchases get 11% off the listed price, with a default 20% advance on the discounted price and a 0% markup. No guarantor is required." },
      { heading: "Approval & activation", body: "Your application must be approved and you must accept the agreement before the account is activated and the phone dispatched." },
      { heading: "Payments", body: "Each instalment is due by its scheduled date. Payments are verified manually." },
      { heading: "Late payment", body: "Missed payments may make your account overdue. Repeated non-payment may affect your ability to order on instalments." },
      { heading: "Cancellation & refunds", body: "Cancellation and refund rules are covered in the Return & Refund Policy. This agreement should be reviewed with a qualified Pakistani legal adviser before acceptance." },
    ],
  },
};

export function ContentPage() {
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? CONTENT[slug] : undefined;

  if (!doc) return <NotFoundPage />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Seo title={`${doc.title} | RAES TECH`} canonicalPath={`/${slug}`} />
      <h1 className="text-3xl font-bold">{doc.title}</h1>
      <div className="space-y-6">
        {doc.sections.map((s) => (
          <div key={s.heading} className="rounded-2xl border bg-card p-6">
            <h2 className="mb-2 text-lg font-bold">{s.heading}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Questions? <Link to="/contact" className="underline">Contact us</Link>.
      </p>
    </div>
  );
}
