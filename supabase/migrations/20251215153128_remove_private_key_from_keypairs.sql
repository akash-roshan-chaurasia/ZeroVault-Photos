/*
  # Remove Private Key Storage from User Keypairs

  1. Security Enhancement
    - Remove `private_key` column from user_keypairs table
    - Only store public keys in the database
    - Users must manage their private keys locally and securely
    - This prevents exposure of private keys if the database is compromised
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_keypairs' AND column_name = 'private_key'
  ) THEN
    ALTER TABLE user_keypairs DROP COLUMN private_key;
  END IF;
END $$;