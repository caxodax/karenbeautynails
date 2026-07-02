<script lang="ts">
    import { CalendarCheck, MessageSquare, PlusSquare, Image as ImageIcon, Settings } from "@lucide/svelte";
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
            <a
                href="/admin/ajustes"
                class="nav-item {($page.url.pathname as string) === '/admin/ajustes'
                    ? 'active'
                    : ''}"
            >
                <Settings size={20} />
                Ajustes
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

    /* Responsive para móviles (Dashboard on mobile premium) */
    @media (max-width: 768px) {
        .admin-layout {
            flex-direction: column;
        }

        .sidebar {
            width: 100%;
            height: auto;
            position: sticky;
            top: 0;
            padding: 16px 24px;
            border-right: none;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            z-index: 40;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .brand {
            margin-bottom: 0;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .brand h2 {
            font-size: 1.4rem;
        }

        .badge {
            margin-top: 0;
        }

        nav {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background: white;
            flex-direction: row;
            justify-content: space-around;
            padding: 12px 8px;
            padding-bottom: calc(12px + env(safe-area-inset-bottom));
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.04);
            z-index: 50;
            gap: 4px;
        }

        .nav-item {
            flex-direction: column;
            gap: 6px;
            padding: 10px 4px;
            font-size: 0.75rem;
            border-radius: 16px;
            flex: 1;
            justify-content: center;
            text-align: center;
        }

        .nav-item:hover {
            background-color: transparent;
        }

        .nav-item.active {
            background-color: transparent;
            color: var(--color-primary, #b3666d);
        }

        .content {
            padding: 24px 20px;
            padding-bottom: 120px; /* Espacio para el bottom nav */
        }
    }
</style>
