<x-app-layout>
    <x-slot name="header">
        <h1>Повідомлення</h1>
        <p>Листи, надіслані через форму на головній сторінці, від нових до старих.</p>
    </x-slot>

    @if (session('status'))
        <p class="flash" role="status">{{ session('status') }}</p>
    @endif

    <section class="panel">
        @if ($messages->isEmpty())
            <p class="empty">Повідомлень поки немає. Коли хтось заповнить форму на сайті, лист з’явиться тут.</p>
        @else
            <div class="data-wrap">
                <table class="data">
                    <thead>
                        <tr>
                            <th>Від кого</th>
                            <th>Повідомлення</th>
                            <th class="num">Надіслано</th>
                            <th><span class="sr-only">Дії</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($messages as $message)
                            <tr>
                                <td>
                                    <b>{{ $message->name }}</b>
                                    <a class="note" href="mailto:{{ $message->email }}">{{ $message->email }}</a>
                                </td>
                                <td class="text">{{ $message->text }}</td>
                                <td class="num">{{ $message->created_at->format('d.m.Y H:i') }}</td>
                                <td class="row-actions">
                                    <form method="POST" action="{{ route('messages.destroy', $message) }}"
                                          onsubmit="event.preventDefault(); confirmDelete(this, @js('лист від ' . $message->name))">
                                        @csrf
                                        @method('delete')
                                        <button type="submit" class="btn btn-danger">Видалити</button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </section>
</x-app-layout>
