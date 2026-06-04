import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '../utils/supabase/client';

export default function SupabaseTest() {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Memoize supabase client to prevent recreation on re-renders
  const supabase = useMemo(() => createClient(), []);
  
  useEffect(() => {
    let mounted = true;
    
    async function fetchTodos() {
      try {
        const { data, error: fetchError } = await supabase.from('todos').select();
        
        if (!mounted) return;
        
        if (fetchError) {
          console.error('Error fetching todos:', fetchError);
          setError(fetchError.message);
        } else {
          setTodos(data || []);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchTodos();
    
    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
        <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Supabase Connected
      </h2>
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="text-slate-300 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {todo.name}
          </li>
        ))}
        {todos.length === 0 && (
          <li className="text-slate-500 italic flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
            No todos found.
          </li>
        )}
      </ul>
    </div>
  );
}
