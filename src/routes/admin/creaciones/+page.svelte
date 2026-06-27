<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { Plus, Edit2, Trash2, Image as ImageIcon } from '@lucide/svelte';

  let items = $state<any[]>([]);
  let loading = $state(true);

  // Form state
  let showForm = $state(false);
  let isEditing = $state(false);
  let currentId = $state<number | null>(null);
  
  let formData = $state({
    image_url: '',
    caption: '',
    active: true
  });
  let imageFile = $state<File | null>(null);
  let isUploading = $state(false);

  const fetchItems = async () => {
    loading = true;
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      items = data;
    }
    loading = false;
  };

  onMount(() => {
    fetchItems();
  });

  const openAddForm = () => {
    isEditing = false;
    currentId = null;
    imageFile = null;
    formData = {
      image_url: '',
      caption: '',
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
      active: item.active
    };
    showForm = true;
  };

  const saveItem = async (e: Event) => {
    e.preventDefault();
    isUploading = true;
    
    // Si hay un archivo nuevo, lo subimos primero
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
</script>

<div class="dashboard">
  <header>
    <div class="header-content">
      <div>
        <h1>Galería de Creaciones</h1>
        <p>Sube las fotos de tus trabajos para el Lookbook público.</p>
      </div>
      <button class="btn-primary" onclick={openAddForm}>
        <Plus size={20} />
        Añadir Foto
      </button>
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
          <small>Selecciona la foto desde tu dispositivo. Se subirá a alta velocidad vía Cloudflare R2.</small>
        </div>

        <div class="input-group">
          <label for="imgCaption">Descripción (Caption)</label>
          <input id="imgCaption" type="text" bind:value={formData.caption} placeholder="Ej. Manicura francesa con detalles dorados" />
          <small>Breve texto que aparecerá debajo de la foto en el Lightbox.</small>
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick={() => showForm = false} disabled={isUploading}>Cancelar</button>
          <button type="submit" class="btn-submit" disabled={isUploading}>
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
    <div class="gallery-grid">
      {#if items.length === 0}
        <p class="empty-state">No has subido ninguna foto a la galería aún.</p>
      {:else}
        {#each items as item}
          <div class="gallery-card {item.active ? '' : 'inactive'}">
            <div class="img-container">
              <img src={item.image_url} alt={item.caption} loading="lazy" />
              {#if !item.active}
                <span class="badge-inactive">Oculta</span>
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
  {/if}
</div>

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
  
  input {
    padding: 12px;
    border: 1.5px solid #eaeaea;
    border-radius: 8px;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }
  
  .image-input {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1.5px solid #eaeaea;
    padding: 0 12px;
    border-radius: 8px;
  }
  .image-input input { border: none; padding-left: 0; }
  .image-input input:focus { outline: none; }
  
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
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
    transition: opacity 0.3s;
  }
  
  .gallery-card.inactive { opacity: 0.6; }

  .img-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1/1;
    background-color: #f0f0f0;
  }
  
  .img-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .badge-inactive {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
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

  @media (max-width: 600px) {
    .header-content { flex-direction: column; align-items: stretch; text-align: center; }
    .btn-primary { justify-content: center; }
  }
</style>
