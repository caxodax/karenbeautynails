<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { Save } from '@lucide/svelte';

  let loading = $state(true);
  let isSaving = $state(false);
  let imageFile = $state<File | null>(null);

  let settings = $state({
    id: 1,
    hero_image_url: '/hero_bg.png',
    hero_title: 'El arte de cuidar tu esencia',
    hero_subtitle: 'Diseño de uñas y estética profesional en un ambiente diseñado para tu relajación absoluta.'
  });

  const fetchSettings = async () => {
    loading = true;
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (!error && data) {
      settings = data;
    }
    loading = false;
  };

  onMount(() => {
    fetchSettings();
  });

  const saveSettings = async (e: Event) => {
    e.preventDefault();
    isSaving = true;

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
          settings.hero_image_url = result.url;
        } else {
          alert('Error subiendo imagen: ' + result.error);
          isSaving = false;
          return;
        }
      } catch (err) {
        console.error(err);
        alert('Fallo al conectar con el servidor de subida.');
        isSaving = false;
        return;
      }
    }

    const { error } = await supabase
      .from('site_settings')
      .update({
        hero_image_url: settings.hero_image_url,
        hero_title: settings.hero_title,
        hero_subtitle: settings.hero_subtitle
      })
      .eq('id', 1);

    if (!error) {
      alert("Ajustes guardados correctamente. Los cambios ya son visibles en la página principal.");
      imageFile = null;
    } else {
      alert("Error al guardar ajustes.");
    }
    
    isSaving = false;
  };
</script>

<div class="dashboard">
  <header>
    <div class="header-content">
      <div>
        <h1>Ajustes del Sitio</h1>
        <p>Personaliza la apariencia y el contenido principal de tu página.</p>
      </div>
    </div>
  </header>

  {#if loading}
    <div class="loading">Cargando ajustes...</div>
  {:else}
    <div class="settings-card">
      <h2>Sección Principal (Hero)</h2>
      <p class="subtitle">Esta es la primera sección que ven tus clientes al entrar a la web.</p>

      <form onsubmit={saveSettings}>
        
        <div class="input-group">
          <label for="heroTitle">Título Principal</label>
          <input id="heroTitle" type="text" bind:value={settings.hero_title} required />
        </div>

        <div class="input-group">
          <label for="heroSubtitle">Subtítulo o Descripción</label>
          <textarea id="heroSubtitle" bind:value={settings.hero_subtitle} rows="2" required></textarea>
        </div>

        <div class="input-group">
          <label for="heroImage">Imagen de Fondo</label>
          <input 
            id="heroImage" 
            type="file" 
            accept="image/*" 
            onchange={(e) => imageFile = e.currentTarget.files?.[0] || null}
          />
          <small>Sube una nueva foto solo si quieres reemplazar la actual. Se recomienda formato horizontal de alta calidad.</small>
        </div>

        <div class="preview-box">
          <h3>Vista Previa Actual</h3>
          <img src={settings.hero_image_url} alt="Fondo Hero" class="preview-img" />
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit" disabled={isSaving}>
            <Save size={18} />
            {isSaving ? 'Guardando cambios...' : 'Guardar Ajustes'}
          </button>
        </div>
      </form>
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
  }

  h1 { margin: 0 0 8px 0; color: var(--color-grafito, #2A2C2E); }
  p { margin: 0; color: #666; }

  .settings-card {
    background: white;
    padding: 40px;
    border-radius: 24px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.03);
    max-width: 800px;
    border: 1px solid rgba(0,0,0,0.02);
  }

  .settings-card h2 {
    margin: 0 0 8px 0;
    color: var(--color-grafito);
    font-family: var(--font-heading);
  }

  .subtitle {
    color: #888;
    margin-bottom: 32px;
    font-size: 0.95rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 24px;
  }

  label { font-weight: 600; font-size: 0.9rem; color: #444; }
  
  input, textarea {
    padding: 12px;
    border: 1.5px solid #eaeaea;
    border-radius: 12px;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }
  
  input:focus, textarea:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  small { color: #888; font-size: 0.8rem; }

  .preview-box {
    margin-top: 32px;
    margin-bottom: 32px;
    background: #f9f9f9;
    padding: 24px;
    border-radius: 16px;
  }

  .preview-box h3 { 
    margin-top: 0; 
    color: #666; 
    font-size: 0.85rem; 
    text-transform: uppercase; 
    letter-spacing: 0.05em; 
    margin-bottom: 16px; 
  }

  .preview-img {
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 12px;
    border: 1px solid #eaeaea;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid rgba(0,0,0,0.05);
    padding-top: 24px;
  }

  .btn-submit {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: var(--color-primary, #b3666d);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
    transition: transform 0.2s;
  }
  
  .btn-submit:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .btn-submit:disabled { 
    opacity: 0.7; 
    cursor: not-allowed; 
  }
</style>
