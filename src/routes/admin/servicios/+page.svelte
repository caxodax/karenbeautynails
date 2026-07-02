<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { Plus, Edit2, Trash2, Image as ImageIcon, Clock } from '@lucide/svelte';

  let services = $state<any[]>([]);
  let loading = $state(true);

  // Form state
  let showForm = $state(false);
  let isEditing = $state(false);
  let currentId = $state<number | null>(null);
  let imageFile = $state<File | null>(null);
  let isUploading = $state(false);
  
  let formData = $state({
    name: '',
    description: '',
    price: 0,
    duration_minutes: 60,
    image_url: '',
    active: true
  });

  const fetchServices = async () => {
    loading = true;
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) {
      services = data;
    }
    loading = false;
  };

  onMount(() => {
    fetchServices();
  });

  const openAddForm = () => {
    isEditing = false;
    currentId = null;
    imageFile = null;
    formData = {
      name: '',
      description: '',
      price: 0,
      duration_minutes: 60,
      image_url: '',
      active: true
    };
    showForm = true;
  };

  const openEditForm = (service: any) => {
    isEditing = true;
    currentId = service.id;
    imageFile = null;
    formData = { ...service };
    showForm = true;
  };

  const saveService = async (e: Event) => {
    e.preventDefault();
    isUploading = true;

    // Subir imagen a Cloudflare si hay un archivo seleccionado
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
      alert('Debes subir una imagen para el servicio.');
      isUploading = false;
      return;
    }
    
    if (isEditing && currentId) {
      const { error } = await supabase
        .from('services')
        .update(formData)
        .eq('id', currentId);
        
      if (!error) {
        showForm = false;
        fetchServices();
      } else {
        alert("Error al actualizar");
      }
    } else {
      const { error } = await supabase
        .from('services')
        .insert([formData]);
        
      if (!error) {
        showForm = false;
        fetchServices();
      } else {
        alert("Error al crear. ¿Está el RLS desactivado para 'services'?");
      }
    }
    isUploading = false;
  };

  const toggleActive = async (id: number, active: boolean) => {
    await supabase.from('services').update({ active }).eq('id', id);
    fetchServices();
  };

  const deleteService = async (id: number) => {
    if (confirm("¿Estás segura de eliminar este servicio permanentemente?")) {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (!error) fetchServices();
    }
  };
</script>

<div class="dashboard">
  <header>
    <div class="header-content">
      <div>
        <h1>Catálogo de Servicios</h1>
        <p>Gestiona los trabajos y servicios que ofreces.</p>
      </div>
      <button class="btn-primary" onclick={openAddForm}>
        <Plus size={20} />
        Nuevo Servicio
      </button>
    </div>
  </header>

  {#if loading}
    <div class="loading">Cargando catálogo...</div>
  {:else if showForm}
    <div class="form-card">
      <h2>{isEditing ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}</h2>
      <form onsubmit={saveService}>
        
        <div class="input-group">
          <label for="serviceName">Nombre del servicio</label>
          <input id="serviceName" type="text" bind:value={formData.name} required />
        </div>

        <div class="input-group">
          <label for="serviceDesc">Descripción</label>
          <textarea id="serviceDesc" bind:value={formData.description} rows="3" required></textarea>
        </div>

        <div class="row-group">
          <div class="input-group">
            <label for="servicePrice">Precio ($)</label>
            <input id="servicePrice" type="number" bind:value={formData.price} required min="0" step="0.01" />
          </div>
          <div class="input-group">
            <label for="serviceDuration">Duración (minutos)</label>
            <input id="serviceDuration" type="number" bind:value={formData.duration_minutes} required min="15" step="15" />
          </div>
        </div>

        <div class="input-group">
          <label for="serviceImage">Subir Imagen del Servicio</label>
          <input 
            id="serviceImage" 
            type="file" 
            accept="image/*" 
            onchange={(e) => imageFile = e.currentTarget.files?.[0] || null}
            required={!isEditing && !formData.image_url}
          />
          <small>Selecciona una foto. Se subirá rápidamente vía Cloudflare R2.</small>
          {#if formData.image_url && !imageFile}
            <small style="color: green;">Ya hay una imagen guardada. Sube una nueva solo si deseas reemplazarla.</small>
          {/if}
        </div>

        <div class="form-actions">
          <button type="button" class="btn-cancel" onclick={() => showForm = false} disabled={isUploading}>Cancelar</button>
          <button type="submit" class="btn-submit" disabled={isUploading}>
            {isUploading ? 'Subiendo y Guardando...' : (isEditing ? 'Actualizar' : 'Crear Servicio')}
          </button>
        </div>
      </form>
    </div>
  {:else}
    <div class="services-grid">
      {#each services as service}
        <div class="service-card {service.active ? '' : 'inactive'}">
          <div class="img-container">
            <img src={service.image_url} alt={service.name} loading="lazy" />
            {#if !service.active}
              <span class="badge-inactive">Oculto</span>
            {/if}
          </div>
          <div class="info">
            <h3>{service.name}</h3>
            <p class="desc">{service.description}</p>
            <div class="details">
              <span class="price">
                {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(service.price)}
              </span>
              <span class="time"><Clock size={14} style="margin-right:4px;" />{service.duration_minutes} min</span>
            </div>
            
            <div class="actions">
              <button class="btn-icon" title="Editar" onclick={() => openEditForm(service)}>
                <Edit2 size={18} />
              </button>
              <button 
                class="btn-text" 
                onclick={() => toggleActive(service.id, !service.active)}>
                {service.active ? 'Ocultar' : 'Mostrar'}
              </button>
              <button class="btn-icon delete" title="Eliminar" onclick={() => deleteService(service.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      {/each}
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
    margin-bottom: 20px;
  }

  .row-group {
    display: flex;
    gap: 16px;
  }
  .row-group .input-group { flex: 1; }

  label { font-weight: 600; font-size: 0.9rem; color: #444; }
  
  input, textarea {
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

  /* Grid Styles */
  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 24px;
  }

  .service-card {
    background: white;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(0,0,0,0.02);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
  }
  
  .service-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(179, 102, 109, 0.12);
  }
  
  .service-card.inactive { opacity: 0.6; transform: none; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }

  .img-container {
    position: relative;
    aspect-ratio: 4/3;
    background-color: #f0f0f0;
    overflow: hidden;
  }
  
  .img-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .service-card:hover .img-container img {
    transform: scale(1.05);
  }
  
  .badge-inactive {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .info {
    padding: 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  h3 { margin: 0 0 12px 0; color: var(--color-grafito); font-family: var(--font-heading); font-size: 1.25rem; }
  .desc { color: #666; font-size: 0.95rem; margin: 0 0 16px 0; flex-grow: 1; line-height: 1.5; }
  
  .details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }
  
  .price { font-weight: 500; color: var(--color-primary); font-size: 1.4rem; font-family: var(--font-heading); }
  .time { color: #888; font-size: 0.85rem; display: flex; align-items: center; }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    color: #666;
    padding: 8px;
    border-radius: 8px;
  }
  .btn-icon:hover { background: #f5f5f5; color: var(--color-grafito); }
  .btn-icon.delete:hover { color: #c5221f; background: #fce8e6; }
  
  .btn-text {
    background: transparent;
    border: 1px solid #ddd;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .btn-text:hover { background: #f5f5f5; }

  @media (max-width: 600px) {
    .header-content { flex-direction: column; align-items: stretch; text-align: center; }
    .btn-primary { justify-content: center; }
    .row-group { flex-direction: column; gap: 0; }
  }
</style>
