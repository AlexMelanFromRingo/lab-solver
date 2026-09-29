<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Вхід – %%PIB_SHORT%%</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&display=swap">

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="shell">
        <div class="guest">
            <div class="guest-box">
                <a class="guest-head" href="{{ route('welcome') }}">
                    <x-application-logo />
                    <span>
                        <b>%%PIB%%</b>
                        персональна сторінка
                    </span>
                </a>

                <div class="glass guest-card">
                    {{ $slot }}
                </div>
            </div>
        </div>
    </body>
</html>
