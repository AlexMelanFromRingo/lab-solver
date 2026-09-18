<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Message;
use App\Support\Theme;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Форма зворотного зв'язку та перегляд надісланого.
 */
class MessageController extends Controller
{
    /**
     * Прийняти лист із форми.
     */
    public function store(Request $request): RedirectResponse
    {
        $theme = Theme::key($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160'],
            'body' => ['required', 'string', 'min:10', 'max:2000'],
        ], [
            'name.required' => 'Вкажіть, як до вас звертатися.',
            'email.required' => 'Без адреси не буде куди відповісти.',
            'email.email' => 'Адреса схожа на помилкову — перевірте її.',
            'body.required' => 'Напишіть повідомлення.',
            'body.min' => 'Повідомлення надто коротке: щонайменше 10 символів.',
        ]);

        Message::create($validated + ['theme' => $theme]);

        return redirect()->to(route('home') . '#contact')
            ->with('status', 'Дякую, лист надіслано. Відповім найближчим часом.');
    }

    /**
     * Скринька: листи поточної теми. Доступна лише після входу.
     */
    public function index(Request $request): View
    {
        $theme = Theme::current($request);

        return view('admin.messages', [
            'theme' => $theme,
            'messages' => Message::ofTheme($theme['key'])->get(),
            'options' => Theme::options(),
        ]);
    }

    /**
     * Позначити лист прочитаним.
     */
    public function markRead(Message $message): RedirectResponse
    {
        $message->update(['is_read' => true]);

        return back()->with('status', 'Лист позначено прочитаним.');
    }

    /**
     * Видалити лист.
     */
    public function destroy(Message $message): RedirectResponse
    {
        $message->delete();

        return back()->with('status', 'Лист видалено.');
    }
}
