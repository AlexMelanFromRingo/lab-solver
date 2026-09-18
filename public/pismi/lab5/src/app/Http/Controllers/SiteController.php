<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Item;
use App\Support\Theme;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Публічна частина сайту.
 *
 * Контролер знає лише те, яку тему показати й де взяти записи; наповнення
 * бере з опису теми, розмітку – з відображення.
 */
class SiteController extends Controller
{
    /**
     * Головна сторінка: перший екран, перелік записів, блок «про» та форма.
     */
    public function index(Request $request): View
    {
        $theme = Theme::current($request);
        $items = Item::ofTheme($theme['key'])->get();

        return view('site.index', [
            'theme' => $theme,
            'items' => $items,
            'options' => Theme::options(),
        ]);
    }

    /**
     * Окрема сторінка запису.
     */
    public function show(Request $request, Item $item): View
    {
        $theme = Theme::current($request);

        abort_unless($item->theme === $theme['key'], 404);

        return view('site.item', [
            'theme' => $theme,
            'item' => $item,
            'options' => Theme::options(),
        ]);
    }
}
