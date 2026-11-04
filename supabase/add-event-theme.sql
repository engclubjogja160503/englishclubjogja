-- ============================================
-- Add a theme column to the events table.
-- The theme is the big headline of "This Saturday" on the website.
-- Run this in Supabase SQL Editor BEFORE deploying the matching code.
-- Additive only and safe to re-run; events without a theme keep
-- showing a headline taken from their description.
-- ============================================

alter table events add column if not exists theme text;
