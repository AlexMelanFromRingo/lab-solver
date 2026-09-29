@php
    // Прізвище – окремим рядком заголовка, ім'я та по батькові – другим
    [$surname, $given] = array_pad(preg_split('/\s+/u', trim("%%PIB%%"), 2), 2, '');
@endphp
<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>%%PIB%% – персональна сторінка</title>
        <meta name="description" content="%%PIB%%, магістрант кафедри ЕОМ УДУНТ, група %%GROUP%%: роботи та контакт.">

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap">

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="shell">
        <div class="page">
            <header class="top">
                <a class="brand" href="{{ route('welcome') }}">
                    <span class="rail" aria-hidden="true"></span>
                    <span>
                        <b>%%PIB_SHORT%%</b>
                        персональна сторінка
                    </span>
                </a>

                <nav class="menu" aria-label="Розділи сайту">
                    <a href="#works">Роботи</a>
                    <a href="#about">Про мене</a>
                    <a href="#contact">Написати</a>
                    @auth
                        <a href="{{ route('dashboard') }}">Кабінет</a>
                    @else
                        <a href="{{ route('login') }}">Увійти</a>
                    @endauth
                </nav>
            </header>

            <section class="hero">
                <div>
                    <h1>
                        <span class="surname">{{ $surname }}</span>
                        <span class="given">{{ $given }}</span>
                    </h1>
                    <p class="lede">
                        Магістрант кафедри електронних обчислювальних машин УДУНТ.
                        Проєктую інформаційні системи для мережі Інтернет – від контейнера
                        з веб-сервером до застосунку на Laravel з базою даних.
                    </p>
                    <div class="actions">
                        <a class="btn btn-primary" href="#contact">Написати мені</a>
                        <a class="btn" href="#works">Переглянути роботи</a>
                    </div>
                </div>

                <aside class="glass strong card" aria-label="Коротко про автора">
                    <dl>
                        <dt>Група</dt>
                        <dd class="group">%%GROUP%%</dd>
                        <dt>Кафедра</dt>
                        <dd>Електронні обчислювальні машини</dd>
                        <dt>Університет</dt>
                        <dd>УДУНТ, Дніпро</dd>
                        <dt>Робіт на сайті</dt>
                        <dd>{{ $projects->count() }}</dd>
                    </dl>
                </aside>
            </section>

            <section id="works" class="section">
                <div class="section-head">
                    <h2>Роботи</h2>
                    <p>У порядку виконання: від першого контейнера до цього сайту.</p>
                </div>

                @if ($projects->isEmpty())
                    <p class="glass empty">Перелік робіт поки порожній.</p>
                @else
                    <ol class="route">
                        @foreach ($projects as $project)
                            <li class="glass stop">
                                <p class="stop-meta">Робота {{ $loop->iteration }}, {{ $project->year }}</p>
                                <h3>{{ $project->title }}</h3>
                                <p>{{ $project->description }}</p>
                                <ul class="stack" aria-label="Технології">
                                    @foreach (explode(',', $project->stack) as $tech)
                                        <li>{{ trim($tech) }}</li>
                                    @endforeach
                                </ul>
                                @if ($project->url)
                                    <a class="link" href="{{ $project->url }}">{{ $project->url }}</a>
                                @endif
                            </li>
                        @endforeach
                    </ol>
                @endif
            </section>

            <section id="about" class="section glass about">
                <h2>Про мене</h2>
                <div>
                    <p>
                        Навчаюся в магістратурі Українського державного університету науки
                        і технологій на кафедрі електронних обчислювальних машин, група %%GROUP%%.
                    </p>
                    <p>
                        Мене цікавить, як веб-застосунок поводиться поза ноутбуком розробника:
                        розгортання в контейнерах, робота з базою даних, розмежування доступу.
                        Цей сайт побудований на Laravel за шаблоном MVC – переліком робіт я керую
                        з власного кабінету, а листи з форми нижче зберігаються в базі даних.
                    </p>
                </div>
            </section>

            <section id="contact" class="section contact">
                <div class="intro">
                    <h2>Написати мені</h2>
                    <p>Питання щодо робіт, пропозиція співпраці чи відгук – відповім на вказану адресу.</p>
                </div>

                <form method="POST" action="{{ route('messages.store') }}" class="glass form-grid">
                    @csrf

                    @if (session('sent'))
                        <p class="flash field-wide" role="status">{{ session('sent') }}</p>
                    @endif

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
                        <textarea id="text" name="text" rows="5" required maxlength="2000" class="input">{{ old('text') }}</textarea>
                        <x-input-error :messages="$errors->get('text')" />
                    </div>

                    <div class="form-actions">
                        <x-primary-button>Надіслати</x-primary-button>
                    </div>
                </form>
            </section>

            <footer class="foot">
                <span>© {{ date('Y') }} %%PIB%%</span>
                <span>Зроблено на Laravel</span>
            </footer>
        </div>
    </body>
</html>
