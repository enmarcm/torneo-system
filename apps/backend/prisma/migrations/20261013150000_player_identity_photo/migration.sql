-- Existing profiles retain their data; complete both photos before a new registration.
ALTER TABLE "Player" ADD COLUMN "identityPhotoKey" TEXT;
