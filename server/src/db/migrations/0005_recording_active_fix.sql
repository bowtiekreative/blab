-- One active recording per room is defined by ended_at IS NULL (covers both
-- 'recording' and 'simulated' states), not by a specific status value.
DROP INDEX IF EXISTS idx_recordings_active;
CREATE UNIQUE INDEX IF NOT EXISTS idx_recordings_active
  ON recordings (room_id) WHERE ended_at IS NULL;
