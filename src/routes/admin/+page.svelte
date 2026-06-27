<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { Calendar, Clock, MessageCircle, User } from '@lucide/svelte';

  let appointments = $state<any[]>([]);
  let loading = $state(true);
  let frequentClients = $state<Set<string>>(new Set());

  onMount(async () => {
    // Start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch upcoming appointments
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        client_name,
        client_whatsapp,
        appointment_date,
        status,
        services (
          name,
          duration_minutes
        )
      `)
      .gte('appointment_date', today.toISOString())
      .order('appointment_date', { ascending: true });

    if (!error && data) {
      appointments = data;

      // Inteligencia de Clientes: Buscar cuáles de estos teléfonos tienen citas anteriores
      const phones = [...new Set(data.map(apt => apt.client_whatsapp))];
      if (phones.length > 0) {
        const { data: pastData } = await supabase
          .from('appointments')
          .select('client_whatsapp')
          .in('client_whatsapp', phones)
          .lt('appointment_date', new Date().toISOString());
        
        if (pastData) {
          frequentClients = new Set(pastData.map(p => p.client_whatsapp));
        }
      }

    } else {
      console.error(error);
    }
    loading = false;
  });

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'short' }).format(d);
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const sendWhatsApp = (phone: string, name: string, date: string, time: string, serviceName: string) => {
    // Limpiar número (asumimos formato internacional o local dependiendo del país)
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const message = `Hola ${name}, te escribo de Karen Beauty para recordarte tu cita de ${serviceName} el ${date} a las ${time}. ¡Te esperamos!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Agrupar citas por fecha
  const groupedAppointments = $derived(
    appointments.reduce((groups: Record<string, any[]>, apt: any) => {
      const date = formatDate(apt.appointment_date);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(apt);
      return groups;
    }, {})
  );
</script>

<div class="dashboard">
  <header>
    <h1>Agenda de Citas</h1>
    <p>Revisa y gestiona tus próximas reservas.</p>
  </header>

  {#if loading}
    <div class="loading">Cargando agenda...</div>
  {:else if appointments.length === 0}
    <div class="empty-state">
      <Calendar size={48} />
      <h3>No hay citas próximas</h3>
      <p>Tu agenda está libre por ahora.</p>
    </div>
  {:else}
    <div class="timeline">
      {#each Object.entries(groupedAppointments) as [date, apts]}
        <div class="day-group">
          <h3 class="day-header">{date}</h3>
          
          <div class="appointments-list">
            {#each apts as apt}
              <div class="appointment-card">
                <div class="time-column">
                  <span class="time">{formatTime(apt.appointment_date)}</span>
                  <span class="duration">{apt.services?.duration_minutes || 60} min</span>
                </div>
                
                <div class="details-column">
                  <div class="client-info">
                    <div class="name-row">
                      <strong>{apt.client_name}</strong>
                      {#if frequentClients.has(apt.client_whatsapp)}
                        <span class="freq-badge" title="Clienta Frecuente">🌟 Frecuente</span>
                      {/if}
                    </div>
                    <span class="service-name">{apt.services?.name}</span>
                  </div>
                  
                  <button 
                    class="wa-btn" 
                    title="Enviar recordatorio por WhatsApp"
                    onclick={() => sendWhatsApp(apt.client_whatsapp, apt.client_name, date, formatTime(apt.appointment_date), apt.services?.name)}
                  >
                    <MessageCircle size={18} />
                    Contactar
                  </button>
                </div>
              </div>
            {/each}
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

  h1 {
    margin: 0 0 8px 0;
    color: var(--color-grafito, #2A2C2E);
  }

  p {
    margin: 0;
    color: #666;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background: white;
    border-radius: 16px;
    color: #888;
  }

  .empty-state h3 {
    margin: 16px 0 8px 0;
    color: var(--color-grafito, #2A2C2E);
  }

  .day-group {
    margin-bottom: 40px;
  }

  .day-header {
    text-transform: capitalize;
    color: var(--color-primary, #b3666d);
    border-bottom: 2px solid rgba(179, 102, 109, 0.2);
    padding-bottom: 8px;
    margin-bottom: 16px;
  }

  .appointments-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .appointment-card {
    display: flex;
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    gap: 20px;
    align-items: center;
  }

  .time-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 80px;
    border-right: 1px solid #eee;
    padding-right: 20px;
  }

  .time {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-grafito, #2A2C2E);
  }

  .duration {
    font-size: 0.8rem;
    color: #888;
    margin-top: 4px;
  }

  .details-column {
    display: flex;
    flex-grow: 1;
    justify-content: space-between;
    align-items: center;
  }

  .client-info {
    display: flex;
    flex-direction: column;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .freq-badge {
    background-color: #FFF3CD;
    color: #856404;
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 8px;
    font-weight: 600;
  }

  .client-info strong {
    font-size: 1.1rem;
    color: var(--color-grafito, #2A2C2E);
  }

  .service-name {
    font-size: 0.9rem;
    color: #666;
    margin-top: 4px;
  }

  .wa-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #25D366; /* Verde WhatsApp */
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 100px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .wa-btn:hover {
    transform: scale(1.05);
  }
  
  @media (max-width: 600px) {
    .details-column {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .appointment-card {
      align-items: flex-start;
    }
  }
</style>
