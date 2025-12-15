/*
  # Create User Keypairs Table

  1. New Tables
    - `user_keypairs`
      - `id` (uuid, primary key) - Unique identifier for each keypair
      - `user_id` (uuid, foreign key) - References auth.users(id)
      - `keypair_name` (text) - User-defined name for the keypair
      - `public_key` (text) - RSA public key in base64 format
      - `private_key` (text) - RSA private key in base64 format (stored as-is, user responsible for security)
      - `created_at` (timestamptz) - Timestamp when keypair was created
      - `updated_at` (timestamptz) - Timestamp when keypair was last updated

  2. Security
    - Enable RLS on `user_keypairs` table
    - Add policy for authenticated users to read their own keypairs
    - Add policy for authenticated users to insert their own keypairs
    - Add policy for authenticated users to update their own keypairs
    - Add policy for authenticated users to delete their own keypairs
*/

CREATE TABLE IF NOT EXISTS user_keypairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keypair_name text NOT NULL,
  public_key text NOT NULL,
  private_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_keypairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own keypairs"
  ON user_keypairs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keypairs"
  ON user_keypairs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keypairs"
  ON user_keypairs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keypairs"
  ON user_keypairs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_keypairs_user_id_idx ON user_keypairs(user_id);