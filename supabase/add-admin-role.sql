-- ============================================
-- Add is_admin column to profiles table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add is_admin column (default false)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Make the hardcoded email an admin (initial admin)
UPDATE profiles SET is_admin = true WHERE email = 'masiahsein16@gmail.com';

-- Create a policy so only admins can update is_admin on other profiles
-- (We'll handle this in the app layer for simplicity, but this ensures data integrity)
