# Security Documentation

## Supabase Authentication System

### Configuration
- **Project URL**: `https://aahaltfklfpcddiyztgj.supabase.co`
- **Anon Key**: Public key for client-side operations (safe to expose)
- **Service Role Key**: Keep secret, never expose to client

### Security Features Implemented

1. **Row Level Security (RLS)**
   - Enable RLS on all tables
   - Create policies for authenticated users only

2. **Authentication Flow**
   - Email/password authentication via Supabase Auth
   - Session management with automatic token refresh
   - Secure cookie handling for SSR applications

3. **Environment Variables**
   - Store sensitive credentials in `.env` file
   - Never commit `.env` to version control
   - Use `.env.example` for documentation

### Recommended Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table with RLS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  car TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar, car)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar',
    NEW.raw_user_meta_data->>'car'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Best Practices

1. **Never expose service role key** in client-side code
2. **Always use RLS** to protect data at the database level
3. **Validate input** on both client and server
4. **Use prepared statements** to prevent SQL injection
5. **Implement rate limiting** for authentication endpoints
6. **Enable MFA** for production applications
7. **Regular security audits** of policies and permissions

### API Keys Reference

| Key Type | Purpose | Visibility |
|----------|---------|------------|
| Anon Key | Client-side operations | Public |
| Service Role | Admin operations | Secret |
| JWT Secret | Token verification | Secret |
