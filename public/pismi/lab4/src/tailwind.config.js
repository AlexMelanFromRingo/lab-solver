import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/**
 * Оформлення веб-додатку тримається тієї самої візуальної мови, що й решта
 * лабораторних робіт курсу: холодна сталь як поле, скляні панелі поверх неї,
 * латунь як акцент, гарнітура IBM Plex.
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
                steel: {
                    900: '#0f1a22',
                    800: '#16242f',
                    700: '#1e3140',
                },
                brass: '#c9a227',
                azure: '#5ba7d6',
                ink: '#e6eef4',
                dim: '#93a8b6',
                faint: '#64798a',
            },
            fontFamily: {
                sans: ['IBM Plex Sans', ...defaultTheme.fontFamily.sans],
                mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
            },
            borderRadius: {
                panel: '3px',
            },
        },
    },

    plugins: [forms],
};
