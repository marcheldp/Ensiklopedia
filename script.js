import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://akktasxpxfbhlcfnypzt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFra3Rhc3hweGZiaGxjZm55cHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY2MjQsImV4cCI6MjA5MjI2MjYyNH0.luxCsBuXwueYSYjF5TFbs4jqxejFI_0vP0aHzMS1clI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variabel memori untuk melacak kategori yang sedang aktif
let activeCategory = null;

/**
 * 1. Fungsi Pencarian Pintar
 */
async function searchFunction() {
    const input = document.getElementById('searchInput').value.trim();
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('loadingSpinner');
    const searchBtn = document.getElementById('searchBtn');
    const breadcrumb = document.getElementById('mainBreadcrumb');

    if (!input) return; 

    // Reset status kategori jika user melakukan pencarian (Hapus class active-btn)
    activeCategory = null;
    document.querySelectorAll('.sub-item').forEach(btn => {
        btn.classList.remove('active-btn');
    });

    if (btnText && spinner && searchBtn) {
        btnText.style.display = 'none';
        spinner.style.display = 'block';
        searchBtn.disabled = true;
    }

    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .textSearch('fts', input, { type: 'websearch', config: 'indonesian' });

    if (btnText && spinner && searchBtn) {
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
        searchBtn.disabled = false;
    }

    if (error) {
        console.error('Error saat mencari:', error);
        return;
    }

    if (breadcrumb) {
        breadcrumb.style.display = 'block';
        document.getElementById('sub-breadcrumb').innerText = "Hasil Pencarian";
        document.getElementById('title-breadcrumb').innerText = `"${input}"`;
    }

    displayResults(data, `Hasil Pencarian: "${input}"`);
}

/**
 * 2. Fungsi untuk memuat artikel terbaru (Default Home)
 */
async function loadLatestArticles() {
    const container = document.getElementById('latestArticlesGrid');
    if (!container) return;

    const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false }) 
        .limit(6);

    if (error || data.length === 0) {
        container.innerHTML = `<p style="text-align:center; grid-column: 1 / -1;">Belum ada artikel yang diterbitkan.</p>`;
        return;
    }

    displayResults(data, "Artikel Unggulan");
}

/**
 * 3. Fungsi Render Hasil ke Antarmuka
 */
function displayResults(articles, title) {
    const container = document.getElementById('latestArticlesGrid');
    const sectionTitle = document.getElementById('sectionTitle');
    
    if (sectionTitle) sectionTitle.innerText = title;

    if (articles.length === 0) {
        container.innerHTML = `<p style="text-align:center; color: #666; grid-column: 1 / -1; margin-top: 20px;">Tidak ada data ditemukan.</p>`;
    } else {
        let html = '';
        articles.forEach(art => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = art.content;
            const aboutElement = tempDiv.querySelector('.art-about');
            let excerpt = aboutElement 
                ? aboutElement.innerText.replace('Tentang:', '').trim() 
                : (tempDiv.innerText.substring(0, 150) + '...');

            html += `
                <article class="article-card-home">
                    <img src="${art.image_url}" alt="Foto ${art.title}" loading="lazy">
                    <div class="card-body">
                        <a href="article.html?slug=${art.slug}" class="card-title">${art.title}</a>
                        <p class="card-excerpt">${excerpt}</p>
                    </div>
                </article>
            `;
        });
        
        container.innerHTML = html;
    }

    document.getElementById('featuredSection').scrollIntoView({ behavior: 'smooth' });
}

/**
 * 4. Event Listener untuk Subkategori di Home (DENGAN CSS CLASS TOGGLE)
 */
/**
 * 4. Event Listener untuk Subkategori di Home (DENGAN CSS CLASS TOGGLE)
 */
document.querySelectorAll('.sub-item').forEach(item => {
    item.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // --- BARIS AJAIB: Paksa browser melepaskan fokus dari tombol ---
        item.blur(); 
        
        const clickedCategory = item.innerText.trim(); 
        const breadcrumb = document.getElementById('mainBreadcrumb');

        // CEK TOGGLE: Apakah yang ditekan adalah kategori yang sudah aktif?
        if (activeCategory === clickedCategory) {
            // --- MATIKAN FILTER ---
            activeCategory = null; 
            
            // Hapus class 'active-btn' dari tombol ini agar warnanya kembali normal
            item.classList.remove('active-btn');
            
            if (breadcrumb) breadcrumb.style.display = 'none';
            
            // Tarik ulang artikel bawaan
            loadLatestArticles(); 
            document.getElementById('featuredSection').scrollIntoView({ behavior: 'smooth' });

        } else {
            // --- HIDUPKAN FILTER BARU ---
            activeCategory = clickedCategory; 

            // 1. Hapus class 'active-btn' dari SEMUA tombol terlebih dahulu
            document.querySelectorAll('.sub-item').forEach(btn => {
                btn.classList.remove('active-btn');
            });

            // 2. Tambahkan class 'active-btn' HANYA ke tombol yang sedang diklik
            item.classList.add('active-btn');

            if (breadcrumb) {
                breadcrumb.style.display = 'block';
                document.getElementById('sub-breadcrumb').innerText = "Kategori";
                document.getElementById('title-breadcrumb').innerText = clickedCategory;
            }

            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .eq('category', clickedCategory);

            if (!error) displayResults(data, `Kategori: ${clickedCategory}`);
        }
    });
});

/**
 * 5. Inisialisasi Event Listener saat DOM Siap
 */
document.addEventListener('DOMContentLoaded', () => {
    loadLatestArticles();

    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');

    if (searchInput && searchBtn) {
        searchInput.addEventListener('input', () => {
            searchBtn.disabled = searchInput.value.trim() === '';
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', searchFunction);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim() !== '') {
                e.preventDefault(); 
                searchFunction();
            }
        });
    }
});
