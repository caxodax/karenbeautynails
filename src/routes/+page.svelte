<script>
  import Hero from '$lib/components/Hero.svelte';
  import Catalog from '$lib/components/Catalog.svelte';
  import Gallery from '$lib/components/Gallery.svelte';
  import Testimonials from '$lib/components/Testimonials.svelte';
</script>

<svelte:head>
  <title>Karen Beauty | Manicura Premium & Estética</title>
  <meta name="description" content="Reserva tu cita para servicios de manicura, pedicura y estética profesional con Karen Beauty Nails." />
</svelte:head>

<main>
  <Hero />
  <Catalog />
  <Gallery />
  <Testimonials />
</main>
