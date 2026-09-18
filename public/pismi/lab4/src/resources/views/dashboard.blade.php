{{--
    Особиста сторінка: нотатки поточного користувача, форма додавання та
    видалення з підтвердженням.
--}}
<x-app-layout>
    <x-slot name="header">
        <h2 class="text-xl font-semibold tracking-tight">Мої нотатки</h2>
    </x-slot>

    <div class="mx-auto max-w-6xl px-6 py-10">
        @if (session('status'))
            <p class="mb-6 inline-block rounded-panel border border-[#57b894]/40 bg-[#57b894]/10 px-4 py-2 text-[#57b894]">
                {{ session('status') }}
            </p>
        @endif

        <section class="panel-lead mb-6 px-10 py-9">
            <p class="mb-3 text-sm text-faint">Написано вами</p>
            <h1 class="mb-6 text-3xl font-semibold tracking-tight">{{ $notes->count() }}
                @php
                    $n = $notes->count() % 100;
                    $tail = $n % 10;
                @endphp
                {{ $n > 10 && $n < 20 ? 'нотаток' : ($tail === 1 ? 'нотатка' : ($tail >= 2 && $tail <= 4 ? 'нотатки' : 'нотаток')) }}</h1>

            @if ($notes->isEmpty())
                <p class="text-sm text-faint">Ви ще нічого не написали. Форма нижче це виправить.</p>
            @else
                <table class="data-table">
                    <thead>
                        <tr>
                            <th class="w-16 text-right font-mono">ID</th>
                            <th>Повідомлення</th>
                            <th class="w-40">Написано</th>
                            <th class="w-32 text-right">Дія</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($notes as $note)
                            <tr>
                                <td class="text-right font-mono tabular-nums text-dim">{{ $note->id }}</td>
                                <td>{{ $note->text }}</td>
                                <td class="font-mono text-[0.8125rem] tabular-nums text-faint">
                                    {{ $note->created_at->format('d.m.Y H:i') }}
                                </td>
                                <td class="text-right">
                                    <form id="note{{ $note->id }}" method="POST"
                                          action="{{ route('notes.destroy', $note->id) }}">
                                        @csrf
                                        @method('delete')
                                        <button type="button" class="btn btn-danger px-4 py-1.5 text-[0.8125rem]"
                                                onclick="confirmDelete({{ $note->id }})">
                                            Видалити
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section class="panel px-8 py-7">
            <h2 class="mb-4 text-lg font-semibold tracking-tight">Нове повідомлення</h2>

            <form method="POST" action="{{ route('notes.store') }}" class="flex flex-wrap items-start gap-4">
                @csrf
                <div class="flex min-w-[24rem] flex-1 flex-col gap-1.5">
                    <label for="text" class="text-[0.8125rem] text-faint">Текст повідомлення</label>
                    <input id="text" name="text" type="text" maxlength="500" required
                           class="field-input w-full" value="{{ old('text') }}"
                           placeholder="Не більше 500 символів">
                    @error('text')
                        <span class="text-[0.8125rem] text-[#d9634e]">{{ $message }}</span>
                    @enderror
                </div>
                <button type="submit" class="btn mt-6">Опублікувати</button>
            </form>
        </section>
    </div>

    <script>
        // Підтвердження видалення. Форма відправляється лише після згоди,
        // причому саме та форма, що відповідає обраній нотатці.
        function confirmDelete(id) {
            Swal.fire({
                title: 'Видалити нотатку?',
                html: 'Запис № <b>' + id + '</b> буде вилучено без можливості відновлення.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Так, видалити',
                cancelButtonText: 'Скасувати',
                confirmButtonColor: '#d9634e',
                cancelButtonColor: '#1e3140',
                background: '#16242f',
                color: '#e6eef4',
            }).then((result) => {
                if (result.isConfirmed) {
                    document.getElementById('note' + id).submit();
                }
            });
        }
    </script>
</x-app-layout>
