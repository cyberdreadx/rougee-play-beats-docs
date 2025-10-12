-- Enable required extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule cleanup of expired stories to run every hour
SELECT cron.schedule(
  'cleanup-expired-stories-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://phybdsfwycygroebrsdx.supabase.co/functions/v1/cleanup-expired-stories',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoeWJkc2Z3eWN5Z3JvZWJyc2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2NzM5NjksImV4cCI6MjA3MjI0OTk2OX0.wQY7tt0gN1fvRjgHiPJK7I1M9ZhmgTbLNffGvcbWJko"}'::jsonb
    ) as request_id;
  $$
);