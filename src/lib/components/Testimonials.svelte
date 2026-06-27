<script lang="ts">
  import { Star, MessageSquarePlus } from '@lucide/svelte';
  import { supabase } from '$lib/supabaseClient';

  // Función asíncrona para obtener testimonios aprobados
  async function fetchTestimonials() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('id', { ascending: false });
      
    if (error) {
      console.error("Error fetching testimonials:", error);
      return [];
    }
    return data;
  }
  
  let testimonialsPromise = fetchTestimonials();
</script>

<section id="testimonios" class="testimonials">
  <div class="content-wrapper">
    <div class="header">
      <h2>Lo que dicen nuestras clientas</h2>
      <p>Tu satisfacción es nuestra mejor carta de presentación</p>
    </div>

    {#await testimonialsPromise}
      <div class="carousel skeleton-carousel">
        {#each Array(3) as _}
          <div class="review-card skeleton-card">
            <div class="skeleton-text short"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short" style="margin-top: 16px;"></div>
          </div>
        {/each}
      </div>
    {:then testimonials}
      {#if testimonials.length === 0}
        <div class="empty-state">
          <p>Pronto compartiremos las experiencias de nuestras clientas.</p>
        </div>
      {:else}
        <div class="carousel">
          {#each testimonials as review}
            <div class="review-card">
              <div class="stars">
                {#each Array(5) as _}
                  <Star size={16} fill="var(--color-primary)" color="var(--color-primary)" />
                {/each}
              </div>
              <p class="text">"{review.text}"</p>
              <p class="name">— {review.client_name}</p>
            </div>
          {/each}
        </div>
      {/if}
    {/await}

    <div class="form-container">
      <a href="/dejar-testimonio" class="btn-toggle-form">
        <MessageSquarePlus size={20} />
        Dejar mi experiencia
      </a>
    </div>
  </div>
</section>

<style>
  .testimonials {
    padding: 80px 24px;
    background-color: var(--color-blanco);
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
    margin-bottom: 8px;
  }

  .header p {
    color: var(--color-grafito);
    opacity: 0.7;
  }

  .carousel {
    display: flex;
    gap: 24px;
    overflow-x: auto;
    padding-bottom: 24px;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
  }

  .carousel::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }

  .review-card {
    flex: 0 0 300px;
    background: var(--color-neutro);
    padding: 24px;
    border-radius: 16px;
    scroll-snap-align: start;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(0,0,0,0.03);
  }

  .stars {
    display: flex;
    gap: 4px;
  }

  .text {
    font-style: italic;
    color: var(--color-grafito);
    line-height: 1.5;
    flex-grow: 1;
  }

  .name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-primary);
  }

  .empty-state {
    text-align: center;
    padding: 20px;
    color: var(--color-grafito);
    opacity: 0.6;
    font-style: italic;
  }

  /* Form Styles */
  .form-container {
    margin-top: 48px;
    display: flex;
    justify-content: center;
  }

  .btn-toggle-form {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: transparent;
    color: var(--color-primary);
    border: 2px solid var(--color-primary);
    padding: 12px 24px;
    border-radius: 100px;
    font-size: 1rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-toggle-form:hover {
    background-color: var(--color-primary);
    color: white;
  }

  /* --- SKELETON STYLES --- */
  .skeleton-card {
    pointer-events: none;
    box-shadow: none;
  }

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
  }

  .skeleton-text {
    height: 16px;
    background-color: var(--color-accent);
    border-radius: 4px;
    margin-bottom: 8px;
    animation: pulse 1.5s infinite ease-in-out;
  }

  .skeleton-text.short { width: 40%; }

  @media (min-width: 768px) {
    .carousel {
      justify-content: center;
      flex-wrap: wrap;
      overflow-x: visible;
    }
  }
</style>
