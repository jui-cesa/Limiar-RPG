/* ========================================
   LIMIAR: CONTROLE DE DANOS
   ======================================== */

window.LIMIAR_CONFIG = {
  SUPABASE_URL: 'https://snjkfserlnqnsgtxtkdh.supabase.co',
  SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuamtmc2VybG5xbnNndHh0a2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTQzMjcsImV4cCI6MjA5MTU5MDMyN30.sbLkULzxLuLlBnYSYdVNN32RJBmPPw-BJmHq6YB5WVg'
};

/* Singleton: garante UMA instância de cliente Supabase compartilhada entre todos os scripts */
window.getLimiarSupabase = function () {
  if (window.__limiarSupabaseClient) return window.__limiarSupabaseClient;
  var cfg = window.LIMIAR_CONFIG;
  if (!cfg || !cfg.SUPABASE_URL || cfg.SUPABASE_URL === 'SUA_URL_AQUI') return null;
  if (typeof window.supabase === 'undefined') return null;
  window.__limiarSupabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  return window.__limiarSupabaseClient;
};
