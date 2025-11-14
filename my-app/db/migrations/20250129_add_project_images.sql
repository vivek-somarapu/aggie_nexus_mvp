-- Migration: Add project logo and image support
-- Date: 2025-01-29
-- Description: Adds logo_url to projects table and image_type to project_images table

-- Add logo_url field to projects table for quick access to primary logo
ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "logo_url" text;

-- Add image_type field to project_images table to distinguish between logo and general images
ALTER TABLE "public"."project_images" 
ADD COLUMN IF NOT EXISTS "image_type" character varying(20) DEFAULT 'general' NOT NULL;

-- Add constraint to ensure image_type is either 'logo' or 'general'
ALTER TABLE "public"."project_images"
ADD CONSTRAINT "project_images_image_type_check" 
CHECK (("image_type")::text = ANY ((ARRAY['logo'::character varying, 'general'::character varying])::text[]));

-- Add comment for documentation
COMMENT ON COLUMN "public"."projects"."logo_url" IS 'Primary logo/photo URL for the project (startup logo)';
COMMENT ON COLUMN "public"."project_images"."image_type" IS 'Type of image: logo (primary logo) or general (additional project images)';

-- Create index on image_type for faster queries
CREATE INDEX IF NOT EXISTS "idx_project_images_image_type" 
ON "public"."project_images" USING "btree" ("image_type");

-- Create index on project_id and image_type for efficient lookups
CREATE INDEX IF NOT EXISTS "idx_project_images_project_type" 
ON "public"."project_images" USING "btree" ("project_id", "image_type");

