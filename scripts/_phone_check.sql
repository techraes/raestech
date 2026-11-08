select key, value from public.website_settings where key ilike '%phone%' or key ilike '%whatsapp%' order by key;
