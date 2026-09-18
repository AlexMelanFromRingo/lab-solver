<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Поточна тема сайту.
 *
 * Тема приходить параметром рядка браузера й запам'ятовується в сеансі, щоб
 * її не доводилося вказувати на кожній сторінці. Невідоме значення мовчки
 * замінюється на тему за замовчуванням – параметр приходить ззовні, тому
 * покладатися на нього не можна.
 */
final class Theme
{
    /**
     * Ключ поточної теми.
     */
    public static function key(Request $request): string
    {
        $themes = config('site.themes');
        $asked = $request->query('theme');

        if (is_string($asked) && isset($themes[$asked])) {
            $request->session()->put('site.theme', $asked);

            return $asked;
        }

        $remembered = $request->session()->get('site.theme');

        return is_string($remembered) && isset($themes[$remembered])
            ? $remembered
            : config('site.default');
    }

    /**
     * Опис поточної теми.
     *
     * @return array<string, mixed>
     */
    public static function current(Request $request): array
    {
        $key = self::key($request);

        return config("site.themes.{$key}") + ['key' => $key];
    }

    /**
     * Усі теми у вигляді «ключ – назва».
     *
     * @return array<string, string>
     */
    public static function options(): array
    {
        return array_map(
            static fn (array $theme): string => $theme['name'],
            config('site.themes')
        );
    }
}
