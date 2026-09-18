{{--
    Спільна дошка повідомлень: усі нотатки всіх користувачів.

    Сторінка відкрита для всіх, тому дій над нотатками тут немає – лише
    перегляд. Додавати й видаляти можна на особистій сторінці.
--}}
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Дошка повідомлень</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen font-sans antialiased">
<div class="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[17rem_minmax(0,1fr)]">

    <aside class="lg:sticky lg:top-12 lg:self-start">
        <div class="border-b hairline pb-5 text-[0.8125rem] leading-relaxed text-faint">
            Український державний університет<br>науки і технологій<br>Кафедра ЕОМ
        </div>
        <div class="mt-6 font-mono text-6xl font-medium leading-none tracking-tighter text-brass">04</div>
        <h2 class="mb-7 mt-2 max-w-[22ch] text-[1.0625rem] font-semibold">
            Розробка web-додатку на фреймворку Laravel
        </h2>
        <dl class="text-sm">
            <dt class="text-faint">Додаток</dt>
            <dd class="mb-3.5 text-dim">Дошка повідомлень</dd>
            <dt class="text-faint">Нотаток</dt>
            <dd class="mb-3.5 text-dim">{{ $notes->count() }}</dd>
            <dt class="text-faint">Авторів</dt>
            <dd class="mb-3.5 text-dim">{{ $notes->pluck('user_id')->unique()->count() }}</dd>
            <dt class="text-faint">Студент</dt>
            <dd class="text-dim">Іваненко І. І., 101М</dd>
        </dl>
    </aside>

    <main class="flex min-w-0 flex-col gap-6">
        <section class="panel-lead px-10 py-9">
            <p class="mb-3 text-sm text-faint">Спільна дошка</p>
            <h1 class="mb-3 text-4xl font-semibold tracking-tight">Повідомлення користувачів</h1>
            <p class="mb-6 max-w-[68ch] text-[1.0625rem] text-dim">
                Усе, що написали користувачі додатку. Щоб залишити своє повідомлення,
                увійдіть до особистої сторінки.
            </p>

            @if ($notes->isEmpty())
                <p class="text-sm text-faint">
                    Повідомлень ще немає. Перше з’явиться тут одразу після того, як його напишуть.
                </p>
            @else
                <table class="data-table">
                    <thead>
                        <tr>
                            <th class="w-16 text-right font-mono">ID</th>
                            <th class="w-56">Автор</th>
                            <th>Повідомлення</th>
                            <th class="w-40">Написано</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($notes as $note)
                            <tr>
                                <td class="text-right font-mono tabular-nums text-dim">{{ $note->id }}</td>
                                <td class="font-semibold">{{ $note->user->name }}</td>
                                <td>{{ $note->text }}</td>
                                <td class="font-mono text-[0.8125rem] tabular-nums text-faint">
                                    {{ $note->created_at->format('d.m.Y H:i') }}
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </section>

        <section class="border-t hairline pt-6">
            @auth
                <p class="text-sm text-faint">
                    Ви увійшли як <b class="text-ink">{{ auth()->user()->name }}</b>.
                    <a href="{{ route('dashboard') }}" class="text-azure underline underline-offset-4">
                        Перейти до своїх нотаток
                    </a>
                </p>
            @else
                <p class="text-sm text-faint">
                    <a href="{{ route('login') }}" class="text-azure underline underline-offset-4">Увійти</a>
                    або
                    <a href="{{ route('register') }}" class="text-azure underline underline-offset-4">зареєструватися</a>,
                    щоб залишати повідомлення.
                </p>
            @endauth
        </section>
    </main>
</div>
</body>
</html>
