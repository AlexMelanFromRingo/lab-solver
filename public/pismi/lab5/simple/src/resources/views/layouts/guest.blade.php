<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Вхід – %%PIB_SHORT%%</title>

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="shell">
        <main class="card guest">
            <a class="guest-head" href="{{ route('welcome') }}">
                <x-application-logo />
                <span>
                    <b>%%PIB%%</b>
                    персональна сторінка
                </span>
            </a>

            {{ $slot }}
        </main>
    </body>
</html>
