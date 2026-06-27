<script lang="ts">
    import { CalendarCheck, MessageSquare, PlusSquare, Image as ImageIcon } from "@lucide/svelte";
    import { page } from "$app/stores";
    let { children } = $props();
</script>

<div class="admin-layout">
    <aside class="sidebar">
        <div class="brand">
            <h2>Karen Beauty</h2>
            <span class="badge">Admin</span>
        </div>
        <nav>
            <a
                href="/admin"
                class="nav-item {($page.url.pathname as string) === '/admin'
                    ? 'active'
                    : ''}"
            >
                <CalendarCheck size={20} />
                Agenda
            </a>
            <a
                href="/admin/testimonios"
                class="nav-item {($page.url.pathname as string) === '/admin/testimonios'
                    ? 'active'
                    : ''}"
            >
                <MessageSquare size={20} />
                Testimonios
            </a>
            <a
                href="/admin/servicios"
                class="nav-item {($page.url.pathname as string) === '/admin/servicios'
                    ? 'active'
                    : ''}"
            >
                <PlusSquare size={20} />
                Servicios
            </a>
            <a
                href="/admin/creaciones"
                class="nav-item {($page.url.pathname as string) === '/admin/creaciones'
                    ? 'active'
                    : ''}"
            >
                <ImageIcon size={20} />
                Galería
            </a>
        </nav>
    </aside>
    <main class="content">
        {@render children()}
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        font-family: var(--font-sans, system-ui, sans-serif);
        background-color: var(--color-neutro, #f3f4f6);
    }

    .admin-layout {
        display: flex;
        min-height: 100vh;
    }

    .sidebar {
        width: 250px;
        background-color: white;
        border-right: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        flex-direction: column;
        padding: 24px;
        position: sticky;
        top: 0;
        height: 100vh;
    }

    .brand {
        margin-bottom: 40px;
    }

    .brand h2 {
        margin: 0;
        font-family: var(--font-heading, sans-serif);
        color: var(--color-grafito, #2a2c2e);
    }

    .badge {
        display: inline-block;
        background-color: var(--color-primary, #b3666d);
        color: white;
        font-size: 0.7rem;
        padding: 4px 8px;
        border-radius: 12px;
        margin-top: 8px;
    }

    nav {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        text-decoration: none;
        color: var(--color-grafito, #2a2c2e);
        border-radius: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
    }

    .nav-item:hover {
        background-color: rgba(0, 0, 0, 0.03);
    }

    .nav-item.active {
        background-color: rgba(179, 102, 109, 0.1);
        color: var(--color-primary, #b3666d);
    }

    .content {
        flex-grow: 1;
        padding: 40px;
        max-width: 1000px;
        margin: 0 auto;
    }

    /* Responsive para móviles (Dashboard on mobile) */
    @media (max-width: 768px) {
        .admin-layout {
            flex-direction: column;
        }

        .sidebar {
            width: 100%;
            height: auto;
            position: relative;
            padding: 16px;
            border-right: none;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        nav {
            flex-direction: row;
            overflow-x: auto;
        }

        .content {
            padding: 20px;
        }
    }
</style>
