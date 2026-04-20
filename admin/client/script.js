import { supabase } from '../script/supabase.js';

// --- ELEMENT REFERENCES ---
const loginForm = document.getElementById('loginForm');
const dashboardPanel = document.getElementById('dashboardPanel');
const formPanel = document.getElementById('formPanel');
const dynamicContentsArea = document.getElementById('dynamicContentsArea');

// --- A. AUTENTIKASI ---
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showPanel('dashboard');
        loadArticles();
    } else {
        showPanel('login');
    }
}

document.getElementById('btnLogin').addEventListener('click', async () => {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPass').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Login Gagal: " + error.message);
    else checkSession();
});

document.getElementById('btnLogout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    checkSession();
});

// --- B. MANAJEMEN TAMPILAN ---
function showPanel(panelName) {
    loginForm.style.display = panelName === 'login' ? 'block' : 'none';
    dashboardPanel.style.display = panelName === 'dashboard' ? 'block' : 'none';
    formPanel.style.display = panelName === 'form' ? 'block' : 'none';
}

document.getElementById('btnShowForm').addEventListener('click', () => {
    resetForm();
    showPanel('form');
});

document.getElementById('btnCancel').addEventListener('click', () => {
    showPanel('dashboard');
});

// --- C. DASHBOARD ARTIKEL ---
async function loadArticles() {
    const tbody = document.getElementById('articleTableBody');
    tbody.innerHTML = '<tr><td colspan="4">Memuat data...</td></tr>';

    const { data, error } = await supabase.from('articles').select('id, title, category, created_at').order('created_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4">Error: ${error.message}</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    data.forEach(art => {
        const date = new Date(art.created_at).toLocaleDateString('id-ID');
        tbody.innerHTML += `
            <tr>
                <td><strong>${art.title}</strong></td>
                <td>${art.category}</td>
                <td>${date}</td>
                <td>
                    <button class="btn-admin" style="padding: 5px 10px; font-size: 0.8rem;" onclick="editArticle('${art.id}')">Edit</button>
                    <button class="btn-danger" style="padding: 5px 10px; font-size: 0.8rem;" onclick="deleteArticle('${art.id}')">Hapus</button>
                </td>
            </tr>
        `;
    });
}

// --- D. FITUR KONTEN DINAMIS ---
document.getElementById('btnAddBlock').addEventListener('click', () => {
    const blockId = Date.now();
    const blockHTML = `
        <div class="content-block" id="block-${blockId}">
            <button class="remove-block" onclick="this.parentElement.remove()">Hapus</button>
            <div class="form-group">
                <label>Judul Bagian</label>
                <input type="text" class="block-title" placeholder="Contoh: Masa Perjuangan">
            </div>
            <div class="form-group">
                <label>Isi Teks</label>
                <textarea class="block-text" rows="4" placeholder="Penjelasan bagian ini..."></textarea>
            </div>
        </div>
    `;
    dynamicContentsArea.insertAdjacentHTML('beforeend', blockHTML);
});

// --- E. SIMPAN ARTIKEL (INSERT / UPDATE) ---
document.getElementById('btnSave').addEventListener('click', async () => {
    // 1. Ambil Data Dasar
    const id = document.getElementById('editArticleId').value;
    const title = document.getElementById('artTitle').value;
    const category = document.getElementById('artCategory').value;
    const slug = document.getElementById('artSlug').value;
    
    // --- LOGIKA GAMBAR BARU ---
    const fileInput = document.getElementById('artImageFile').files[0];
    let finalImageUrl = document.getElementById('artImageUrl').value; // Default menggunakan URL teks

    // Jika admin mengunggah file gambar
    if (fileInput) {
        // Beri nama unik pada file agar tidak tertimpa (menggunakan waktu saat ini)
        const fileExt = fileInput.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        // Unggah ke bucket 'images' di Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, fileInput);

        if (uploadError) {
            return alert("Gagal mengunggah gambar: " + uploadError.message);
        }

        // Dapatkan URL publik dari gambar yang baru diunggah
        const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);
            
        // Gunakan URL ini untuk disimpan ke database
        finalImageUrl = publicUrlData.publicUrl;
    }
    // ----------------------------

    // 2. Ambil Data Konten & Rangkai Menjadi HTML
    const subtitle = document.getElementById('artSubtitle').value;
    const about = document.getElementById('artAbout').value;
    const intro = document.getElementById('artIntro').value;

    let builtContent = '';
    if (subtitle) builtContent += `<h2>${subtitle}</h2>`;
    if (about) builtContent += `<p class="art-about"><strong>Tentang:</strong> ${about}</p>`;
    if (intro) builtContent += `<div class="art-intro">${intro.replace(/\n/g, '<br>')}</div><hr>`;

    document.querySelectorAll('.content-block').forEach(block => {
        const bTitle = block.querySelector('.block-title').value;
        const bText = block.querySelector('.block-text').value;
        if (bTitle || bText) {
            builtContent += `<h3>${bTitle}</h3>`;
            builtContent += `<p>${bText.replace(/\n/g, '<br>')}</p>`;
        }
    });

    // 3. Validasi
    if (!title || !slug) return alert("Judul dan Slug wajib diisi!");
    if (!finalImageUrl) return alert("Mohon upload gambar atau masukkan URL gambar!");

    // 4. Kirim ke Database
    const payload = {
        title: title,
        category: category,
        slug: slug,
        image_url: finalImageUrl, // Menggunakan URL hasil upload atau teks
        content: builtContent 
    };

    let error;
    if (id) {
        const res = await supabase.from('articles').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('articles').insert([payload]);
        error = res.error;
    }

    if (error) {
        alert("Gagal menyimpan: " + error.message);
    } else {
        alert("Artikel berhasil disimpan!");
        showPanel('dashboard');
        loadArticles();
    }
});

// --- F. FUNGSI EDIT & HAPUS (EXPOSED GLOBAL) ---
window.deleteArticle = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
        const { error } = await supabase.from('articles').delete().eq('id', id);
        if (error) alert("Gagal menghapus: " + error.message);
        else loadArticles();
    }
};

window.editArticle = async (id) => {
    // Alert info karena merombak HTML balik ke form agak rumit jika sudah digabung
    alert("Untuk versi saat ini, Anda bisa mengubah Judul/Kategori/Gambar/Slug. Mengedit struktur isi (Konten) akan menimpa data lama.");
    
    const { data, error } = await supabase.from('articles').select('*').eq('id', id).single();
    if (data) {
        document.getElementById('editArticleId').value = data.id;
        document.getElementById('formTitle').innerText = "Edit Artikel: " + data.title;
        
        document.getElementById('artTitle').value = data.title;
        document.getElementById('artCategory').value = data.category;
        document.getElementById('artSlug').value = data.slug;
        
        // --- PERUBAHAN GAMBAR DI SINI ---
        document.getElementById('artImageFile').value = ''; // Kosongkan file input agar tidak bentrok
        document.getElementById('artImageUrl').value = data.image_url; // Masukkan URL yang sudah ada di database
        // ---------------------------------
        
        // Kosongkan area dinamis agar user menulis ulang atau tambahkan logika parse HTML (Advance)
        dynamicContentsArea.innerHTML = '';
        document.getElementById('artSubtitle').value = '';
        document.getElementById('artAbout').value = '';
        document.getElementById('artIntro').value = '';

        showPanel('form');
    }
};

// --- G. RESET FORM ---
function resetForm() {
    document.getElementById('editArticleId').value = '';
    document.getElementById('formTitle').innerText = "Buat Artikel Baru";
    document.querySelectorAll('input:not([type="hidden"]), textarea').forEach(el => el.value = '');
    
    // --- PERUBAHAN GAMBAR DI SINI ---
    // Memastikan input file dan URL benar-benar bersih saat membuat artikel baru
    document.getElementById('artImageFile').value = '';
    document.getElementById('artImageUrl').value = '';
    // ---------------------------------
    
    dynamicContentsArea.innerHTML = ''; // Kosongkan blok dinamis
}

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', checkSession);
