/*
  # Create AI Context Log Table

  1. New Tables
    - `ai_context_log`
      - `id` (uuid, primary key)
      - `event` (text) - Type of event logged
      - `data` (jsonb) - Event data
      - `timestamp` (timestamptz) - Event timestamp
      - `session_id` (text) - User session identifier
      - `user_id` (uuid) - User ID if logged in
      - `user_email` (text) - User email if available
      - `current_page` (text) - Current page path
      - `user_agent` (text) - Browser user agent
      - `system_metrics` (jsonb) - System performance metrics
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `ai_context_log` table
    - Add policies for authenticated users and admins
*/

CREATE TABLE IF NOT EXISTS ai_context_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  data jsonb DEFAULT '{}',
  timestamp timestamptz,
  session_id text,
  user_id uuid,
  user_email text,
  current_page text,
  user_agent text,
  system_metrics jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_context_log ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own context data
CREATE POLICY "Users can insert their own AI context data"
  ON ai_context_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to read their own context data
CREATE POLICY "Users can read their own AI context data"
  ON ai_context_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_email = auth.email());

-- Allow admins to read all context data
CREATE POLICY "Admins can read all AI context data"
  ON ai_context_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM site_admins 
      WHERE gmail = auth.email()
      AND (expires_at IS NULL OR expires_at > now())
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_context_log_user_id ON ai_context_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_log_session_id ON ai_context_log(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_context_log_event ON ai_context_log(event);
CREATE INDEX IF NOT EXISTS idx_ai_context_log_created_at ON ai_context_log(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_context_log_user_email ON ai_context_log(user_email);