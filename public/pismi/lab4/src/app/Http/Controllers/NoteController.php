<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Note;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Контролер нотаток.
 *
 * Контролер у схемі MVC – прошарок між діями користувача та моделлю: він
 * приймає запит, звертається до моделі й обирає, яке відображення показати.
 * Обчислень і розмітки тут немає навмисно.
 *
 * З типових дій ресурсного контролера лишено три – index, store та destroy, –
 * і додано usernotes для особистої сторінки. Решту вилучено: нотатка не має
 * ні окремої сторінки перегляду, ні форми редагування.
 */
class NoteController extends Controller
{
    /**
     * Спільна дошка: усі нотатки всіх користувачів.
     *
     * Автор підвантажується одним запитом разом із нотатками. Без цього на
     * сторінці з N нотаток виконалося б N + 1 запитів – по одному на кожне
     * звернення до імені автора.
     */
    public function index(): View
    {
        $notes = Note::with('user')->latest()->get();

        return view('welcome', compact('notes'));
    }

    /**
     * Особиста сторінка: лише нотатки поточного користувача.
     */
    public function usernotes(): View
    {
        $user = User::findOrFail(Auth::id());
        $notes = Note::whereBelongsTo($user)->latest()->get();

        return view('dashboard', compact('notes'));
    }

    /**
     * Додавання нотатки.
     *
     * Автор береться з поточного сеансу, а не з форми: інакше будь-хто міг
     * би надіслати запит від чужого імені.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:500'],
        ]);

        Note::create([
            'user_id' => Auth::id(),
            'text' => $validated['text'],
        ]);

        return redirect()->route('dashboard')->with('status', 'Нотатку додано.');
    }

    /**
     * Видалення нотатки.
     *
     * Видалити можна лише власну нотатку. Перевірка тут обов'язкова:
     * ідентифікатор приходить з форми, тому сам собою він нічого не доводить.
     */
    public function destroy(Note $note): RedirectResponse
    {
        if ($note->user_id !== Auth::id()) {
            abort(403, 'Нотатка належить іншому користувачеві.');
        }

        $note->delete();

        return redirect()->route('dashboard')->with('status', 'Нотатку видалено.');
    }
}
