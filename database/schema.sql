-- SFCC Altar Servers Attendance Management System - Database Schema

-- -------------------------------------------------------------------------
-- CAUTION: The DROP TABLE section below is intended STRICTLY for initial setup 
-- and development redevelopment. DO NOT run this against a production 
-- database containing real attendance history, as it will erase all data.
-- -------------------------------------------------------------------------
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create an automated trigger function to update the updated_at timestamp column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Users Table (Administrators)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 2. Members Table (Altar Servers)
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_members_modtime
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Index for fast searching and alphabetical sorting (full_name is already indexed via UNIQUE constraint, but explicitly noted)
CREATE INDEX idx_members_status ON members(status);

-- 3. Meetings Table (Services/Events)
CREATE TABLE meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    meeting_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_meetings_modtime
    BEFORE UPDATE ON meetings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_meetings_date ON meetings(meeting_date);

-- 4. Attendance Table (Junction Table)
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_meeting_member UNIQUE (meeting_id, member_id)
);

CREATE TRIGGER update_attendance_modtime
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_attendance_meeting ON attendance(meeting_id);
CREATE INDEX idx_attendance_member ON attendance(member_id);