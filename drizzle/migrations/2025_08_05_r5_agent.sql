-- Working-memory & email queue
CREATE TABLE IF NOT EXISTS agent_chat_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 studio_id uuid,
 user_id   uuid,
 thread_id text,
 memory_json jsonb DEFAULT '{}'::jsonb,
 last_summary text,
 created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 studio_id uuid,
 to_email  text,
 subject   text,
 body_html text,
 status text DEFAULT 'queued',   -- queued|sent|failed
 retries int DEFAULT 0,
 created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);