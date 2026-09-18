-- ============================================
-- Add event_time column to events table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add event_time column (default 19:00 = 7 PM WIB)
alter table events add column if not exists event_time time default '19:00:00';
