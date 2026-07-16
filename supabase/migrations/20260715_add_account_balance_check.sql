-- Add constraint to prevent negative balance
ALTER TABLE public.accounts 
ADD CONSTRAINT balance_check CHECK (balance >= 0);
