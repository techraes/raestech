import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateFile, IDENTITY_BUCKET } from "@/lib/uploads";
import { confirmOfferOnBackend } from "@/lib/instalment-offer";

export type InstalmentSubmitInput = {
  /** Canonical product variant SKU used to resolve the real `product_variants.id`. */
  variantSku: string;
  /** Optional pre-resolved DB variant id from the Review step (cross-checked). */
  variantId?: string;
  /** Colour identifier carried alongside the variant; validated against the offer. */
  color: string;
  fullName: string;
  mobile: string;
  email?: string;
  cnic?: string;
  currentAddress?: string;
  deliveryFullName?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  deliveryArea?: string;
  deliveryCity?: string;
  deliveryProvince?: string;
  deliveryPostalCode?: string;
  employmentStatus?: string;
  monthlyIncome?: string;
  tenureMonths: number;
  listedPrice: number;
  advancePayment: number;
  remainingBalance: number;
  monthlyPayment: number;
  totalPayable: number;
  consent: boolean;
  cnicFile?: File | null;
  incomeProofFile?: File | null;
};

export type InstalmentSubmitResult =
  | { ok: true; id: string }
  // applicationId is populated when the application row was created but
  // document attachment failed afterwards, so the UI can still recover.
  | { ok: false; error: string; applicationId?: string; code?: "unavailable" | "retry" };

export async function submitInstalmentApplication(
  input: InstalmentSubmitInput
): Promise<InstalmentSubmitResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Instalment applications are not available on this deployment." };
  }
  if (!supabase) {
    return { ok: false, error: "Instalment applications are not available on this deployment." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return { ok: false, error: "Please sign in to submit an instalment application." };
  }

  // Authoritative backend resolution of the offer by canonical SKU + colour.
  // This re-validates availability and recomputes the payable amount server-side
  // on the customer advances to payment. An unavailable or unresolved offer must
  // never create an application.
  const confirmed = await confirmOfferOnBackend({
    slug: "",
    sku: input.variantSku,
    color: input.color,
    tenure: input.tenureMonths,
  });
  if (confirmed.status === "unavailable") {
    return { ok: false, code: "unavailable", error: "This option is no longer available." };
  }
  if (confirmed.status !== "ok") {
    return { ok: false, code: "retry", error: confirmed.error ?? "We couldn't confirm this offer right now. Please try again." };
  }

  // Cross-check the identity carried from the Review step against the
  // server-confirmed variant so the application always matches what the customer
  // actually reviewed (never silently substituted).
  if (input.variantId && confirmed.variantId && String(input.variantId) !== String(confirmed.variantId)) {
    return { ok: false, code: "retry", error: "This phone's configuration changed since you reviewed it — please check the details again." };
  }

  const variantId = confirmed.variantId;
  if (!variantId) {
    return { ok: false, error: "We couldn't match this product variant in our catalogue. Please contact support." };
  }

  // Use the server-confirmed amounts so the saved application always reflects the
  // backend's authoritative calculation, even if the client price was stale.
  const plan = confirmed.plan!;
  const listedPrice = confirmed.listed ?? input.listedPrice;
  const advancePayment = plan.advance;
  const remainingBalance = plan.remaining;
  const monthlyPayment = plan.monthly;
  const totalPayable = plan.total;

  // 1) Upload identity documents BEFORE creating the application so a failed
  //    upload never leaves an application missing its required legal documents.
  const pendingDocs: Array<{ docType: string; label: string; file: File }> = [];
  if (input.cnicFile) pendingDocs.push({ docType: "cnic_front", label: "CNIC", file: input.cnicFile });
  if (input.incomeProofFile) pendingDocs.push({ docType: "proof_of_income", label: "proof of income", file: input.incomeProofFile });

  const uploadedDocs: Array<{
    doc_type: string;
    path: string;
    original_name: string;
    mime_type: string;
    file_size: number;
  }> = [];

  for (const d of pendingDocs) {
    const uploaded = await uploadPrivateFile(IDENTITY_BUCKET, d.file, "instalments", userId);
    if (!uploaded.ok) {
      return { ok: false, error: `Could not upload your ${d.label}: ${uploaded.error}` };
    }
    uploadedDocs.push({
      doc_type: d.docType,
      path: uploaded.path,
      original_name: d.file.name,
      mime_type: d.file.type || "application/octet-stream",
      file_size: d.file.size,
    });
  }

  // 2) Create the application only once all documents are stored.
  const applicationNumber = `IP-${Date.now()}`;

  const { data: inserted, error: appErr } = await supabase
    .from("instalment_applications")
    .insert({
      application_number: applicationNumber,
      user_id: userId,
      variant_id: variantId,
      colour: input.color || null,
      full_name: input.fullName,
      mobile: input.mobile,
      email: input.email || null,
      cnic: input.cnic || null,
      current_address: input.currentAddress || null,
      delivery_full_name: input.deliveryFullName || null,
      delivery_phone: input.deliveryPhone || null,
      delivery_address: input.deliveryAddress || null,
      delivery_area: input.deliveryArea || null,
      delivery_city: input.deliveryCity || null,
      delivery_province: input.deliveryProvince || null,
      delivery_postal_code: input.deliveryPostalCode || null,
      employment_status: input.employmentStatus || null,
      monthly_income: input.monthlyIncome || null,
      tenure_months: input.tenureMonths,
      listed_price: listedPrice,
      advance_payment: advancePayment,
      remaining_balance: remainingBalance,
      monthly_payment: monthlyPayment,
      total_payable: totalPayable,
      consent_given: input.consent,
      status: "submitted",
    })
    .select("id")
    .single();

  if (appErr || !inserted) {
    return { ok: false, error: "Could not submit your application. Please try again." };
  }

  const applicationId = inserted.id as string;

  if (uploadedDocs.length) {
    for (const row of uploadedDocs) {
      const { error: docErr } = await supabase.from("instalment_documents").insert({
        application_id: applicationId,
        uploaded_by: userId,
        ...row,
      });
      if (docErr) {
        // The application row and file uploads already exist; surface the id so
        // the caller can still show the submitted state and recover.
        return {
          ok: false,
          applicationId,
          error: "Your application was submitted, but we couldn't attach some documents. Please contact support.",
        };
      }
    }
  }

  return { ok: true, id: applicationId };
}
