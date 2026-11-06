import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { uploadPrivateFile, IDENTITY_BUCKET } from "@/lib/uploads";

export type InstalmentSubmitInput = {
  /** Product variant SKU, used to resolve the real `product_variants.id`. */
  variantSku: string;
  fullName: string;
  mobile: string;
  email?: string;
  cnic?: string;
  currentAddress?: string;
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
  | { ok: false; error: string; applicationId?: string };

/**
 * Persist an instalment application for the signed-in customer. Identity
 * documents (CNIC / proof of income) are uploaded to private storage and
 * linked to the application. Returns the new application id.
 */
export async function submitInstalmentApplication(input: InstalmentSubmitInput): Promise<InstalmentSubmitResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "Instalment applications are not available on this deployment." };
  }

  const { data: authData } = await supabase!.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) {
    return { ok: false, error: "Please sign in to submit an instalment application." };
  }

  // Resolve the real product_variants.id from the variant SKU. The frontend
  // catalogue is static and does not carry DB ids, so we look it up here.
  const { data: variantRow, error: variantErr } = await supabase!
    .from("product_variants")
    .select("id")
    .eq("sku", input.variantSku)
    .maybeSingle();
  if (variantErr || !variantRow) {
    return { ok: false, error: "We couldn't match this product variant in our catalogue. Please contact support." };
  }

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

  const { data: inserted, error: appErr } = await supabase!
    .from("instalment_applications")
    .insert({
      application_number: applicationNumber,
      user_id: userId,
      variant_id: variantRow.id as string,
      full_name: input.fullName,
      mobile: input.mobile,
      email: input.email || null,
      cnic: input.cnic || null,
      current_address: input.currentAddress || null,
      employment_status: input.employmentStatus || null,
      monthly_income: input.monthlyIncome || null,
      tenure_months: input.tenureMonths,
      listed_price: input.listedPrice,
      advance_payment: input.advancePayment,
      remaining_balance: input.remainingBalance,
      monthly_payment: input.monthlyPayment,
      total_payable: input.totalPayable,
      consent_given: input.consent,
      status: "submitted",
    })
    .select("id")
    .single();

  if (appErr || !inserted) {
    return { ok: false, error: "Could not submit your application. Please try again." };
  }

  const applicationId = inserted.id as string;

  // 3) Link the uploaded documents to the application. Failures here are
  //    surfaced rather than swallowed (RLS allows owners to insert these rows).
  for (const row of uploadedDocs) {
    const { error: docErr } = await supabase!.from("instalment_documents").insert({
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

  return { ok: true, id: applicationId };
}
