import { createServerClient } from "@supabase/ssr";

const supabaseUrl = 'https://aahaltfklfpcddiyztgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhaGFsdGZrbGZwY2RkaXl6dGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2OTU2ODYsImV4cCI6MjA5NDI3MTY4Nn0.nniWlgZFROpk-cNjKBc3g-JPx7njbicZBPjwAsg6E2g';

export const supabaseMiddleware = async (req: any, res: any, next: any) => {
  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return Object.keys(req.cookies || {}).map(name => ({ name, value: req.cookies[name] }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookie(name, value, options);
            });
          },
        },
      },
    );

    // Only attempt to get user if cookies exist
    const cookies = req.cookies;
    if (cookies && Object.keys(cookies).length > 0) {
      try {
        await supabase.auth.getUser();
      } catch (err: any) {
        // Ignore auth errors - user might not be logged in
        if (err.status !== 401 && err.message?.includes('Auth session missing')) {
          console.warn('Session validation warning:', err.message);
        }
      }
    }
    
    next();
  } catch (err: any) {
    // Never throw - just log and continue
    console.error('Middleware error (non-fatal):', err.message);
    next();
  }
};
