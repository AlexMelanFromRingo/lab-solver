<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Item;
use App\Support\Theme;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Закрита частина: керування записами переліку.
 *
 * Ресурсний контролер з повним набором дій CRUD. Підписи полів у формі
 * беруться з опису теми, тому та сама форма редагує і проєкт портфоліо, і
 * пілота Формули-1.
 */
class ItemController extends Controller
{
    /**
     * Перелік записів поточної теми.
     */
    public function index(Request $request): View
    {
        $theme = Theme::current($request);

        return view('admin.items', [
            'theme' => $theme,
            'items' => Item::ofTheme($theme['key'])->get(),
            'options' => Theme::options(),
        ]);
    }

    /**
     * Форма створення.
     */
    public function create(Request $request): View
    {
        return view('admin.item-form', [
            'theme' => Theme::current($request),
            'item' => new Item(),
            'options' => Theme::options(),
        ]);
    }

    /**
     * Збереження нового запису.
     */
    public function store(Request $request): RedirectResponse
    {
        $theme = Theme::key($request);
        Item::create($this->validated($request) + ['theme' => $theme]);

        return redirect()->route('items.index')->with('status', 'Запис додано.');
    }

    /**
     * Форма редагування.
     */
    public function edit(Request $request, Item $item): View
    {
        return view('admin.item-form', [
            'theme' => Theme::current($request),
            'item' => $item,
            'options' => Theme::options(),
        ]);
    }

    /**
     * Збереження змін.
     */
    public function update(Request $request, Item $item): RedirectResponse
    {
        $item->update($this->validated($request));

        return redirect()->route('items.index')->with('status', 'Запис оновлено.');
    }

    /**
     * Видалення запису.
     */
    public function destroy(Item $item): RedirectResponse
    {
        $item->delete();

        return redirect()->route('items.index')->with('status', 'Запис видалено.');
    }

    /**
     * Перевірка значень форми.
     *
     * Правила спільні для створення й редагування, тому винесені окремо:
     * інакше вони розійшлися б після першої ж правки.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'subtitle' => ['required', 'string', 'max:160'],
            'meta' => ['required', 'string', 'max:80'],
            'year' => ['required', 'integer', 'between:0,3000'],
            'description' => ['required', 'string', 'max:1000'],
            'position' => ['nullable', 'integer', 'between:0,999'],
        ], [
            'title.required' => 'Заповніть перше поле.',
            'year.integer' => 'Рік має бути цілим числом.',
            'description.required' => 'Додайте короткий опис.',
        ]);
    }
}
