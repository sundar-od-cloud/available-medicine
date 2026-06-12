-- Medicine Availability Platform - Initial Schema
-- Run: psql $DATABASE_URL -f migrations/001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enums
CREATE TYPE user_role AS ENUM ('user', 'pharmacy_owner', 'admin');
CREATE TYPE pharmacy_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'ready', 'completed', 'cancelled');

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  role user_role NOT NULL DEFAULT 'user',
  google_id VARCHAR(255) UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  license_no VARCHAR(100) UNIQUE NOT NULL,
  gst_no VARCHAR(50),
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  status pharmacy_status NOT NULL DEFAULT 'pending',
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  opening_time TIME,
  closing_time TIME,
  is_24_hours BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medicines
CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  composition TEXT,
  manufacturer VARCHAR(255),
  category VARCHAR(100),
  dosage_form VARCHAR(100),
  strength VARCHAR(100),
  prescription_required BOOLEAN DEFAULT FALSE,
  alternatives JSONB DEFAULT '[]',
  description TEXT,
  side_effects TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  stock INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  mrp DECIMAL(10, 2),
  expiry_date DATE,
  batch_no VARCHAR(100),
  is_available BOOLEAN GENERATED ALWAYS AS (stock > 0) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pharmacy_id, medicine_id)
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  status reservation_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  pickup_time TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Search History
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  search_term VARCHAR(255) NOT NULL,
  medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
  results_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP Tokens
CREATE TABLE IF NOT EXISTS otp_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Refresh Tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pharmacy Ratings
CREATE TABLE IF NOT EXISTS pharmacy_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pharmacy_id, user_id)
);

-- Inventory Upload Logs
CREATE TABLE IF NOT EXISTS inventory_upload_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pharmacy_id UUID NOT NULL REFERENCES pharmacies(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255),
  total_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_pharmacies_owner ON pharmacies(owner_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_status ON pharmacies(status);
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pharmacies_city ON pharmacies(city);

CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines USING gin(to_tsvector('english', medicine_name));
CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines USING gin(to_tsvector('english', COALESCE(generic_name, '')));
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);
CREATE INDEX IF NOT EXISTS idx_medicines_name_trgm ON medicines USING gin(medicine_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_inventory_pharmacy ON inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inventory_available ON inventory(is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(stock);

CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_pharmacy ON reservations(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_created ON reservations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_term ON search_history(search_term);
CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(searched_at DESC);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_tokens(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_tokens(expires_at);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON pharmacies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON medicines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update pharmacy rating when a rating is added/updated
CREATE OR REPLACE FUNCTION update_pharmacy_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pharmacies
  SET
    rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM pharmacy_ratings WHERE pharmacy_id = NEW.pharmacy_id),
    total_ratings = (SELECT COUNT(*) FROM pharmacy_ratings WHERE pharmacy_id = NEW.pharmacy_id)
  WHERE id = NEW.pharmacy_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pharmacy_rating_trigger
AFTER INSERT OR UPDATE ON pharmacy_ratings
FOR EACH ROW EXECUTE FUNCTION update_pharmacy_rating();

-- Seed data: admin user
INSERT INTO users (name, email, password_hash, role, is_verified)
VALUES ('Admin', 'admin@availablemedicine.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8tCnIWPO2G', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Seed data: sample medicines
INSERT INTO medicines (medicine_name, generic_name, composition, manufacturer, category, dosage_form, strength, prescription_required) VALUES
('Paracetamol 500mg', 'Acetaminophen', 'Paracetamol 500mg', 'Generic', 'Analgesic', 'Tablet', '500mg', FALSE),
('Ibuprofen 400mg', 'Ibuprofen', 'Ibuprofen 400mg', 'Generic', 'NSAID', 'Tablet', '400mg', FALSE),
('Amoxicillin 500mg', 'Amoxicillin', 'Amoxicillin 500mg', 'Generic', 'Antibiotic', 'Capsule', '500mg', TRUE),
('Cetirizine 10mg', 'Cetirizine HCl', 'Cetirizine Hydrochloride 10mg', 'Generic', 'Antihistamine', 'Tablet', '10mg', FALSE),
('Omeprazole 20mg', 'Omeprazole', 'Omeprazole 20mg', 'Generic', 'PPI', 'Capsule', '20mg', FALSE),
('Metformin 500mg', 'Metformin', 'Metformin Hydrochloride 500mg', 'Generic', 'Antidiabetic', 'Tablet', '500mg', TRUE),
('Atorvastatin 10mg', 'Atorvastatin', 'Atorvastatin Calcium 10mg', 'Generic', 'Statin', 'Tablet', '10mg', TRUE),
('Azithromycin 500mg', 'Azithromycin', 'Azithromycin 500mg', 'Generic', 'Antibiotic', 'Tablet', '500mg', TRUE),
('Pantoprazole 40mg', 'Pantoprazole', 'Pantoprazole Sodium 40mg', 'Generic', 'PPI', 'Tablet', '40mg', FALSE),
('Dolo 650', 'Acetaminophen', 'Paracetamol 650mg', 'Micro Labs', 'Analgesic', 'Tablet', '650mg', FALSE)
ON CONFLICT DO NOTHING;
