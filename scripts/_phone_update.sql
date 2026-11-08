-- ============================================================
-- NOTE: Real customer-facing phone/WhatsApp numbers must NOT be
-- committed to source control. The values below are redacted
-- placeholders. Set the real numbers at deploy time from your
-- environment / secret store (e.g. a .env SUPABASE_PHONE &
-- WHATSAPP_NUMBER read by the deploy/migration runner).
-- ============================================================

update public.website_settings set value = 'REPLACE_ME_SUPPORT_PHONE' where key = 'support_phone';
update public.website_settings set value = 'REPLACE_ME_WHATSAPP_NUMBER' where key = 'whatsapp_number';
update public.website_settings set value = 'REPLACE_ME_SUPPORT_PHONE' where key = 'supportPhone';
update public.website_settings set value = 'REPLACE_ME_WHATSAPP_NUMBER' where key = 'whatsapp';

select key, value from public.website_settings where key ilike '%phone%' or key ilike '%whatsapp%' order by key;
