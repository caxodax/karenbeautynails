<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { ArrowLeft, MessageSquareHeart } from '@lucide/svelte';

  let isSubmitting = $state(false);
  let formName = $state('');
  let formContent = $state('');
  let formSuccess = $state(false);
  let formError = $state('');

  const submitTestimonial = async (e: Event) => {
    e.preventDefault();
    if (!formName || !formContent) return;
    
    isSubmitting = true;
    formError = '';
    
    const { error } = await supabase
      .from('testimonials')
      .insert([
        { 
          client_name: formName, 
          text: formContent, // using 'text' column based on the Supabase error
          status: 'pending'
        }
      ])
      .select(); 
      
    isSubmitting = false;
    
    if (error) {
      formError = "Hubo un error al enviar tu comentario. Intenta de nuevo.";
      console.error(error);
    } else {
      formSuccess = true;
      formName = '';
      formContent = '';
    }
  };
</script>

<div class="page-wrapper">
  <header class="header">
    <a href="/" class="back-link">
      <ArrowLeft size={20} />
      Volver al Inicio
    </a>
    <div class="logo-area">
      <MessageSquareHeart size={32} color="var(--color-primary)" />
      <h1>Cuéntanos tu experiencia</h1>
    </div>
  </header>

  <main class="content">
    {#if formSuccess}
      <div class="success-card">
        <h2>¡Gracias por tu comentario! 🎉</h2>
        <p>Lo hemos recibido con mucho cariño y está pendiente de revisión para aparecer en nuestra página.</p>
        <a href="/" class="btn-return">Volver al inicio</a>
      </div>
    {:else}
      <form class="testimonial-form" onsubmit={submitTestimonial}>
        <p class="subtitle">Nos encanta saber cómo te sentiste en Karen Beauty. Tu opinión nos ayuda a crecer y a otras clientas a elegirnos.</p>
        
        {#if formError}
          <div class="error-message">{formError}</div>
        {/if}

        <div class="input-group">
          <label for="clientName">Tu Nombre</label>
          <input 
            id="clientName" 
            type="text" 
            bind:value={formName} 
            required 
            placeholder="Ej. María Pérez" 
            disabled={isSubmitting}
          />
        </div>
        
        <div class="input-group">
          <label for="content">Tu Experiencia</label>
          <textarea 
            id="content" 
            bind:value={formContent} 
            required 
            placeholder="¿Qué te pareció nuestro servicio? ¿Cómo quedaron tus uñas?" 
            rows="5"
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar Testimonio'}
          </button>
        </div>
      </form>
    {/if}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: var(--font-sans, system-ui, sans-serif);
    background-color: var(--color-neutro, #F3F4F6);
  }

  .page-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 24px;
  }

  .header {
    max-width: 600px;
    width: 100%;
    margin: 0 auto 40px auto;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--color-grafito, #2A2C2E);
    text-decoration: none;
    font-weight: 500;
    margin-bottom: 24px;
    transition: color 0.2s;
  }

  .back-link:hover {
    color: var(--color-primary, #b3666d);
  }

  .logo-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }

  h1 {
    margin: 0;
    color: var(--color-grafito, #2A2C2E);
    font-family: var(--font-heading, sans-serif);
    font-size: 2rem;
  }

  .content {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }

  .testimonial-form, .success-card {
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
    width: 100%;
    max-width: 500px;
  }

  .subtitle {
    color: #666;
    text-align: center;
    margin-bottom: 32px;
    line-height: 1.5;
  }

  .input-group {
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-group label {
    font-weight: 600;
    color: var(--color-grafito, #2A2C2E);
    font-size: 0.95rem;
  }

  .input-group input,
  .input-group textarea {
    padding: 14px 16px;
    border: 1.5px solid #eaeaea;
    border-radius: 12px;
    font-family: inherit;
    font-size: 1rem;
    transition: all 0.2s;
    background-color: #fafafa;
  }

  .input-group input:focus,
  .input-group textarea:focus {
    outline: none;
    border-color: var(--color-primary, #b3666d);
    background-color: white;
    box-shadow: 0 0 0 4px rgba(179, 102, 109, 0.1);
  }

  .btn-submit {
    width: 100%;
    background-color: var(--color-primary, #b3666d);
    color: white;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1.1rem;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
  }

  .btn-submit:hover:not(:disabled) {
    opacity: 0.9;
  }

  .btn-submit:active:not(:disabled) {
    transform: scale(0.98);
  }

  .btn-submit:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .error-message {
    background-color: #fce8e6;
    color: #c5221f;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 24px;
    font-size: 0.95rem;
    text-align: center;
  }

  .success-card {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .success-card h2 {
    color: var(--color-primary, #b3666d);
    margin: 0;
  }

  .success-card p {
    color: #666;
    line-height: 1.5;
    margin-bottom: 16px;
  }

  .btn-return {
    display: inline-block;
    background-color: var(--color-grafito, #2A2C2E);
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 100px;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .btn-return:hover {
    background-color: #000;
  }

  @media (max-width: 600px) {
    .testimonial-form, .success-card {
      padding: 24px;
    }
    
    .page-wrapper {
      padding: 16px;
    }
  }
</style>
