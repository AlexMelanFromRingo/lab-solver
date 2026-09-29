<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;

/**
 * Форма зворотного зв’язку: відвідувачі надсилають повідомлення,
 * власник сайту читає та видаляє їх після входу.
 */
class MessageController extends Controller
{
    /**
     * Усі повідомлення, від нових до старих.
     */
    public function index(): View
    {
        $messages = Message::latest()->get();

        return view('messages.index', compact('messages'));
    }

    /**
     * Збереження повідомлення з форми на головній сторінці.
     *
     * Форма стоїть унизу сторінки, тому після надсилання відвідувач
     * повертається саме до неї (#contact), а не на початок сторінки.
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:150',
            'text' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return redirect(route('welcome') . '#contact')
                ->withErrors($validator)
                ->withInput();
        }

        Message::create($validator->validated());

        return redirect(route('welcome') . '#contact')
            ->with('sent', 'Дякую! Повідомлення надіслано.');
    }

    /**
     * Видалення прочитаного повідомлення.
     */
    public function destroy(Message $message): RedirectResponse
    {
        $message->delete();

        return redirect()->route('messages.index')->with('status', 'Повідомлення видалено.');
    }
}
