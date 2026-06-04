import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aahaltfklfpcddiyztgj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaGFsdGZrbGZwY2RkaXl6dGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTU2ODYsImV4cCI6MjA5NDI3MTY4Nn0.nniWlgZFROpk-cNjKBc3g-JPx7njbicZBPjwAsg6E2g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
