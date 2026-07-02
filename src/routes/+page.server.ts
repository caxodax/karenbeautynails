import { supabase } from '$lib/supabaseClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
    const { data } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();
        
    return {
        settings: data || {
            hero_image_url: '/hero_bg.png',
            hero_title: 'El arte de cuidar tu esencia',
            hero_subtitle: 'Diseño de uñas y estética profesional en un ambiente diseñado para tu relajación absoluta.'
        }
    };
};
