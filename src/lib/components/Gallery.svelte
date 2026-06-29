<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { X, ZoomIn } from '@lucide/svelte';

  // Fallback images in case the DB is empty
  const defaultImages = [
    { id: 1, image_url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=800&auto=format&fit=crop', caption: 'Manicura elegante en tonos nude', category_id: null },
    { id: 2, image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop', caption: 'Diseño de uñas con brillos', category_id: null },
    { id: 3, image_url: 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=800&auto=format&fit=crop', caption: 'Uñas acrílicas largas', category_id: null },
    { id: 4, image_url: 'https://images.unsplash.com/photo-1595868840292-66380c55f118?q=80&w=800&auto=format&fit=crop', caption: 'Esmaltado semipermanente', category_id: null },
    { id: 5, image_url: 'https://images.unsplash.com/photo-1516975080661-46bfa2c281c7?q=80&w=800&auto=format&fit=crop', caption: 'Pedicura spa', category_id: null },
    { id: 6, image_url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=800&auto=format&fit=crop', caption: 'Diseño minimalista en uñas', category_id: null }
  ];

  let images = $state<any[]>([]);
  let categories = $state<any[]>([]);
  let loading = $state(true);

  // Filters and Pagination state
  let selectedCategory = $state<number | null>(null);
  let currentPage = $state(1);
  const itemsPerPage = 6;
  
  // Derived state for filtered images
  let filteredImages = $derived(
    selectedCategory === null 
      ? images 
      : images.filter(img => img.category_id === selectedCategory)
  );

  let totalPages = $derived(Math.max(1, Math.ceil(filteredImages.length / itemsPerPage)));
  let paginatedImages = $derived(filteredImages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));

  // Lightbox state
  let selectedImage = $state<any>(null);

  const fetchData = async () => {
    loading = true;
    
    // Fetch categories
    const { data: catData } = await supabase
      .from('gallery_categories')
      .select('*')
      .order('id', { ascending: true });

    if (catData) categories = catData;

    // Fetch active images
    const { data: imgData, error: imgError } = await supabase
      .from('gallery')
      .select('*, gallery_categories(name)')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!imgError && imgData && imgData.length > 0) {
      // Agrupar y ordenar alfabéticamente por el nombre de la categoría
      imgData.sort((a, b) => {
        const catA = a.gallery_categories?.name || 'Z'; 
        const catB = b.gallery_categories?.name || 'Z';
        return catA.localeCompare(catB);
      });
      images = imgData;
    } else {
      images = defaultImages;
    }
    
    loading = false;
  };

  $effect(() => {
    fetchData();
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

    <!-- Filtros de Categoría (Chips) -->
    {#if !loading && categories.length > 0}
      <div class="filters-container">
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

    {#if loading}
      <div class="loading-state">Cargando creaciones...</div>
    {:else}
      {#if filteredImages.length === 0}
        <div class="empty-filter-state">
          No hay imágenes en esta categoría aún.
        </div>
      {:else}
        <!-- Contenedor con llave (#key) para forzar animación en Svelte cuando cambia la página o categoría -->
        {#key `${selectedCategory}-${currentPage}`}
          <div class="sym-grid fade-in">
            {#each paginatedImages as img (img.id)}
              <button class="grid-item" onclick={() => openLightbox(img)} aria-label="Ver imagen ampliada">
                <img src={img.image_url} alt={img.caption || 'Creación Karen Beauty'} loading="lazy" />
                <div class="overlay">
                  <ZoomIn size={28} color="white" />
                </div>
              </button>
            {/each}
          </div>
        {/key}

        <!-- Paginación Premium -->
        {#if totalPages > 1}
          <div class="pagination-wrapper">
            <button 
              class="page-control" 
              disabled={currentPage === 1} 
              onclick={() => { currentPage--; document.getElementById('creaciones')?.scrollIntoView({ behavior: 'smooth' }); }}
              aria-label="Página anterior"
            >
              &laquo;
            </button>
            
            <div class="page-numbers">
              {#each Array(totalPages) as _, i}
                <button 
                  class="page-dot {currentPage === (i + 1) ? 'active' : ''}"
                  onclick={() => { currentPage = i + 1; document.getElementById('creaciones')?.scrollIntoView({ behavior: 'smooth' }); }}
                  aria-label={`Ir a página ${i + 1}`}
                >
                  {i + 1}
                </button>
              {/each}
            </div>

            <button 
              class="page-control" 
              disabled={currentPage === totalPages} 
              onclick={() => { currentPage++; document.getElementById('creaciones')?.scrollIntoView({ behavior: 'smooth' }); }}
              aria-label="Página siguiente"
            >
              &raquo;
            </button>
          </div>
        {/if}
      {/if}
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
      {#if selectedImage.caption || selectedImage.gallery_categories?.name}
        <div class="caption-container">
          {#if selectedImage.gallery_categories?.name}
            <span class="lightbox-badge">{selectedImage.gallery_categories.name}</span>
          {/if}
          {#if selectedImage.caption}
            <div class="caption">
              {selectedImage.caption}
            </div>
          {/if}
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
    margin-bottom: 32px;
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

  /* --- FILTERS (CHIPS) --- */
  .filters-container {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 40px;
  }

  .chip {
    background-color: white;
    border: 1px solid #eaeaea;
    color: #666;
    padding: 8px 20px;
    border-radius: 50px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }

  .chip:hover {
    border-color: #ccc;
    color: var(--color-grafito);
  }

  .chip.active {
    background-color: var(--color-primary, #b3666d);
    border-color: var(--color-primary, #b3666d);
    color: white;
    box-shadow: 0 4px 12px rgba(179, 102, 109, 0.3);
  }

  .loading-state, .empty-filter-state {
    text-align: center;
    padding: 60px 20px;
    color: #888;
    font-style: italic;
  }

  /* Animación suave al cambiar filtros */
  .fade-in {
    animation: fadeInGrid 0.4s ease-out forwards;
  }

  @keyframes fadeInGrid {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
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
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 8px;
    border: none;
    padding: 0;
    cursor: pointer;
    background: #eaeaea;
    box-shadow: var(--shadow-sm);
  }

  .grid-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(42, 44, 46, 0.4);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .grid-item:hover img {
    transform: scale(1.08);
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
    max-height: 75vh;
    object-fit: contain;
    border-radius: 8px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.5);
  }

  .caption-container {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .lightbox-badge {
    background: var(--color-primary, #b3666d);
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 50px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .caption {
    color: white;
    font-size: 1.1rem;
    font-weight: 300;
    text-align: center;
    max-width: 600px;
  }

  /* --- PAGINATION STYLES --- */
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin-top: 48px;
  }

  .page-control {
    background: transparent;
    border: 1.5px solid var(--color-grafito, #2A2C2E);
    color: var(--color-grafito, #2A2C2E);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .page-control:hover:not(:disabled) {
    background: var(--color-primary, #b3666d);
    border-color: var(--color-primary, #b3666d);
    color: white;
    transform: scale(1.05);
  }

  .page-control:disabled {
    border-color: #ddd;
    color: #bbb;
    cursor: not-allowed;
  }

  .page-numbers {
    display: flex;
    gap: 8px;
  }

  .page-dot {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: #666;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .page-dot:hover:not(.active) {
    background: #eaeaea;
  }

  .page-dot.active {
    background: var(--color-primary, #b3666d);
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(179, 102, 109, 0.4);
    transform: scale(1.1);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes zoomIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
