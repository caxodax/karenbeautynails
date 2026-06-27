<script lang="ts">
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft, Calendar, Clock, User, Phone, CheckCircle, MapPin } from '@lucide/svelte';

  const serviceId = $page.params.id;
  
  let service = $state<any>(null);
  let loading = $state(true);
  let step = $state(1); // 1: Resumen, 2: Calendario, 3: Datos, 4: Éxito
  
  // Datos de la reserva
  let selectedDate = $state<Date | null>(null);
  let selectedTime = $state<string | null>(null);
  let clientName = $state('');
  let clientPhone = $state('');
  let isSubmitting = $state(false);

  // Generar fechas (próximos 14 días)
  const today = new Date();
  const availableDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1); // Empezar desde mañana
    return d;
  });

  // Horarios base
  const baseAvailableTimes = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
  let dynamicAvailableTimes = $state<string[]>([]);
  let isLoadingTimes = $state(false);

  onMount(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();
      
    if (data) {
      service = data;
    }
    loading = false;
  });

  const nextStep = () => step++;
  const prevStep = () => step--;

  const selectDay = async (day: Date) => {
    selectedDate = day;
    selectedTime = null; // Reset time when day changes
    isLoadingTimes = true;
    dynamicAvailableTimes = [];
    
    try {
      const dateStr = day.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00.000Z`;
      const endOfDay = `${dateStr}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .neq('status', 'cancelled');

      if (error) throw error;

      // Extraer las horas ocupadas (ej. "10:30")
      const bookedTimes = data?.map(apt => {
        const d = new Date(apt.appointment_date);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }) || [];

      // Filtrar los horarios base excluyendo los ocupados
      dynamicAvailableTimes = baseAvailableTimes.filter(time => !bookedTimes.includes(time));
    } catch (err) {
      console.error('Error fetching availability:', err);
      // Fallback
      dynamicAvailableTimes = [...baseAvailableTimes];
    } finally {
      isLoadingTimes = false;
    }
  };

  const selectTime = (time: string) => {
    selectedTime = time;
    nextStep();
  };

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('es', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  };

  const submitBooking = async () => {
    if (!clientName || !clientPhone || !selectedDate || !service) return;
    
    isSubmitting = true;
    
    // Formatear fecha y hora para la BD
    const dateStr = selectedDate.toISOString().split('T')[0];
    const appointmentDate = new Date(`${dateStr}T${selectedTime}:00`);

    const { error } = await supabase
      .from('appointments')
      .insert([
        { 
          service_id: service.id,
          client_name: clientName,
          client_whatsapp: clientPhone,
          appointment_date: appointmentDate.toISOString(),
          status: 'scheduled'
        }
      ])
      .select();

    isSubmitting = false;
    
    if (!error) {
      step = 4; // Éxito
    } else {
      alert("Hubo un error al agendar. Por favor, intenta de nuevo.");
      console.error(error);
    }
  };
</script>

<div class="booking-layout">
  <header class="booking-header">
    {#if step > 1 && step < 4}
      <button class="back-btn" onclick={prevStep}>
        <ArrowLeft size={24} />
      </button>
    {:else}
      <a href="/#servicios" class="back-btn">
        <ArrowLeft size={24} />
      </a>
    {/if}
    <div class="header-title">
      {#if step === 1} Confirmar Servicio
      {:else if step === 2} Elegir Fecha y Hora
      {:else if step === 3} Tus Datos
      {:else} ¡Cita Confirmada!
      {/if}
    </div>
    <div style="width: 24px"></div> <!-- Balance header -->
  </header>

  <main class="booking-content">
    {#if loading}
      <div class="loading-state">Cargando detalles...</div>
    {:else if !service}
      <div class="error-state">Servicio no encontrado.</div>
    {:else}
      
      <!-- WIZARD PROGRESS BAR -->
      {#if step < 4}
        <div class="progress-bar">
          <div class="progress-fill" style="width: {(step / 3) * 100}%"></div>
        </div>
      {/if}

      <!-- PASO 1: RESUMEN -->
      {#if step === 1}
        <div class="step-container animation-fade">
          <div class="service-card">
            <div class="service-image" style="background-image: url({service.image_url})"></div>
            <div class="service-details">
              <h2>{service.name}</h2>
              <p class="desc">{service.description}</p>
              <div class="meta-row">
                <span class="price">${service.price}</span>
                <span class="duration"><Clock size={16}/> {service.duration_minutes} min</span>
              </div>
            </div>
          </div>
          <button class="btn-cta full-width" onclick={nextStep}>
            Continuar
          </button>
        </div>
      {/if}

      <!-- PASO 2: CALENDARIO -->
      {#if step === 2}
        <div class="step-container animation-slide">
          
          <div class="summary-chip">
            <span class="chip-label">Servicio:</span> {service.name} (${service.price})
          </div>

          <h3 class="section-title">Elige el día</h3>
          <div class="days-carousel">
            {#each availableDays as day}
              <button 
                class="day-btn {selectedDate === day ? 'active' : ''}"
                onclick={() => selectDay(day)}
              >
                <span class="weekday">{new Intl.DateTimeFormat('es', { weekday: 'short' }).format(day)}</span>
                <span class="day-number">{day.getDate()}</span>
                <span class="month">{new Intl.DateTimeFormat('es', { month: 'short' }).format(day)}</span>
              </button>
            {/each}
          </div>

          {#if selectedDate}
            <h3 class="section-title time-title">Horarios disponibles</h3>
            {#if isLoadingTimes}
              <div class="empty-time-state">
                Consultando disponibilidad...
              </div>
            {:else if dynamicAvailableTimes.length > 0}
              <div class="times-grid">
                {#each dynamicAvailableTimes as time}
                  <button 
                    class="time-btn"
                    onclick={() => selectTime(time)}
                  >
                    {time}
                  </button>
                {/each}
              </div>
            {:else}
              <div class="empty-time-state">
                No hay horarios disponibles para este día. Por favor, elige otro.
              </div>
            {/if}
          {:else}
            <div class="empty-time-state">
              Selecciona un día para ver los horarios
            </div>
          {/if}
        </div>
      {/if}

      <!-- PASO 3: FORMULARIO -->
      {#if step === 3}
        <div class="step-container animation-slide">
          <div class="summary-box">
            <div class="summary-item">
              <strong>Servicio:</strong> {service.name}
            </div>
            <div class="summary-item">
              <strong>Cuándo:</strong> {formatShortDate(selectedDate as Date)} a las {selectedTime}
            </div>
          </div>

          <form class="booking-form" onsubmit={(e) => { e.preventDefault(); submitBooking(); }}>
            <div class="input-group">
              <label for="name">Nombre Completo</label>
              <div class="input-wrapper">
                <User size={18} class="input-icon" />
                <input type="text" id="name" bind:value={clientName} placeholder="Ej. María Pérez" required />
              </div>
            </div>

            <div class="input-group">
              <label for="phone">Número de WhatsApp</label>
              <div class="input-wrapper">
                <Phone size={18} class="input-icon" />
                <input type="tel" id="phone" bind:value={clientPhone} placeholder="Ej. +34 600 000 000" required />
              </div>
            </div>

            <button type="submit" class="btn-cta full-width submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Confirmando...' : 'Confirmar Cita'}
            </button>
            <p class="secure-note">Tus datos están seguros. No necesitas crear cuenta.</p>
          </form>
        </div>
      {/if}

      <!-- PASO 4: ÉXITO -->
      {#if step === 4}
        <div class="step-container success-container animation-scale">
          <div class="calendar-card">
            <div class="calendar-header">
              {new Intl.DateTimeFormat('es', { month: 'long' }).format(selectedDate).toUpperCase()}
            </div>
            <div class="calendar-body">
              <span class="day-number">{selectedDate?.getDate()}</span>
              <span class="weekday">{new Intl.DateTimeFormat('es', { weekday: 'long' }).format(selectedDate)}</span>
              <div class="divider"></div>
              <span class="time-block">
                <Clock size={20} /> {selectedTime}
              </span>
            </div>
          </div>
          
          <h2>¡Cita Confirmada!</h2>
          <p class="success-msg">Gracias <strong>{clientName}</strong>, tu cita para <strong>{service?.name}</strong> ha sido reservada con éxito.</p>
          
          <div class="location-box">
            <div class="location-icon">
              <MapPin size={24} color="var(--color-primary)" />
            </div>
            <div class="location-details">
              <strong>Karen Beauty Studio</strong>
              <span>Av. Principal 123, Centro</span>
            </div>
            <a href="https://maps.google.com" target="_blank" class="btn-map" rel="noopener noreferrer">Mapa</a>
          </div>

          <a href="/" class="btn-cta full-width">Volver al Inicio</a>
        </div>
      {/if}

    {/if}
  </main>
</div>

<style>
  /* Layout Base */
  :global(body) {
    background-color: var(--color-blanco);
  }

  .booking-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-neutro);
    max-width: 600px;
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0,0,0,0.05);
  }

  .booking-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background-color: var(--color-blanco);
    position: sticky;
    top: 0;
    z-index: 50;
    border-bottom: 1px solid rgba(0,0,0,0.05);
  }

  .back-btn {
    background: none;
    border: none;
    color: var(--color-grafito);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    margin-left: -4px;
  }

  .header-title {
    font-family: var(--font-heading);
    font-weight: 500;
    font-size: 1.1rem;
    color: var(--color-grafito);
  }

  .booking-content {
    flex-grow: 1;
    padding: 0;
    display: flex;
    flex-direction: column;
  }

  .progress-bar {
    height: 4px;
    background-color: rgba(0,0,0,0.05);
    width: 100%;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--color-primary);
    transition: width 0.4s ease;
  }

  .step-container {
    padding: 32px 24px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }

  /* Animaciones */
  .animation-fade { animation: fade 0.3s ease-out; }
  .animation-slide { animation: slideUp 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
  .animation-scale { animation: popIn 0.5s cubic-bezier(0.2, 0.8, 0.2, 1); }

  @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

  /* Paso 1: Service Card */
  .service-card {
    background: var(--color-blanco);
    border-radius: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    margin-bottom: 32px;
  }

  .service-image {
    height: 200px;
    background-size: cover;
    background-position: center;
  }

  .service-details {
    padding: 24px;
  }

  .service-details h2 {
    font-size: 1.4rem;
    margin-bottom: 12px;
  }

  .service-details .desc {
    color: var(--color-grafito);
    opacity: 0.8;
    line-height: 1.5;
    margin-bottom: 24px;
  }

  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(0,0,0,0.05);
  }

  .meta-row .price {
    font-size: 1.5rem;
    font-weight: 500;
    color: var(--color-primary);
    font-family: var(--font-heading);
  }

  .meta-row .duration {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-accent-dark);
    font-size: 0.9rem;
  }

  .full-width {
    width: 100%;
    margin-top: auto;
  }

  /* Paso 2: Calendario */
  .summary-chip {
    background-color: var(--color-blanco);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 0.9rem;
    color: var(--color-grafito);
    margin-bottom: 32px;
    box-shadow: var(--shadow-sm);
    border: 1px solid rgba(0,0,0,0.03);
  }

  .chip-label { opacity: 0.6; font-weight: 500; }
  .section-title { font-size: 1.1rem; margin-bottom: 16px; }

  .days-carousel {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 16px;
    margin-left: -24px;
    padding-left: 24px;
    margin-right: -24px;
    padding-right: 24px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .days-carousel::-webkit-scrollbar { display: none; }

  .day-btn {
    flex: 0 0 70px;
    height: 90px;
    background-color: var(--color-blanco);
    border: 1px solid rgba(0,0,0,0.05);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .day-btn.active {
    background-color: var(--color-primary);
    color: var(--color-blanco);
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(179, 102, 109, 0.2);
  }

  .day-btn .weekday { text-transform: capitalize; font-size: 0.8rem; opacity: 0.7; }
  .day-btn .day-number { font-size: 1.4rem; font-weight: 600; font-family: var(--font-heading); }
  .day-btn .month { font-size: 0.75rem; text-transform: capitalize; opacity: 0.7; }

  .day-btn.active .weekday, .day-btn.active .month { opacity: 0.9; }

  .time-title { margin-top: 24px; }
  
  .times-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .time-btn {
    background-color: var(--color-blanco);
    border: 1px solid rgba(0,0,0,0.05);
    padding: 14px 0;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 500;
    color: var(--color-grafito);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .time-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

  .empty-time-state {
    text-align: center;
    padding: 40px 0;
    color: var(--color-grafito);
    opacity: 0.5;
    font-style: italic;
    background-color: rgba(0,0,0,0.02);
    border-radius: 16px;
    margin-top: 16px;
  }

  /* Paso 3: Formulario */
  .summary-box {
    background-color: var(--color-blanco);
    padding: 20px;
    border-radius: 16px;
    margin-bottom: 32px;
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 0.95rem;
  }

  .summary-item strong { color: var(--color-primary); margin-right: 8px; }

  .booking-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex-grow: 1;
  }

  .input-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    font-size: 0.9rem;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  :global(.input-icon) {
    position: absolute;
    left: 16px;
    color: var(--color-grafito);
    opacity: 0.4;
  }

  .input-group input {
    width: 100%;
    padding: 16px 16px 16px 48px;
    border: 1.5px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    font-size: 1rem;
    font-family: var(--font-sans);
    transition: all 0.2s ease;
    background-color: var(--color-blanco);
  }

  .input-group input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(179, 102, 109, 0.1);
  }

  .submit-btn { margin-top: auto; }
  
  .secure-note {
    text-align: center;
    font-size: 0.8rem;
    opacity: 0.6;
    margin-top: 16px;
  }

  /* Paso 4: Éxito */
  .success-container {
    text-align: center;
    align-items: center;
    justify-content: center;
    padding-bottom: 60px;
  }

  .success-icon {
    background-color: rgba(179, 102, 109, 0.1);
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
  }

  /* --- STEP 4: SUCCESS CALENDAR --- */
  .success-container {
    text-align: center;
    padding: 20px 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .success-container h2 {
    color: var(--color-primary);
    margin-bottom: 8px;
    margin-top: 16px;
  }
  
  .success-msg {
    color: #666;
    margin-bottom: 32px;
    line-height: 1.5;
    font-size: 1.05rem;
  }

  .calendar-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 12px 32px rgba(0,0,0,0.08);
    width: 100%;
    max-width: 280px;
    margin: 0 auto;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .calendar-header {
    background-color: var(--color-primary);
    color: white;
    padding: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    font-size: 0.9rem;
  }

  .calendar-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--color-blanco);
  }

  .day-number {
    font-size: 4rem;
    font-weight: 700;
    line-height: 1;
    color: var(--color-grafito);
    margin-bottom: 4px;
    font-family: var(--font-heading);
  }

  .weekday {
    font-size: 1.1rem;
    color: #888;
    text-transform: capitalize;
    font-weight: 500;
  }

  .divider {
    height: 1px;
    width: 60%;
    background-color: #eee;
    margin: 16px 0;
  }

  .time-block {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary);
  }

  .location-box {
    display: flex;
    align-items: center;
    background: white;
    padding: 16px;
    border-radius: 16px;
    width: 100%;
    border: 1px solid #eaeaea;
    text-align: left;
    margin-bottom: 24px;
    gap: 16px;
  }

  .location-icon {
    background: rgba(179, 102, 109, 0.1);
    padding: 12px;
    border-radius: 12px;
    display: flex;
  }

  .location-details {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .location-details strong {
    color: var(--color-grafito);
    font-size: 1rem;
  }

  .location-details span {
    color: #666;
    font-size: 0.9rem;
  }

  .btn-map {
    background-color: #f3f4f6;
    color: var(--color-grafito);
    text-decoration: none;
    padding: 8px 16px;
    border-radius: 100px;
    font-size: 0.85rem;
    font-weight: 600;
    transition: background-color 0.2s;
  }

  .btn-map:hover {
    background-color: #e5e7eb;
  }

  .action-box {
    background-color: var(--color-blanco);
    padding: 20px;
    border-radius: 16px;
    box-shadow: var(--shadow-sm);
    font-size: 0.9rem;
    opacity: 0.8;
    margin-bottom: 40px;
    width: 100%;
  }

  .btn-outline {
    background: transparent;
    color: var(--color-grafito);
    border: 1.5px solid rgba(0,0,0,0.1);
    padding: 14px 32px;
    border-radius: 100px;
    font-weight: 500;
    text-align: center;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-outline:hover {
    background-color: rgba(0,0,0,0.03);
  }
</style>
