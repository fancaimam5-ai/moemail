ALTER TABLE [message] ADD [is_read] integer NOT NULL DEFAULT 0;
ALTER TABLE [plan] ADD [duration_days] integer NOT NULL DEFAULT 30;
CREATE INDEX [message_is_read_idx] ON [message] ([is_read]);
