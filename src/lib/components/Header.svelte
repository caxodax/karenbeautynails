<script>
  import { Sparkles, Menu } from '@lucide/svelte';
</script>

<header class="header">
  <div class="header-container">
    <div class="logo">
      <Sparkles color="var(--color-primary)" size={20} strokeWidth={2.5} />
      <span>Karen Beauty</span>
    </div>
    
    <div class="nav-wrapper">
      <nav class="nav-desktop">
        <a href="#servicios">Servicios</a>
        <a href="#testimonios">Testimonios</a>
      </nav>
      
      <a href="#servicios" class="btn-cta-small nav-desktop" style="text-decoration:none;">
        Reservar Cita
      </a>
      
      <button class="menu-btn" aria-label="Abrir menú">
        <Menu size={24} />
      </button>
    </div>
  </div>
</header>

<style>
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: rgba(250, 249, 247, 0.85); /* Neutro translúcido */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    padding: 12px 24px;
    width: 100%;
    transition: all var(--transition-smooth);
  }

  .header-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-heading);
    font-size: 1.4rem;
    font-weight: 500;
    letter-spacing: -0.03em;
    color: var(--color-grafito);
    cursor: pointer;
  }

  .nav-wrapper {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .nav-desktop {
    display: none;
  }

  nav.nav-desktop {
    gap: 28px;
  }

  .nav-desktop a {
    text-decoration: none;
    color: var(--color-grafito);
    font-weight: 400;
    font-size: 0.95rem;
    transition: color var(--transition-smooth);
    opacity: 0.8;
  }

  .nav-desktop a:hover {
    color: var(--color-primary);
    opacity: 1;
  }

  .btn-cta-small {
    background-color: var(--color-primary);
    color: var(--color-blanco);
    border: none;
    border-radius: 100px;
    padding: 10px 20px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-smooth);
  }

  .btn-cta-small:hover {
    background-color: var(--color-primary-light);
    transform: translateY(-1px);
  }

  .menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--color-grafito);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 768px) {
    .nav-desktop {
      display: flex;
    }
    .menu-btn {
      display: none;
    }
  }
</style>
