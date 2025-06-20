-- Migration: Create turkey_coordinates table
-- Description: Table to store coordinates for Turkish provinces and districts

-- Create the turkey_coordinates table
CREATE TABLE turkey_coordinates (
    id SERIAL PRIMARY KEY,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint on (province, district)
ALTER TABLE turkey_coordinates 
ADD CONSTRAINT uk_turkey_coordinates_province_district 
UNIQUE (province, district);

-- Create index on province column
CREATE INDEX idx_turkey_coordinates_province 
ON turkey_coordinates (province);

-- Create index on district column
CREATE INDEX idx_turkey_coordinates_district 
ON turkey_coordinates (district);

-- Add comment on table
COMMENT ON TABLE turkey_coordinates IS 'Stores geographical coordinates for Turkish provinces and districts';

-- Add comments on columns
COMMENT ON COLUMN turkey_coordinates.id IS 'Primary key';
COMMENT ON COLUMN turkey_coordinates.province IS 'Province name';
COMMENT ON COLUMN turkey_coordinates.district IS 'District name (nullable for province-level coordinates)';
COMMENT ON COLUMN turkey_coordinates.latitude IS 'Latitude coordinate with 7 decimal places precision';
COMMENT ON COLUMN turkey_coordinates.longitude IS 'Longitude coordinate with 7 decimal places precision';
COMMENT ON COLUMN turkey_coordinates.created_at IS 'Record creation timestamp';
COMMENT ON COLUMN turkey_coordinates.updated_at IS 'Record last update timestamp';