-- ============================================================
-- 00025_payment_config_expose_and_defaults.sql
-- ------------------------------------------------------------
-- Exposes the admin-saved JSON settings (payment methods, theme, homepage,
-- social, SEO, announcements) through the `public_settings` view so the
-- storefront and the admin UI read the same persisted configuration after a
-- refresh/redeploy. Without this the checkout reported "No payment methods are
-- enabled yet" and saved bank details vanished on reload.
--
-- Also initialises the Faysal Bank manual-transfer defaults once (only when the
-- key is absent), matching the owner-supplied account details.

create or replace view public_settings as
  select key, value, value_kind
  from public.website_settings
  where key in (
    'store_name', 'store_tagline', 'currency', 'currency_symbol',
    'domain', 'support_email', 'support_phone', 'whatsapp_number',
    'instagram_url', 'facebook_url', 'tiktok_url',
    'announcement_text', 'primary_color', 'secondary_color',
    'free_shipping_threshold', 'shipping_charge', 'buy_now_discount_percent',
    'instalment_discount_percent', 'instalment_advance_percent',
    'instalment_markup_percent', 'instalment_tenures', 'cod_enabled',
    'terms_url', 'privacy_url',
    'announcement_enabled', 'maintenance_mode',
    'browser_title', 'default_seo_description', 'favicon_data_url', 'logo_data_url',
    'theme', 'homepage_sections', 'payment_methods', 'social_links', 'seo_analytics'
  );

grant select on public_settings to anon, authenticated;

-- Initialise the Faysal Bank manual-transfer defaults once. This only runs
-- when no payment_methods row exists yet, so it never overwrites admin edits.
insert into public.website_settings (key, value, value_kind)
select 'payment_methods',
       json_build_array(
         json_build_object(
           'id', 'pm-faysal',
           'code', 'faysal_bank',
           'name', 'Faysal Bank Transfer',
           'enabled', false,
           'customerDescription', 'Manual bank transfer to our Faysal account.',
           'displayOrder', 0,
           'type', 'manual',
           'kind', 'bank',
           'testMode', false,
           'liveMode', false,
           'verified', false,
           'bankName', 'Faysal Bank Limited',
           'accountTitle', 'MUBASHAR IQBAL',
           'accountNumber', '3280525000007626',
           'iban', 'PK24FAYS3280525000007626',
           'branch', '',
           'instructions', 'Please transfer the payment to the bank account provided above. After completing your transaction, upload your payment receipt and submit your payment confirmation for verification.'
         ),
         json_build_object('id','pm-jazzcash','code','jazzcash','name','JazzCash','enabled',false,'displayOrder',1,'type','manual','kind','mobile_wallet','testMode',false,'liveMode',false,'verified',false),
         json_build_object('id','pm-easypaisa','code','easypaisa','name','Easypaisa','enabled',false,'displayOrder',2,'type','manual','kind','mobile_wallet','testMode',false,'liveMode',false,'verified',false),
         json_build_object('id','pm-bank','code','bank_transfer','name','Bank Transfer','enabled',false,'displayOrder',3,'type','manual','kind','bank','testMode',false,'liveMode',false,'verified',false),
         json_build_object('id','pm-crypto','code','crypto_usdt','name','Crypto (USDT)','enabled',false,'displayOrder',4,'type','manual','kind','crypto','testMode',false,'liveMode',false,'verified',false,'network','TRC-20','coinSymbol','USDT','walletAddress','','instructions',''),
         json_build_object('id','pm-card','code','card','name','Card Payment','enabled',false,'displayOrder',5,'type','online','kind','card','testMode',false,'liveMode',false,'verified',false,'cardProcessor','','merchantId','','instructions','')
       )::text,
       'json'
where not exists (select 1 from public.website_settings where key = 'payment_methods');
