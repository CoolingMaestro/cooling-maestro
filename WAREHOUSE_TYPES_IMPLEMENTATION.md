# Warehouse Types Implementation

## Overview
This implementation dynamically loads warehouse types from the database instead of using hardcoded values in the Calculation.tsx component.

## Changes Made

### 1. Database Schema
The `warehouse_types` table already exists in `supabase/schema.sql` with the following structure:
- `type_code`: Unique code for warehouse type (e.g., 'cold_storage')
- `type_name`: Display name in Turkish
- `description`: Description of the warehouse type
- `icon_name`: Font Awesome icon class name
- `default_temperature`: Default temperature for this type
- `temp_range_min/max`: Temperature range
- `default_humidity`: Default humidity percentage
- `humidity_range_min/max`: Humidity range
- Additional fields for air change rate, velocity, etc.

### 2. Seed Data
Created `supabase/seed_warehouse_types.sql` with initial data for 6 warehouse types:
- Soğuk Muhafaza (cold_storage)
- Dondurulmuş Depo (frozen_storage)
- Şok Dondurma (blast_freezing)
- Ön Soğutma (pre_cooling)
- Kontrollü Atmosfer (controlled_atmosphere)
- İlaç/Medikal (medical_storage)

### 3. Service Layer
Created `src/services/warehouseService.ts` with:
- `getWarehouseTypes()`: Fetches all active warehouse types ordered by display_order
- `getWarehouseTypeByCode()`: Fetches a specific warehouse type by code
- TypeScript interface `WarehouseType` for type safety

### 4. Component Updates
Modified `src/Calculation.tsx` to:
- Import the warehouse service
- Add state for warehouse types and loading state
- Fetch warehouse types on component mount via useEffect
- Dynamically render warehouse type cards from database data
- When a warehouse type is selected, it sets:
  - `storageType`: The type_code from database
  - `targetTemperature`: The default_temperature from database
  - `targetHumidity`: The default_humidity from database

## Usage

1. **Run the seed data** to populate warehouse types:
   ```bash
   npx supabase db push
   psql [connection_string] -f supabase/seed_warehouse_types.sql
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. The warehouse types will now load from the database when the user reaches the "Depo Tipi" step in the calculation form.

## Benefits
- **Dynamic Data**: Warehouse types can be modified in the database without code changes
- **Consistent Values**: Temperature and humidity defaults come from a single source
- **Scalability**: Easy to add new warehouse types
- **Maintainability**: Business logic separated from UI code

## Future Enhancements
- Add admin interface to manage warehouse types
- Include more detailed specifications like air change rates
- Support for custom temperature/humidity ranges per type
- Localization support for multiple languages