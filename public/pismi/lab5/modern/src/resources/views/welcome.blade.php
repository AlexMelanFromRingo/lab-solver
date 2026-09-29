<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>%%PIB_SHORT%% – персональна сторінка</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="shell">
        <div class="sheet">
            <div class="frame">
                <main class="field-area">
                    <nav class="menu" aria-label="Розділи сайту">
                        <a href="#works">Роботи</a>
                        <a href="#contact">Написати</a>
                        @auth
                            <a href="{{ route('dashboard') }}">Кабінет</a>
                        @else
                            <a href="{{ route('login') }}">Увійти</a>
                        @endauth
                    </nav>

                    <p class="kind">Персональна сторінка</p>
                    <h1 class="name">%%PIB%%</h1>
                    <p class="role">Магістрант кафедри електронних обчислювальних машин УДУНТ, група %%GROUP%%.</p>

                    <div class="about">
                        <p>
                            Вивчаю проєктування інформаційних систем для мережі Інтернет: контейнери Docker,
                            PHP, бази даних MySQL і фреймворк Laravel. Мене цікавить, як застосунок живе поза
                            ноутбуком розробника – у контейнерах, з базою даних і розмежуванням доступу.
                        </p>
                        <p>
                            Нижче – специфікація робіт, виконаних під час навчання, і форма, через яку можна мені
                            написати. Переліком робіт я керую з власного кабінету на цьому ж сайті.
                        </p>
                    </div>

                    <h2 id="works" class="part">Специфікація робіт</h2>
                    @if ($projects->isEmpty())
                        <p class="empty">Перелік робіт поки порожній.</p>
                    @else
                        <div class="spec-wrap">
                            <table class="spec">
                                <thead>
                                    <tr>
                                        <th class="num">Поз.</th>
                                        <th>Найменування</th>
                                        <th>Технології</th>
                                        <th class="num">Рік</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($projects as $project)
                                        <tr>
                                            <td class="num">{{ $loop->iteration }}</td>
                                            <td>
                                                <span class="title">{{ $project->title }}</span>
                                                <span class="note">{{ $project->description }}</span>
                                                @if ($project->url)
                                                    <a href="{{ $project->url }}">{{ $project->url }}</a>
                                                @endif
                                            </td>
                                            <td>{{ $project->stack }}</td>
                                            <td class="num">{{ $project->year }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
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

                <footer class="stamp">
                    <p class="key">Розробив</p>
                    <p>%%PIB_SHORT%%</p>
                    <p class="key">Група</p>
                    <p class="mono">%%GROUP%%</p>
                    <p class="key">Робіт</p>
                    <p class="mono">{{ $projects->count() }}</p>
                    <p class="title">Персональна сторінка</p>
                    <p class="org">УДУНТ, кафедра ЕОМ</p>
                    <p class="sheet-no">Аркуш 1</p>
                </footer>
            </div>
        </div>
    </body>
</html>
