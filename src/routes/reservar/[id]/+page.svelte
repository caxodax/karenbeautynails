<script lang="ts">
  import { page } from '$app/stores';
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  import { ArrowLeft, Clock, User, Phone, MapPin, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from '@lucide/svelte';

  const serviceId = $page.params.id;
  
  let service = $state<any>(null);
  let loading = $state(true);
  
  // Datos de la reserva
  let selectedDate = $state<Date | null>(null);
  let selectedTime = $state<string | null>(null);
  let clientName = $state('');
  let clientPhone = $state('');
  let isSubmitting = $state(false);
  let showSuccess = $state(false);

  // Calendar State
  let currentMonth = $state(new Date()); 
  currentMonth.setDate(1); 

  const today = new Date();
  today.setHours(0,0,0,0);
  
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 10);

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
      
    if (data) service = data;
    loading = false;
  });

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    currentMonth = next;
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    currentMonth = prev;
  };

  const selectDay = async (day: Date | null) => {
    if (!day) return;
    if (day < today || day > maxDate) return;
    
    selectedDate = day;
    selectedTime = null;
    isLoadingTimes = true;
    dynamicAvailableTimes = [];
    
    try {
      // Usar fecha local para evitar problemas de zona horaria al buscar en DB
      const localDate = new Date(day.getTime() - (day.getTimezoneOffset() * 60000));
      const dateStr = localDate.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00.000Z`;
      const endOfDay = `${dateStr}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .neq('status', 'cancelled');

      if (error) throw error;

      const bookedTimes = data?.map(apt => {
        const d = new Date(apt.appointment_date);
        return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }) || [];

      dynamicAvailableTimes = baseAvailableTimes.filter(time => !bookedTimes.includes(time));
    } catch (err) {
      console.error('Error fetching availability:', err);
      dynamicAvailableTimes = [...baseAvailableTimes];
    } finally {
      isLoadingTimes = false;
    }
  };

  let calendarDays = $derived.by(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Start on Monday
    let emptyDays = firstDay === 0 ? 6 : firstDay - 1; 

    const days: (Date | null)[] = [];
    for (let i = 0; i < emptyDays; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(0,0,0,0);
      days.push(d);
    }
    
    return days;
  });

  const monthName = $derived(
    new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(currentMonth)
  );

  const isDaySelectable = (day: Date) => {
    return day >= today && day <= maxDate;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getTime() === d2.getTime();
  };

  const submitBooking = async (e: Event) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !selectedDate || !selectedTime || !service) return;
    
    isSubmitting = true;
    
    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
    const dateStr = localDate.toISOString().split('T')[0];
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
      ]);

    isSubmitting = false;
    if (!error) {
      showSuccess = true;
    } else {
      alert("Hubo un error al agendar. Por favor, intenta de nuevo.");
      console.error(error);
    }
  };
</script>

<div class="booking-layout">
  <header class="booking-header">
    <a href="/#servicios" class="back-btn">
      <ArrowLeft size={24} />
    </a>
    <div class="header-title">
      Agendar Cita
    </div>
    <div style="width: 24px"></div>
  </header>

  <main class="booking-content">
    {#if loading}
      <div class="loading-state">Cargando detalles...</div>
    {:else if !service}
      <div class="error-state">Servicio no encontrado.</div>
    {:else if showSuccess}
      <!-- SUCCESS SCREEN -->
      <div class="success-container animation-scale">
        <div class="calendar-card">
          <div class="calendar-header">
            {new Intl.DateTimeFormat('es', { month: 'long' }).format(selectedDate as Date).toUpperCase()}
          </div>
          <div class="calendar-body">
            <span class="day-number">{(selectedDate as Date).getDate()}</span>
            <span class="weekday">{new Intl.DateTimeFormat('es', { weekday: 'long' }).format(selectedDate as Date)}</span>
            <div class="divider"></div>
            <span class="time-block">
              <Clock size={20} /> {selectedTime}
            </span>
          </div>
        </div>
        
        <h2>¡Cita Confirmada!</h2>
        <p class="success-msg">Gracias <strong>{clientName}</strong>, tu cita para <strong>{service.name}</strong> ha sido reservada con éxito.</p>
        
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
    {:else}
      <!-- SINGLE PAGE FLOW -->
      <div class="service-summary">
        <div class="service-image" style="background-image: url({service.image_url})"></div>
        <div class="service-info">
          <h3>{service.name}</h3>
          <div class="meta">
            <span class="price">${service.price}</span>
            <span class="duration"><Clock size={16}/> {service.duration_minutes} min</span>
          </div>
        </div>
      </div>

      <div class="flow-container">
        
        <section class="booking-section">
          <div class="section-header">
            <CalendarIcon size={20} class="section-icon" />
            <h2>1. Selecciona la Fecha</h2>
          </div>
          
          <div class="calendar-widget">
            <div class="calendar-controls">
              <button class="btn-icon" onclick={prevMonth}><ChevronLeft size={20}/></button>
              <div class="month-label">{monthName}</div>
              <button class="btn-icon" onclick={nextMonth}><ChevronRight size={20}/></button>
            </div>
            
            <div class="weekdays-grid">
              <span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span>
            </div>
            
            <div class="days-grid">
              {#each calendarDays as day}
                {#if day}
                  <button 
                    class="day-cell"
                    class:active={selectedDate && isSameDay(selectedDate, day)}
                    class:disabled={!isDaySelectable(day)}
                    disabled={!isDaySelectable(day)}
                    onclick={() => selectDay(day)}
                  >
                    {day.getDate()}
                  </button>
                {:else}
                  <div class="day-cell empty"></div>
                {/if}
              {/each}
            </div>
            <div class="calendar-note">Las citas solo pueden reservarse con hasta 10 días de anticipación.</div>
          </div>
        </section>

        {#if selectedDate}
          <section class="booking-section animation-slide">
            <div class="section-header">
              <Clock size={20} class="section-icon" />
              <h2>2. Elige la Hora para el {new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(selectedDate)}</h2>
            </div>
            
            {#if isLoadingTimes}
              <div class="loading-times">Consultando disponibilidad...</div>
            {:else if dynamicAvailableTimes.length > 0}
              <div class="times-grid">
                {#each dynamicAvailableTimes as time}
                  <button 
                    class="time-btn {selectedTime === time ? 'active' : ''}"
                    onclick={() => selectedTime = time}
                  >
                    {time}
                  </button>
                {/each}
              </div>
            {:else}
              <div class="empty-state">Día ocupado. Por favor elige otra fecha.</div>
            {/if}
          </section>
        {/if}

        <section class="booking-section" class:disabled-section={!selectedDate || !selectedTime}>
          <div class="section-header">
            <User size={20} class="section-icon" />
            <h2>3. Tus Datos</h2>
          </div>
          
          <form class="booking-form" onsubmit={submitBooking}>
            <div class="input-group">
              <label for="name">Nombre Completo</label>
              <div class="input-wrapper">
                <User size={18} class="input-icon" />
                <input type="text" id="name" bind:value={clientName} placeholder="Ej. María Pérez" required disabled={!selectedDate || !selectedTime} />
              </div>
            </div>

            <div class="input-group">
              <label for="phone">Número de WhatsApp</label>
              <div class="input-wrapper">
                <Phone size={18} class="input-icon" />
                <input type="tel" id="phone" bind:value={clientPhone} placeholder="Ej. +34 600 000 000" required disabled={!selectedDate || !selectedTime} />
              </div>
            </div>

            <button type="submit" class="btn-submit" disabled={isSubmitting || !selectedDate || !selectedTime || !clientName || !clientPhone}>
              {isSubmitting ? 'Confirmando Cita...' : 'Confirmar Reserva'}
            </button>
            <p class="secure-note">Tus datos están seguros. Recibirás un mensaje de confirmación por WhatsApp.</p>
          </form>
        </section>

      </div>
    {/if}
  </main>
</div>

<style>
  :global(body) { background-color: var(--color-blanco); }

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
    color: var(--color-grafito);
    cursor: pointer;
    display: flex;
    padding: 4px;
    margin-left: -4px;
  }

  .header-title {
    font-family: var(--font-heading);
    font-weight: 500;
    font-size: 1.1rem;
    color: var(--color-grafito);
  }

  .service-summary {
    display: flex;
    padding: 16px 24px;
    background: var(--color-blanco);
    gap: 16px;
    align-items: center;
    border-bottom: 1px solid rgba(0,0,0,0.03);
  }

  .service-image {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    background-size: cover;
    background-position: center;
  }

  .service-info h3 { margin: 0 0 4px 0; font-size: 1.1rem; color: var(--color-grafito); }
  
  .service-info .meta {
    display: flex;
    gap: 12px;
    font-size: 0.9rem;
    color: var(--color-primary);
    font-weight: 500;
  }
  
  .service-info .duration { color: #888; display: flex; align-items: center; gap: 4px; }

  .flow-container {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .booking-section {
    background: var(--color-blanco);
    padding: 24px;
    border-radius: 20px;
    box-shadow: var(--shadow-sm);
  }

  .disabled-section {
    opacity: 0.5;
    pointer-events: none;
    filter: grayscale(1);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    color: var(--color-grafito);
  }
  
  .section-icon { color: var(--color-primary); }
  .section-header h2 { margin: 0; font-size: 1.1rem; font-family: var(--font-sans); }

  /* Calendar Widget */
  .calendar-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .month-label { font-weight: 600; text-transform: capitalize; color: var(--color-grafito); }
  .btn-icon { background: none; border: none; cursor: pointer; color: #666; padding: 4px; }
  
  .weekdays-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: #999;
    margin-bottom: 12px;
  }
  
  .days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }
  
  .day-cell {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 50%;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--color-grafito);
  }
  
  .day-cell:hover:not(.disabled):not(.empty) {
    background: rgba(179, 102, 109, 0.1);
    color: var(--color-primary);
  }
  
  .day-cell.active {
    background: var(--color-primary);
    color: white;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(179, 102, 109, 0.3);
  }
  
  .day-cell.disabled { opacity: 0.2; cursor: not-allowed; }
  .day-cell.empty { pointer-events: none; }
  
  .calendar-note {
    font-size: 0.75rem;
    color: #888;
    text-align: center;
    margin-top: 16px;
    font-style: italic;
  }

  /* Times Grid */
  .times-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  
  .time-btn {
    padding: 12px 0;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,0.05);
    background: var(--color-blanco);
    color: var(--color-grafito);
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .time-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
  .time-btn.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }
  
  .loading-times, .empty-state {
    text-align: center;
    padding: 20px;
    color: #888;
    font-size: 0.9rem;
  }

  /* Form */
  .booking-form { display: flex; flex-direction: column; gap: 20px; }
  .input-group label { display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem; }
  .input-wrapper { position: relative; display: flex; align-items: center; }
  :global(.input-icon) { position: absolute; left: 16px; color: #888; }
  
  .input-group input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border: 1.5px solid rgba(0,0,0,0.08);
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.2s;
    background: white;
  }
  
  .input-group input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  .btn-submit {
    background: var(--color-grafito);
    color: white;
    padding: 16px;
    border-radius: 100px;
    border: none;
    font-weight: 600;
    font-size: 1.05rem;
    margin-top: 12px;
    cursor: pointer;
  }
  
  .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .secure-note { text-align: center; font-size: 0.8rem; color: #888; }

  /* Success Screen */
  .success-container { padding: 40px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; }
  .calendar-card { width: 100%; max-width: 240px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 32px rgba(0,0,0,0.08); margin-bottom: 32px; }
  .calendar-header { background: var(--color-primary); color: white; padding: 12px; font-weight: 600; font-size: 0.9rem; }
  .calendar-body { padding: 24px; display: flex; flex-direction: column; align-items: center; }
  .day-number { font-size: 4rem; font-weight: 700; color: var(--color-grafito); line-height: 1; }
  .weekday { font-size: 1.1rem; color: #888; text-transform: capitalize; margin-top: 4px; }
  .divider { height: 1px; width: 60%; background: #eee; margin: 16px 0; }
  .time-block { display: flex; align-items: center; gap: 8px; color: var(--color-primary); font-weight: 600; font-size: 1.2rem; }
  
  .success-msg { color: #666; margin: 16px 0 32px; line-height: 1.5; }
  .location-box { display: flex; align-items: center; background: white; padding: 16px; border-radius: 16px; width: 100%; border: 1px solid #eaeaea; text-align: left; margin-bottom: 32px; gap: 16px; }
  .location-icon { background: rgba(179, 102, 109, 0.1); padding: 12px; border-radius: 12px; }
  .location-details { flex-grow: 1; display: flex; flex-direction: column; }
  .location-details strong { color: var(--color-grafito); }
  .location-details span { color: #888; font-size: 0.9rem; }
  .btn-map { background: #f3f4f6; color: var(--color-grafito); padding: 8px 16px; border-radius: 100px; font-size: 0.85rem; text-decoration: none; font-weight: 600; }
  
  .animation-slide { animation: slideUp 0.4s ease-out; }
  .animation-scale { animation: popIn 0.5s ease-out; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
</style>
