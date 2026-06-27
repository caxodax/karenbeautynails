<script>
  import { ArrowRight } from '@lucide/svelte';
</script>

<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-overlay"></div>
  
  <div class="hero-content">
    <span class="badge">ESTUDIO DE MANICURA PREMIUM</span>
    <h1>El arte de cuidar <br/>tu esencia</h1>
    <p>Diseño de uñas y estética profesional en un ambiente diseñado para tu relajación absoluta.</p>
    
    <div class="cta-group">
      <a href="#servicios" class="btn-cta" style="display:inline-flex; text-decoration:none;">
        Agendar Cita
        <ArrowRight size={18} style="margin-left: 8px" />
      </a>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    height: 80vh;
    min-height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: var(--color-blanco);
    overflow: hidden;
  }

  .hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('/hero_bg.png');
    background-size: cover;
    background-position: center;
    transform: scale(1.05); /* Slight zoom for subtle animation effect */
    animation: slowZoom 20s ease-out forwards;
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to bottom, 
      rgba(26, 26, 26, 0.3) 0%,
      rgba(26, 26, 26, 0.6) 100%
    );
    z-index: 1;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 800px;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    animation: fadeInUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }

  .badge {
    font-size: 0.75rem;
    letter-spacing: 0.2em;
    font-weight: 600;
    text-transform: uppercase;
    background: rgba(179, 102, 109, 0.9); /* Dusty Rose solid */
    color: white;
    padding: 6px 16px;
    border-radius: 100px;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(179, 102, 109, 0.4);
  }

  .hero-content h1 {
    font-family: var(--font-heading);
    margin: 0;
    text-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .hero-content p {
    font-size: 1.25rem;
    font-weight: 300;
    line-height: 1.6;
    margin: 0;
    max-width: 550px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    opacity: 0.95;
    color: var(--color-neutro);
  }

  .cta-group {
    margin-top: 16px;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slowZoom {
    from { transform: scale(1.05); }
    to { transform: scale(1); }
  }
</style>
