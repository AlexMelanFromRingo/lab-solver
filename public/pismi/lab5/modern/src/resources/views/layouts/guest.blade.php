<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Вхід – %%PIB_SHORT%%</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="shell">
        <div class="sheet small">
            <div class="frame">
                <main class="field-area">
                    <a class="guest-head" href="{{ route('welcome') }}">
                        <x-application-logo />
                        <span>
                            <b>%%PIB%%</b>
                            персональна сторінка
                        </span>
                    </a>

                    {{ $slot }}
                </main>

                <footer class="stamp">
                    <p class="org">УДУНТ, кафедра ЕОМ</p>
                    <p class="sheet-no">Аркуш 3</p>
                </footer>
            </div>
        </div>
    </body>
</html>
