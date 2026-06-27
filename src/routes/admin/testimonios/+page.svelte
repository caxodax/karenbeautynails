<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { CheckCircle, XCircle, CheckSquare } from '@lucide/svelte';

  let pendingTestimonials = $state<any[]>([]);
  let approvedTestimonials = $state<any[]>([]);
  let loading = $state(true);

  // Paginación
  const ITEMS_PER_PAGE = 6;
  let pendingPage = $state(1);
  let approvedPage = $state(1);

  let paginatedPending = $derived(
    pendingTestimonials.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE)
  );
  let totalPendingPages = $derived(Math.ceil(pendingTestimonials.length / ITEMS_PER_PAGE) || 1);

  let paginatedApproved = $derived(
    approvedTestimonials.slice((approvedPage - 1) * ITEMS_PER_PAGE, approvedPage * ITEMS_PER_PAGE)
  );
  let totalApprovedPages = $derived(Math.ceil(approvedTestimonials.length / ITEMS_PER_PAGE) || 1);


  const fetchTestimonials = async () => {
    loading = true;
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      pendingTestimonials = data.filter(t => t.status === 'pending');
      approvedTestimonials = data.filter(t => t.status === 'approved');
      
      // Ajustar páginas si nos quedamos sin items en la página actual
      if (pendingPage > Math.ceil(pendingTestimonials.length / ITEMS_PER_PAGE)) pendingPage = 1;
      if (approvedPage > Math.ceil(approvedTestimonials.length / ITEMS_PER_PAGE)) approvedPage = 1;
    }
    loading = false;
  };

  onMount(() => {
    fetchTestimonials();
  });

  const updateStatus = async (id: number, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('testimonials')
      .update({ status })
      .eq('id', id);

    if (!error) {
      fetchTestimonials();
    } else {
      console.error(error);
      alert('Error al actualizar testimonio');
    }
  };

  const approveAll = async () => {
    const count = pendingTestimonials.length;
    if (count === 0) return;

    if (confirm(`¿Estás segura de aceptar los ${count} testimonios pendientes?`)) {
      const ids = pendingTestimonials.map(t => t.id);
      
      const { error } = await supabase
        .from('testimonials')
        .update({ status: 'approved' })
        .in('id', ids);

      if (!error) {
        fetchTestimonials();
      } else {
        console.error(error);
        alert('Error al aprobar todos los testimonios');
      }
    }
  };
</script>

<div class="dashboard">
  <header>
    <h1>Testimonios</h1>
    <p>Modera los comentarios de tus clientas antes de publicarlos en la web.</p>
  </header>

  {#if loading}
    <div class="loading">Cargando testimonios...</div>
  {:else}
    <div class="sections">
      
      <!-- SECCIÓN PENDIENTES -->
      <section class="pending-section">
        <div class="section-header">
          <h2 class="section-title">Pendientes de Revisión ({pendingTestimonials.length})</h2>
          {#if pendingTestimonials.length > 0}
            <button class="btn-approve-all" onclick={approveAll}>
              <CheckSquare size={18} /> Aprobar Todos
            </button>
          {/if}
        </div>

        {#if pendingTestimonials.length === 0}
          <p class="empty">No hay testimonios pendientes.</p>
        {:else}
          <div class="cards">
            {#each paginatedPending as test (test.id)}
              <div class="test-card">
                <div class="test-header">
                  <strong>{test.client_name}</strong>
                </div>
                <p class="test-body">"{test.text}"</p>
                <div class="actions">
                  <button class="btn-approve" onclick={() => updateStatus(test.id, 'approved')}>
                    <CheckCircle size={18} /> Aprobar
                  </button>
                  <button class="btn-reject" onclick={() => updateStatus(test.id, 'rejected')}>
                    <XCircle size={18} /> Rechazar
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <!-- Paginación Pendientes -->
          {#if totalPendingPages > 1}
            <div class="pagination">
              <button 
                disabled={pendingPage === 1} 
                onclick={() => pendingPage--}
              >Anterior</button>
              <span>Página {pendingPage} de {totalPendingPages}</span>
              <button 
                disabled={pendingPage === totalPendingPages} 
                onclick={() => pendingPage++}
              >Siguiente</button>
            </div>
          {/if}
        {/if}
      </section>

      <!-- SECCIÓN APROBADOS -->
      <section class="approved-section">
        <h2 class="section-title">Publicados ({approvedTestimonials.length})</h2>
        
        {#if approvedTestimonials.length === 0}
          <p class="empty">Aún no hay testimonios aprobados.</p>
        {:else}
          <div class="cards">
            {#each paginatedApproved as test (test.id)}
              <div class="test-card approved">
                <div class="test-header">
                  <strong>{test.client_name}</strong>
                </div>
                <p class="test-body">"{test.text}"</p>
                <div class="actions">
                  <button class="btn-reject outline" onclick={() => updateStatus(test.id, 'rejected')}>
                    Ocultar de la web
                  </button>
                </div>
              </div>
            {/each}
          </div>

          <!-- Paginación Aprobados -->
          {#if totalApprovedPages > 1}
            <div class="pagination">
              <button 
                disabled={approvedPage === 1} 
                onclick={() => approvedPage--}
              >Anterior</button>
              <span>Página {approvedPage} de {totalApprovedPages}</span>
              <button 
                disabled={approvedPage === totalApprovedPages} 
                onclick={() => approvedPage++}
              >Siguiente</button>
            </div>
          {/if}
        {/if}
      </section>

    </div>
  {/if}
</div>

<style>
  .dashboard header {
    margin-bottom: 32px;
  }

  h1 {
    margin: 0 0 8px 0;
    color: var(--color-grafito, #2A2C2E);
  }

  p {
    margin: 0;
    color: #666;
  }

  .sections {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid rgba(179, 102, 109, 0.2);
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  .section-title {
    font-size: 1.2rem;
    color: var(--color-primary, #b3666d);
    margin: 0;
  }

  .btn-approve-all {
    display: flex;
    align-items: center;
    gap: 6px;
    background-color: #2A2C2E;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  
  .btn-approve-all:hover {
    opacity: 0.8;
  }

  .empty {
    color: #888;
    font-style: italic;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .test-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    display: flex;
    flex-direction: column;
  }

  .test-card.approved {
    border-left: 4px solid #25D366;
  }

  .test-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .test-body {
    flex-grow: 1;
    font-style: italic;
    color: var(--color-grafito, #2A2C2E);
    margin-bottom: 20px;
    line-height: 1.5;
  }

  .actions {
    display: flex;
    gap: 12px;
  }

  .actions button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    flex: 1;
    transition: background-color 0.2s;
  }

  .btn-approve {
    background-color: #e6f4ea;
    color: #137333;
  }
  .btn-approve:hover { background-color: #ceead6; }

  .btn-reject {
    background-color: #fce8e6;
    color: #c5221f;
  }
  .btn-reject:hover { background-color: #fad2cf; }

  .btn-reject.outline {
    background-color: transparent;
    border: 1px solid #fad2cf;
  }
  .btn-reject.outline:hover { background-color: #fce8e6; }

  /* Paginación */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
  }

  .pagination span {
    font-size: 0.9rem;
    color: #666;
  }

  .pagination button {
    background-color: white;
    border: 1px solid #ddd;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--color-grafito);
  }

  .pagination button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination button:not(:disabled):hover {
    background-color: #f5f5f5;
  }
</style>
