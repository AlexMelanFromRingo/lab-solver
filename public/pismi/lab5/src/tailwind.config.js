import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/**
 * Акцентний колір задає тема сайту, тому він не вшитий у палітру, а
 * береться зі змінної CSS --accent, яку виставляє макет сторінки.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],

    theme: {
        extend: {
            colors: {
                steel: { 900: '#0f1a22', 800: '#16242f', 700: '#1e3140' },
                accent: 'var(--accent)',
                ink: '#e6eef4',
                dim: '#93a8b6',
                faint: '#64798a',
            },
            fontFamily: {
                sans: ['IBM Plex Sans', ...defaultTheme.fontFamily.sans],
                mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
            },
            borderRadius: { panel: '3px' },
            maxWidth: { sheet: '72rem' },
        },
    },

    plugins: [forms],
};
