<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { Plus, Edit2, Trash2, List, X } from '@lucide/svelte';

  let items = $state<any[]>([]);
  let categories = $state<any[]>([]);
  let loading = $state(true);

  // Pagination and Filtering state
  let selectedCategory = $state<number | null>(null);
  let currentPage = $state(1);
  const itemsPerPage = 6;
  
  let filteredItems = $derived(
    selectedCategory === null 
      ? items 
      : items.filter(img => img.category_id === selectedCategory)
  );
  
  let totalPages = $derived(Math.max(1, Math.ceil(filteredItems.length / itemsPerPage)));
  let paginatedItems = $derived(filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));

  // Form state for Images
  let showForm = $state(false);
  let isEditing = $state(false);
  let currentId = $state<number | null>(null);
  
  let formData = $state({
    image_url: '',
    caption: '',
    category_id: null as number | null,
    active: true
  });
  let imageFile = $state<File | null>(null);
  let isUploading = $state(false);

  // Form state for Categories
  let showCategoriesModal = $state(false);
  let newCategoryName = $state('');
  let isSavingCategory = $state(false);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('gallery_categories')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      alert('Error al cargar categorías: ' + error.message + '. ¿Ejecutaste el script SQL en Supabase?');
    } else if (data) {
      categories = data;
    }
  };

  const fetchItems = async () => {
    loading = true;
    const { data, error } = await supabase
      .from('gallery')
      .select('*, gallery_categories(name)')
      .order('id', { ascending: false });

    if (!error && data) {
      items = data;
    }
    loading = false;
  };

  onMount(async () => {
    await fetchCategories();
    await fetchItems();
  });

  // --- IMAGE MANAGEMENT ---

  const openAddForm = () => {
    isEditing = false;
    currentId = null;
    imageFile = null;
    formData = {
      image_url: '',
      caption: '',
      category_id: categories.length > 0 ? categories[0].id : null,
      active: true
    };
    showForm = true;
  };

  const openEditForm = (item: any) => {
    isEditing = true;
    currentId = item.id;
    imageFile = null;
    formData = { 
      image_url: item.image_url,
      caption: item.caption || '',
      category_id: item.category_id,
      active: item.active
    };
    showForm = true;
  };

  const saveItem = async (e: Event) => {
    e.preventDefault();
    isUploading = true;
    
    if (!formData.category_id) {
      alert('Debes seleccionar una categoría.');
      isUploading = false;
      return;
    }

    if (imageFile) {
      const uploadData = new FormData();
      uploadData.append('file', imageFile);
      
      try {
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadData
        });
        
        const result = await uploadRes.json();
        if (uploadRes.ok) {
          formData.image_url = result.url;
        } else {
          alert('Error subiendo imagen: ' + result.error);
          isUploading = false;
          return;
        }
      } catch (err) {
        console.error(err);
        alert('Fallo al conectar con el servidor de subida.');
        isUploading = false;
        return;
      }
    }
    
    if (!formData.image_url) {
      alert('Debes subir una imagen.');
      isUploading = false;
      return;
    }

    if (isEditing && currentId) {
      const { error } = await supabase
        .from('gallery')
        .update(formData)
        .eq('id', currentId);
        
      if (!error) {
        showForm = false;
        fetchItems();
      } else {
        alert("Error al actualizar la imagen");
      }
    } else {
      const { error } = await supabase
        .from('gallery')
        .insert([formData]);
        
      if (!error) {
        showForm = false;
        fetchItems();
      } else {
        alert("Error al crear. ¿Está el RLS desactivado para 'gallery'?");
      }
    }
    isUploading = false;
  };

  const toggleActive = async (id: number, active: boolean) => {
    await supabase.from('gallery').update({ active }).eq('id', id);
    fetchItems();
  };

  const deleteItem = async (id: number) => {
    if (confirm("¿Estás segura de eliminar esta foto permanentemente de la galería?")) {
      const { error } = await supabase.from('gallery').delete().eq('id', id);
      if (!error) fetchItems();
    }
  };

  // --- CATEGORY MANAGEMENT ---

  const addCategory = async (e: Event) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    isSavingCategory = true;
    const { error } = await supabase
      .from('gallery_categories')
      .insert([{ name: newCategoryName.trim() }]);

    if (!error) {
      newCategoryName = '';
      fetchCategories();
    } else {
      alert('Error al crear la categoría.');
    }
    isSavingCategory = false;
  };

  const deleteCategory = async (id: number) => {
    // Check if category is used
    const isUsed = items.some(item => item.category_id === id);
    if (isUsed) {
      alert('No puedes eliminar esta categoría porque hay fotos que la están usando. Cámbiales la categoría primero.');
      return;
    }

    if (confirm('¿Eliminar esta categoría?')) {
      const { error } = await supabase.from('gallery_categories').delete().eq('id', id);
      if (!error) fetchCategories();
      else alert('Error al eliminar.');
    }
  };

</script>

<div class="dashboard">
  <header>
    <div class="header-content">
      <div>
        <h1>Galería de Creaciones</h1>
        <p>Sube las fotos de tus trabajos para el Lookbook público.</p>
      </div>
      <div class="header-actions">
        <button class="btn-secondary" onclick={() => showCategoriesModal = true}>
          <List size={20} />
          Categorías
        </button>
        <button class="btn-primary" onclick={openAddForm}>
          <Plus size={20} />
          Añadir Foto
        </button>
      </div>
    </div>
  </header>

  {#if loading}
    <div class="loading">Cargando galería...</div>
  {:else if showForm}
    <div class="form-card">
      <h2>{isEditing ? 'Editar Foto' : 'Añadir Nueva Foto'}</h2>
      <form onsubmit={saveItem}>
        
        <div class="input-group">
          <label for="imgFile">Subir Imagen</label>
          <input 
            id="imgFile" 
            type="file" 
            accept="image/*" 
            onchange={(e) => imageFile = e.currentTarget.files?.[0] || null} 
            required={!isEditing}
          />
          <small>Selecciona la foto. Se subirá a alta velocidad vía Cloudflare R2.</small>
        </div>

        <div class="input-group">
          <label for="categorySelect">Categoría</label>
          <select id="categorySelect" bind:value={formData.category_id} required>
            <option value={null} disabled>Selecciona una categoría...</option>
            {#each categories as cat}
              <option value={cat.id}>{cat.name}</option>
            {/each}
          </select>
          {#if categories.length === 0}
            <small style="color: red;">Primero debes crear una categoría desde el botón "Categorías".</small>
          {/if}
        </div>

        <div class="input-group">
          <label for="imgCaption">Descripción (Caption)</label>
          <input id="imgCaption" type="text" bind:value={formData.caption} placeholder="Ej. Manicura francesa con detalles dorados" />
          <small>Breve texto que aparecerá debajo de la foto en el Lightbox.</small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick={() => showForm = false} disabled={isUploading}>Cancelar</button>
          <button type="submit" class="btn-submit" disabled={isUploading || categories.length === 0}>
            {isUploading ? 'Subiendo y Guardando...' : 'Guardar Foto'}
          </button>
        </div>
      </form>

      {#if formData.image_url}
        <div class="preview-box">
          <h3>Vista Previa</h3>
          <img src={formData.image_url} alt="Vista previa" class="preview-img" />
        </div>
      {/if}
    </div>
  {:else}
    <!-- Filtros de Categoría Admin -->
    {#if categories.length > 0}
      <div class="admin-filters">
        <button 
          class="chip {selectedCategory === null ? 'active' : ''}" 
          onclick={() => { selectedCategory = null; currentPage = 1; }}
        >
          Todos
        </button>
        {#each categories as cat}
          <button 
            class="chip {selectedCategory === cat.id ? 'active' : ''}" 
            onclick={() => { selectedCategory = cat.id; currentPage = 1; }}
          >
            {cat.name}
          </button>
        {/each}
      </div>
    {/if}

    <div class="gallery-grid">
      {#if filteredItems.length === 0}
        <p class="empty-state">No has subido ninguna foto a la galería aún.</p>
      {:else}
        {#each paginatedItems as item (item.id)}
          <div class="gallery-card {item.active ? '' : 'inactive'}">
            <div class="img-container">
              <img src={item.image_url} alt={item.caption} loading="lazy" />
              {#if !item.active}
                <span class="badge badge-inactive">Oculta</span>
              {/if}
              {#if item.gallery_categories?.name}
                <span class="badge badge-category">{item.gallery_categories.name}</span>
              {/if}
            </div>
            <div class="info">
              <p class="desc">{item.caption || 'Sin descripción'}</p>
              
              <div class="actions">
                <button class="btn-icon" title="Editar" aria-label="Editar" onclick={() => openEditForm(item)}>
                  <Edit2 size={18} />
                </button>
                <button 
                  class="btn-text" 
                  onclick={() => toggleActive(item.id, !item.active)}>
                  {item.active ? 'Ocultar' : 'Mostrar'}
                </button>
                <button class="btn-icon delete" title="Eliminar" aria-label="Eliminar" onclick={() => deleteItem(item.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Paginación Admin -->
    {#if totalPages > 1}
      <div class="pagination">
        <button 
          class="page-btn" 
          disabled={currentPage === 1} 
          onclick={() => { currentPage--; window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          &laquo; Ant
        </button>
        <div class="page-info">
          Página {currentPage} de {totalPages}
        </div>
        <button 
          class="page-btn" 
          disabled={currentPage === totalPages} 
          onclick={() => { currentPage++; window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          Sig &raquo;
        </button>
      </div>
    {/if}
  {/if}
</div>

<!-- CATEGORIES MODAL -->
{#if showCategoriesModal}
  <div class="modal-backdrop" onclick={() => showCategoriesModal = false}>
    <div class="modal-content" onclick={(e) => e.stopPropagation()}>
      <button class="close-modal" onclick={() => showCategoriesModal = false}>
        <X size={24} />
      </button>
      
      <h2>Gestionar Categorías</h2>
      <p>Organiza tu portafolio por tipo de servicio.</p>

      <form class="category-form" onsubmit={addCategory}>
        <input type="text" bind:value={newCategoryName} placeholder="Ej. Uñas Acrílicas" required />
        <button type="submit" disabled={isSavingCategory}>
          {isSavingCategory ? '...' : 'Añadir'}
        </button>
      </form>

      <div class="categories-list">
        {#if categories.length === 0}
          <p class="empty-cat">No hay categorías. Añade una arriba.</p>
        {:else}
          {#each categories as cat}
            <div class="cat-item">
              <span>{cat.name}</span>
              <button class="btn-icon delete" onclick={() => deleteCategory(cat.id)} title="Eliminar Categoría">
                <Trash2 size={16} />
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .dashboard header {
    margin-bottom: 32px;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }

  h1 { margin: 0 0 8px 0; color: var(--color-grafito, #2A2C2E); }
  p { margin: 0; color: #666; }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--color-primary, #b3666d);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }
  .btn-primary:active { transform: scale(0.95); }

  .btn-secondary {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #f3f4f6;
    color: var(--color-grafito);
    border: 1px solid #e5e7eb;
    padding: 10px 16px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .btn-secondary:hover {
    background-color: #e5e7eb;
  }

  /* Form Styles */
  .form-card {
    background: white;
    padding: 32px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    max-width: 600px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  label { font-weight: 600; font-size: 0.9rem; color: #444; }
  
  input, select {
    padding: 12px;
    border: 1.5px solid #eaeaea;
    border-radius: 8px;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
    background-color: white;
  }
  select:focus, input:focus { outline: none; border-color: var(--color-primary); }
  
  small { color: #888; font-size: 0.8rem; }

  .form-actions {
    display: flex;
    gap: 12px;
    margin-top: 32px;
  }
  .btn-submit {
    flex: 1;
    background-color: var(--color-grafito, #2A2C2E);
    color: white;
    border: none;
    padding: 12px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
  .btn-cancel {
    padding: 12px 24px;
    background: transparent;
    border: 1px solid #ccc;
    border-radius: 8px;
    cursor: pointer;
  }

  .preview-box {
    margin-top: 32px;
    border-top: 1px solid #eee;
    padding-top: 24px;
  }

  .preview-box h3 { margin-top: 0; color: #666; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }

  .preview-img {
    width: 100%;
    max-width: 300px;
    aspect-ratio: 1/1;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #eaeaea;
  }

  /* Grid Styles */
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 24px;
  }

  .gallery-card {
    background: white;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(0,0,0,0.02);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
  }
  
  .gallery-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(179, 102, 109, 0.12);
  }
  
  .gallery-card.inactive { opacity: 0.6; transform: none; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }

  .img-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1/1;
    background-color: #f0f0f0;
    overflow: hidden;
  }
  
  .img-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .gallery-card:hover .img-container img {
    transform: scale(1.05);
  }
  
  .badge {
    position: absolute;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .badge-inactive {
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.7);
  }
  .badge-category {
    bottom: 12px;
    left: 12px;
    background: var(--color-primary);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .info {
    padding: 16px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  .desc { 
    color: #444; 
    font-size: 0.9rem; 
    margin: 0 0 16px 0; 
    flex-grow: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f0f0f0;
    padding-top: 12px;
  }

  .btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #666;
    padding: 6px;
    border-radius: 8px;
  }
  .btn-icon:hover { background: #f5f5f5; color: var(--color-grafito); }
  .btn-icon.delete:hover { color: #c5221f; background: #fce8e6; }
  
  .btn-text {
    background: transparent;
    border: 1px solid #ddd;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    cursor: pointer;
  }
  .btn-text:hover { background: #f5f5f5; }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #888;
    background: white;
    border-radius: 12px;
  }

  /* Modal Categories */
  .modal-backdrop {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .modal-content {
    background: white;
    padding: 32px;
    border-radius: 16px;
    width: 90%;
    max-width: 400px;
    position: relative;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  }
  .close-modal {
    position: absolute;
    top: 16px; right: 16px;
    background: none; border: none; cursor: pointer; color: #888;
  }
  .modal-content h2 { margin: 0 0 8px 0; font-size: 1.5rem; }
  .modal-content p { color: #666; margin-bottom: 24px; font-size: 0.9rem; }
  
  .category-form {
    display: flex; gap: 8px; margin-bottom: 24px;
  }
  .category-form button {
    background: var(--color-grafito); color: white; border: none;
    padding: 0 16px; border-radius: 8px; font-weight: 600; cursor: pointer;
  }
  
  .categories-list {
    display: flex; flex-direction: column; gap: 8px;
    max-height: 300px; overflow-y: auto;
  }
  .cat-item {
    display: flex; justify-content: space-between; align-items: center;
    background: #f9fafb; padding: 12px 16px; border-radius: 8px;
    border: 1px solid #f3f4f6;
  }
  .empty-cat { text-align: center; color: #aaa; font-style: italic; }

  /* Admin Pagination */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 40px;
    padding-bottom: 24px;
  }
  .page-btn {
    background: white;
    border: 1px solid #ddd;
    color: var(--color-grafito);
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .page-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
  .page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: #f9f9f9;
  }
  .page-info {
    font-size: 0.95rem;
    color: #555;
    font-weight: 500;
  }

  /* Admin Filters */
  .admin-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
  }
  
  .chip {
    background-color: white;
    border: 1px solid #eaeaea;
    color: #666;
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .chip:hover {
    border-color: #ccc;
    color: var(--color-grafito);
  }

  .chip.active {
    background-color: var(--color-primary, #b3666d);
    border-color: var(--color-primary, #b3666d);
    color: white;
  }

  @media (max-width: 600px) {
    .header-content { flex-direction: column; align-items: stretch; text-align: center; }
    .header-actions { justify-content: center; }
  }
</style>
