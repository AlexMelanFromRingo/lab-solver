<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>%%PIB%% – персональна сторінка</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="font-sans antialiased bg-gray-100 text-gray-900">
        <header class="max-w-5xl mx-auto px-6 py-4 flex justify-end gap-4 text-sm">
            @auth
                <a href="{{ route('dashboard') }}" class="rounded-md px-3 py-2 text-gray-700 hover:text-gray-900">
                    Кабінет
                </a>
            @else
                <a href="{{ route('login') }}" class="rounded-md px-3 py-2 text-gray-700 hover:text-gray-900">
                    Увійти
                </a>
                @if (Route::has('register'))
                    <a href="{{ route('register') }}" class="rounded-md px-3 py-2 text-gray-700 hover:text-gray-900">
                        Зареєструватися
                    </a>
                @endif
            @endauth
        </header>

        <main class="max-w-5xl mx-auto px-6 pb-12 space-y-6">
            <!-- Візитка -->
            <section class="p-6 bg-white shadow-sm sm:rounded-lg">
                <h1 class="text-2xl font-semibold text-gray-800">%%PIB%%</h1>
                <p class="mt-1 text-gray-600">Магістрант кафедри електронних обчислювальних машин УДУНТ, група %%GROUP%%.</p>
                <p class="mt-4 text-gray-700">
                    Вивчаю проєктування інформаційних систем для мережі Інтернет: контейнери Docker, PHP,
                    бази даних MySQL і фреймворк Laravel. Нижче – роботи, виконані під час навчання,
                    і форма, через яку можна мені написати.
                </p>
            </section>

            <!-- Перелік робіт з бази даних -->
            <section class="p-6 bg-white shadow-sm sm:rounded-lg">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Мої роботи</h2>
                <div class="relative overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-4 py-2">N</th>
                                <th class="px-4 py-2">Назва</th>
                                <th class="px-4 py-2">Технології</th>
                                <th class="px-4 py-2">Рік</th>
                                <th class="px-4 py-2">Додав</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($projects as $project)
                                <tr class="border-b">
                                    <td class="px-4 py-2">{{ $loop->iteration }}</td>
                                    <td class="px-4 py-2">
                                        <div class="font-medium text-gray-900">{{ $project->title }}</div>
                                        <div>{{ $project->description }}</div>
                                        @if ($project->url)
                                            <a href="{{ $project->url }}" class="text-pink-600 underline">{{ $project->url }}</a>
                                        @endif
                                    </td>
                                    <td class="px-4 py-2">{{ $project->stack }}</td>
                                    <td class="px-4 py-2">{{ $project->year }}</td>
                                    <td class="px-4 py-2">{{ $project->user->name }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Форма зворотного зв’язку -->
            <section id="contact" class="p-6 bg-white shadow-sm sm:rounded-lg">
                <h2 class="text-lg font-medium text-gray-900 mb-4">Написати мені</h2>

                @if (session('sent'))
                    <p class="mb-4 font-medium text-sm text-green-600">{{ session('sent') }}</p>
                @endif

                <form method="POST" action="{{ route('messages.store') }}" class="space-y-4 max-w-xl">
                    @csrf
                    <div>
                        <x-input-label for="name" value="Ім’я" />
                        <x-text-input id="name" name="name" type="text" class="mt-1 block w-full" :value="old('name')" required />
                        <x-input-error :messages="$errors->get('name')" class="mt-2" />
                    </div>
                    <div>
                        <x-input-label for="email" value="Електронна пошта" />
                        <x-text-input id="email" name="email" type="email" class="mt-1 block w-full" :value="old('email')" required />
                        <x-input-error :messages="$errors->get('email')" class="mt-2" />
                    </div>
                    <div>
                        <x-input-label for="text" value="Повідомлення" />
                        <textarea id="text" name="text" rows="4" required class="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">{{ old('text') }}</textarea>
                        <x-input-error :messages="$errors->get('text')" class="mt-2" />
                    </div>
                    <button type="submit" class="bg-pink-500 text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150">
                        Надіслати
                    </button>
                </form>
            </section>
        </main>

        <footer class="max-w-5xl mx-auto px-6 pb-8 text-sm text-gray-500">
            © {{ date('Y') }} %%PIB%%
        </footer>
    </body>
</html>
