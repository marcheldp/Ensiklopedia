// Mengambil langsung dari CDN khusus ES Modules
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Masukkan langsung kunci Anda di sini (karena .env tidak berfungsi tanpa Vite)
const supabaseUrl = 'https://akktasxpxfbhlcfnypzt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFra3Rhc3hweGZiaGxjZm55cHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY2MjQsImV4cCI6MjA5MjI2MjYyNH0.luxCsBuXwueYSYjF5TFbs4jqxejFI_0vP0aHzMS1clI';

// Inisialisasi client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
