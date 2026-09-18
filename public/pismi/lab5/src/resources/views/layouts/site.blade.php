{{--
    Спільний макет сайту.

    Акцентний колір приходить з теми й виставляється змінною CSS, тому
    тема змінює вигляд усього сайту, не чіпаючи жодного шаблону.
--}}
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $title ?? $theme['hero']['title'] }} — {{ $theme['name'] }}</title>
    <meta name="description" content="{{ $theme['hero']['lede'] }}">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>:root { --accent: {{ $theme['accent'] }}; }</style>
</head>
<body class="min-h-screen font-sans antialiased">

<header class="border-b hairline">
    <div class="mx-auto flex max-w-sheet flex-wrap items-center justify-between gap-4 px-6 py-5">
        <a href="{{ route('home') }}" class="flex items-baseline gap-3">
            <span class="text-xl font-semibold tracking-tight text-accent">{{ $theme['owner'] }}</span>
            <span class="text-[0.8125rem] text-faint">{{ $theme['type'] }}</span>
        </a>

        <nav class="flex flex-wrap items-center gap-6 text-sm">
            <a href="{{ route('home') }}#collection" class="text-dim hover:text-ink">{{ $theme['collection']['title'] }}</a>
            <a href="{{ route('home') }}#about" class="text-dim hover:text-ink">{{ $theme['about']['title'] }}</a>
            <a href="{{ route('home') }}#contact" class="text-dim hover:text-ink">Зв’язок</a>
            @auth
                <a href="{{ route('items.index') }}" class="text-dim hover:text-ink">Керування</a>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="text-dim hover:text-ink">Вийти</button>
                </form>
            @else
                <a href="{{ route('login') }}" class="text-faint hover:text-ink">Вхід</a>
            @endauth
        </nav>
    </div>
</header>

@if (session('status'))
    <div class="mx-auto max-w-sheet px-6 pt-6">
        <p class="inline-block rounded-panel border border-[#57b894]/40 bg-[#57b894]/10 px-4 py-2 text-[#57b894]">
            {{ session('status') }}
        </p>
    </div>
@endif

<main>{{ $slot }}</main>

<footer class="mt-24 border-t hairline">
    <div class="mx-auto flex max-w-sheet flex-wrap items-center justify-between gap-4 px-6 py-8 text-[0.8125rem] text-faint">
        <span>{{ $theme['owner'] }} · {{ date('Y') }}</span>
        <div class="flex flex-wrap items-center gap-4">
            <span>Інша тема сайту:</span>
            @foreach ($options as $key => $name)
                <a href="{{ route('home') }}?theme={{ $key }}"
                   class="{{ $key === $theme['key'] ? 'text-accent' : 'text-dim hover:text-ink' }}">{{ $name }}</a>
            @endforeach
        </div>
    </div>
</footer>
</body>
</html>
