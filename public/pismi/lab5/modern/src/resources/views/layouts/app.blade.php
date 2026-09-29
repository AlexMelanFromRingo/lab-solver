<!DOCTYPE html>
<html lang="uk">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>Кабінет – %%PIB_SHORT%%</title>

        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=PT+Mono&family=PT+Sans+Narrow:wght@400;700&display=swap">

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="shell">
        <div class="sheet">
            <div class="frame">
                <div class="field-area">
                    @include('layouts.navigation')

                    @isset($header)
                        <header class="page-head">
                            {{ $header }}
                        </header>
                    @endisset

                    <main>
                        {{ $slot }}
                    </main>
                </div>

                <footer class="stamp">
                    <p class="key">Розробив</p>
                    <p>%%PIB_SHORT%%</p>
                    <p class="key">Група</p>
                    <p class="mono">%%GROUP%%</p>
                    <p class="key">Увійшов</p>
                    <p>{{ Auth::user()->name }}</p>
                    <p class="title">Кабінет власника сайту</p>
                    <p class="org">УДУНТ, кафедра ЕОМ</p>
                    <p class="sheet-no">Аркуш 2</p>
                </footer>
            </div>
        </div>
    </body>
</html>
