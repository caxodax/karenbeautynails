<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { X, ZoomIn } from '@lucide/svelte';

  // Fallback images in case the DB is empty
  const defaultImages = [
    { id: 1, image_url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=800&auto=format&fit=crop', caption: 'Manicura elegante en tonos nude' },
    { id: 2, image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop', caption: 'Diseño de uñas con brillos' },
    { id: 3, image_url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop', caption: 'Uñas acrílicas largas' },
    { id: 4, image_url: 'https://images.unsplash.com/photo-1595868840292-66380c55f118?q=80&w=800&auto=format&fit=crop', caption: 'Esmaltado semipermanente' },
    { id: 5, image_url: 'https://images.unsplash.com/photo-1516975080661-46bfa2c281c7?q=80&w=800&auto=format&fit=crop', caption: 'Pedicura spa' },
    { id: 6, image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=800&auto=format&fit=crop', caption: 'Diseño minimalista en uñas' }
  ];

  let images = $state<any[]>([]);
  let loading = $state(true);

  // Lightbox state
  let selectedImage = $state<any>(null);

  const fetchImages = async () => {
    loading = true;
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      images = data;
    } else {
      // If no images in DB yet, show placeholders so the section doesn't look empty
      images = defaultImages;
    }
    loading = false;
  };

  $effect(() => {
    fetchImages();
  });

  const openLightbox = (img: any) => {
    selectedImage = img;
    // Prevent background scrolling when lightbox is open
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    selectedImage = null;
    document.body.style.overflow = '';
  };
</script>

<section class="gallery-section" id="creaciones">
  <div class="content-wrapper">
    <div class="header">
      <h2>Nuestras Creaciones</h2>
      <p>Inspírate con los diseños y trabajos realizados a nuestras clientas.</p>
    </div>

    {#if loading}
      <div class="loading-state">Cargando creaciones...</div>
    {:else}
      <div class="sym-grid">
        {#each images as img (img.id)}
          <button class="grid-item" onclick={() => openLightbox(img)} aria-label="Ver imagen ampliada">
            <img src={img.image_url} alt={img.caption || 'Creación Karen Beauty'} loading="lazy" />
            <div class="overlay">
              <ZoomIn size={28} color="white" />
            </div>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- LIGHTBOX MODAL -->
{#if selectedImage}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="lightbox-backdrop" onclick={closeLightbox}>
    <button class="btn-close" aria-label="Cerrar" onclick={closeLightbox}>
      <X size={32} />
    </button>
    
    <div class="lightbox-content" onclick={(e) => e.stopPropagation()}>
      <img src={selectedImage.image_url} alt={selectedImage.caption || 'Detalle'} />
      {#if selectedImage.caption}
        <div class="caption">
          {selectedImage.caption}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .gallery-section {
    padding: 80px 24px;
    background-color: var(--color-neutro);
  }

  .content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 48px;
  }

  .header h2 {
    color: var(--color-grafito);
    margin-bottom: 12px;
    font-size: 2.2rem;
  }

  .header p {
    color: #666;
    font-size: 1.1rem;
    max-width: 500px;
    margin: 0 auto;
  }

  .loading-state {
    text-align: center;
    padding: 40px;
    color: #888;
    font-style: italic;
  }

  /* Cuadrícula Simétrica Perfecta */
  .sym-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (min-width: 600px) {
    .sym-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
  }

  @media (min-width: 1024px) {
    .sym-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
    }
  }

  .grid-item {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1; /* Cuadrado perfecto siempre */
    overflow: hidden;
    border-radius: 8px; /* Bordes ligeramente más rectos para un look premium */
    border: none;
    padding: 0;
    cursor: pointer;
    background: #eaeaea;
    box-shadow: var(--shadow-sm);
  }

  .grid-item img {
    width: 100%;
    height: 100%;
    object-fit: cover; /* Recorta la imagen para llenar el cuadrado sin distorsionar */
    transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(42, 44, 46, 0.4); /* Gris grafito transparente */
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .grid-item:hover img {
    transform: scale(1.08); /* Zoom premium */
  }

  .grid-item:hover .overlay {
    opacity: 1;
  }

  /* --- LIGHTBOX STYLES --- */
  .lightbox-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    animation: fadeIn 0.3s ease-out forwards;
    backdrop-filter: blur(8px);
  }

  .btn-close {
    position: absolute;
    top: 24px;
    right: 24px;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 8px;
    z-index: 10000;
    transition: transform 0.2s;
  }

  .btn-close:hover {
    transform: scale(1.1);
  }

  .lightbox-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    animation: zoomIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .lightbox-content img {
    max-width: 100%;
    max-height: 80vh; /* Deja espacio para el caption */
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  }

  .caption {
    margin-top: 16px;
    color: white;
    font-size: 1.1rem;
    font-weight: 300;
    text-align: center;
    max-width: 600px;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes zoomIn {
    from { 
      opacity: 0;
      transform: scale(0.95);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
