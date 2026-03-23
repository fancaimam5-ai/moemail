ALTER TABLE [webhook] ADD [signing_secret] text;
UPDATE [webhook] SET [signing_secret] = lower(hex(randomblob(16))) WHERE [signing_secret] IS NULL;
