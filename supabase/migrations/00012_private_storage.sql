-- ============================================================
-- 00012_private_storage.sql
-- Creates PRIVATE storage buckets for payment receipts and identity documents.
-- These buckets are never public; authorized access is granted only through
-- short-lived signed URLs (see src/lib/uploads.ts) and storage RLS policies
-- below. Sensitive documents are never exposed via public URLs.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('receipts', 'receipts', false, 5242880, array['image/jpeg','image/png','application/pdf']),
  ('identity-documents', 'identity-documents', false, 5242880, array['image/jpeg','image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Receipts: any authenticated user may upload into their own folder; a user
-- may only read their own uploads; admins/verifiers may read all.
create policy "user uploads receipts"
on storage.objects for insert to authenticated
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user reads own receipts"
on storage.objects for select to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "admin reads all receipts"
on storage.objects for select to authenticated
using (bucket_id = 'receipts' and public.is_admin());

-- Identity documents (CNIC): upload by owner, read only by owner or verifiers.
create policy "user uploads identity docs"
on storage.objects for insert to authenticated
with check (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "user reads own identity docs"
on storage.objects for select to authenticated
using (bucket_id = 'identity-documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "verifier reads identity docs"
on storage.objects for select to authenticated
using (bucket_id = 'identity-documents' and public.is_admin());

-- Deleting/updating objects: only the owner may remove their own uploads.
create policy "user deletes own uploads"
on storage.objects for delete to authenticated
using ((storage.foldername(name))[1] = auth.uid()::text);
