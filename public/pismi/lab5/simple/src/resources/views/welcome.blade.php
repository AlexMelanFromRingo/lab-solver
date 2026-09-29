<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>%%PIB%% – персональна сторінка</title>

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="shell">
        <main class="card">
            <div class="meta">
                <span>Персональна сторінка</span>
                <nav aria-label="Розділи сайту">
                    <a href="#works">Роботи</a>
                    <a href="#contact">Написати</a>
                    @auth
                        <a href="{{ route('dashboard') }}">Кабінет</a>
                    @else
                        <a href="{{ route('login') }}">Увійти</a>
                    @endauth
                </nav>
            </div>

            <h1 class="name">%%PIB%%</h1>
            <p class="role">Магістрант кафедри електронних обчислювальних машин УДУНТ, група %%GROUP%%.</p>

            <div class="about">
                <p>
                    Вивчаю проєктування інформаційних систем для мережі Інтернет: контейнери Docker,
                    PHP, бази даних MySQL і фреймворк Laravel.
                </p>
                <p>
                    Нижче – роботи, виконані під час навчання, і форма, через яку можна мені написати.
                    Переліком робіт я керую з власного кабінету на цьому ж сайті.
                </p>
            </div>

            <h2 id="works" class="part">Роботи</h2>
            @if ($projects->isEmpty())
                <p class="empty">Перелік робіт поки порожній.</p>
            @else
                <ol class="works">
                    @foreach ($projects as $project)
                        <li>
                            <div class="work-head">
                                <b>{{ $project->title }}</b>
                                <span class="year">{{ $project->year }}</span>
                            </div>
                            <p class="stack">{{ $project->stack }}</p>
                            <p>{{ $project->description }}</p>
                            @if ($project->url)
                                <a href="{{ $project->url }}">{{ $project->url }}</a>
                            @endif
                        </li>
                    @endforeach
                </ol>
            @endif

            <h2 id="contact" class="part">Написати мені</h2>

            @if (session('sent'))
                <p class="flash" role="status">{{ session('sent') }}</p>
            @endif

            <form method="POST" action="{{ route('messages.store') }}" class="form-grid">
                @csrf

                <div class="field">
                    <x-input-label for="name" value="Ім’я" />
                    <x-text-input id="name" name="name" type="text" :value="old('name')" required maxlength="100" autocomplete="name" />
                    <x-input-error :messages="$errors->get('name')" />
                </div>

                <div class="field">
                    <x-input-label for="email" value="Електронна пошта" />
                    <x-text-input id="email" name="email" type="email" :value="old('email')" required maxlength="150" autocomplete="email" />
                    <x-input-error :messages="$errors->get('email')" />
                </div>

                <div class="field field-wide">
                    <x-input-label for="text" value="Повідомлення" />
                    <textarea id="text" name="text" rows="4" required maxlength="2000" class="input">{{ old('text') }}</textarea>
                    <x-input-error :messages="$errors->get('text')" />
                </div>

                <div class="form-actions">
                    <x-primary-button>Надіслати</x-primary-button>
                </div>
            </form>
        </main>

        <footer class="foot">© {{ date('Y') }} %%PIB%%</footer>
    </body>
</html>
