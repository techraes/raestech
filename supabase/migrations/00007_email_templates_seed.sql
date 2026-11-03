-- RAES TECH — Default transactional email templates.
-- Used by the send-email Edge Function. Subject/body may use {{placeholder}}
-- tokens (see supabase/functions/send-email/render.mjs).
-- Idempotent: upserts by primary key `key`.

insert into public.email_templates (key, subject, body, enabled)
values
  (
    'order_confirmation',
    'Order {{order_number}} confirmed — RAES TECH',
    '<h1>Thank you for your order, {{first_name}}!</h1><p>Your order <strong>{{order_number}}</strong> has been received and is being processed.</p><p>Total: {{total}}</p><p>We will notify you when it ships.</p>',
    true
  ),
  (
    'password_reset',
    'Reset your RAES TECH password',
    '<p>Hi {{first_name}},</p><p>We received a request to reset your password. Click the link below to set a new one:</p><p><a href="{{reset_link}}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>',
    true
  ),
  (
    'instalment_reminder',
    'Instalment due — RAES TECH',
    '<p>Hi {{first_name}},</p><p>This is a reminder that your instalment of <strong>{{amount}}</strong> is due on <strong>{{due_date}}</strong>.</p><p>Thank you for choosing RAES TECH.</p>',
    true
  )
on conflict (key) do update set
  subject = excluded.subject,
  body = excluded.body,
  enabled = excluded.enabled,
  updated_at = now();
