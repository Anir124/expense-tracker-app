/*
  # Update expenses table and security policies

  1. Tables
    - Safely create `expenses` table if it doesn't exist:
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `amount` (numeric)
      - `category` (text)
      - `description` (text)
      - `date` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `expenses` table
    - Add policies for authenticated users to:
      - Read their own expenses
      - Create new expenses
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'expenses'
  ) THEN
    CREATE TABLE expenses (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users NOT NULL,
      amount numeric NOT NULL,
      category text NOT NULL,
      description text,
      date timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS (safe to run multiple times)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own expenses" ON expenses;
  DROP POLICY IF EXISTS "Users can create own expenses" ON expenses;
END $$;

-- Create policies
CREATE POLICY "Users can read own expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);