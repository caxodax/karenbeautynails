<script>
  import { Clock } from '@lucide/svelte';
  import { supabase } from '$lib/supabaseClient';

  // Función asíncrona para obtener servicios
  async function fetchServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .order('id', { ascending: true });
      
    if (error) {
      console.error("Error fetching services:", error);
      return [];
    }
    return data;
  }
  
  let servicesPromise = fetchServices();
</script>

<section id="servicios" class="catalog-section">
  <div class="catalog-header">
    <span class="subtitle">EXPERIENCIAS</span>
    <h2>Nuestros Servicios</h2>
    <div class="divider"></div>
  </div>

  <div class="grid-container">
    {#await servicesPromise}
      <!-- SKELETON SCREENS (Cargando) -->
      <div class="grid">
        {#each Array(4) as _}
          <article class="card skeleton-card">
            <div class="skeleton-image"></div>
            <div class="card-content">
              <div class="skeleton-text title"></div>
              <div class="skeleton-text desc"></div>
              <div class="skeleton-text desc short"></div>
              <div class="skeleton-meta"></div>
              <div class="skeleton-btn"></div>
            </div>
          </article>
        {/each}
      </div>
    {:then services}
      {#if services.length === 0}
        <div class="empty-state">
          <p>Pronto añadiremos nuestros servicios premium.</p>
        </div>
      {:else}
        <div class="grid">
          {#each services as service}
            <article class="card">
              <div class="card-image-wrapper">
                <img src={service.image_url || '/hero_bg.png'} alt={service.name} loading="lazy" />
              </div>
              <div class="card-content">
                <h3>{service.name}</h3>
                <p class="description">{service.description}</p>
                <div class="meta">
                  <span class="price">
                    {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(service.price)}
                  </span>
                  <span class="duration">
                    <Clock size={14} />
                    {service.duration_minutes} min
                  </span>
                </div>
                <a href="/reservar/{service.id}" class="btn-book" style="display:inline-block; text-align:center; text-decoration:none; box-sizing:border-box;">Reservar</a>
              </div>
            </article>
          {/each}
        </div>
      {/if}
    {/await}
  </div>
</section>

<style>
  .catalog-section {
    padding: 100px 24px;
    background-color: var(--color-neutro);
    position: relative;
    z-index: 10;
  }

  .catalog-header {
    text-align: center;
    margin-bottom: 64px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .subtitle {
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    color: var(--color-accent-dark);
    font-weight: 600;
    margin-bottom: 12px;
  }

  .catalog-header h2 {
    color: var(--color-grafito);
    margin-bottom: 16px;
  }

  .divider {
    width: 40px;
    height: 3px;
    background-color: var(--color-primary);
    border-radius: 2px;
  }

  .grid-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 40px 32px;
  }

  .card {
    background: var(--color-blanco);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(0,0,0,0.03);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(0,0,0,0.02);
  }

  .card:hover:not(.skeleton-card) {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(179, 102, 109, 0.12); /* Dusty rose tinted shadow */
  }

  .card-image-wrapper {
    aspect-ratio: 4/3;
    width: 100%;
    overflow: hidden;
    background-color: var(--color-accent);
  }

  .card-image-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .card:hover .card-image-wrapper img {
    transform: scale(1.05);
  }

  .card-content {
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 12px;
  }

  .card-content h3 {
    font-size: 1.25rem;
    margin: 0;
    font-family: var(--font-heading);
    color: var(--color-grafito);
  }

  .description {
    font-size: 0.95rem;
    color: var(--color-grafito);
    opacity: 0.7;
    line-height: 1.5;
    flex-grow: 1;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 20px;
    border-top: 1px solid rgba(0,0,0,0.05);
  }

  .price {
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-primary);
    font-family: var(--font-heading);
  }

  .duration {
    font-size: 0.85rem;
    color: var(--color-accent-dark);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-book {
    margin-top: 20px;
    background: transparent;
    color: var(--color-primary);
    border: 1.5px solid var(--color-primary);
    padding: 12px;
    border-radius: 100px;
    font-weight: 500;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all var(--transition-smooth);
    width: 100%;
  }

  .btn-book:hover {
    background: var(--color-primary);
    color: var(--color-blanco);
    transform: translateY(-2px);
  }
  
  .btn-book:active {
    transform: scale(0.97) translateY(0);
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--color-grafito);
    opacity: 0.6;
    font-style: italic;
  }

  /* --- SKELETON STYLES --- */
  .skeleton-card {
    pointer-events: none;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }

  .skeleton-image {
    height: 220px;
    width: 100%;
    background-color: var(--color-accent);
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-text {
    height: 16px;
    background-color: var(--color-accent);
    border-radius: 4px;
    margin-bottom: 8px;
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-text.title { height: 24px; width: 70%; margin-bottom: 16px; }
  .skeleton-text.desc { width: 100%; }
  .skeleton-text.short { width: 60%; margin-bottom: 24px; }
  
  .skeleton-meta {
    height: 30px;
    width: 100%;
    background-color: var(--color-accent);
    border-radius: 4px;
    margin-top: auto;
    margin-bottom: 16px;
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-btn {
    height: 44px;
    width: 100%;
    background-color: var(--color-accent);
    border-radius: 100px;
    animation: pulse 1.5s infinite ease-in-out;
  }
</style>
