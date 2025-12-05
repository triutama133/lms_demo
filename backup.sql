-- Insert default category if not exists
INSERT INTO categories (id, name, description) 
VALUES (1, 'Public', 'Open for all registered users') 
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- Ensure courses.category_id defaults to 1 if null (alter table if needed)
-- Assuming category_id is nullable; add default value
ALTER TABLE courses ALTER COLUMN category_id SET DEFAULT 1;
-- Update existing null values to default
UPDATE courses SET category_id = 1 WHERE category_id IS NULL;
