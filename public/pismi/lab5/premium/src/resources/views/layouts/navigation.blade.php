<header class="top">
    <a class="brand" href="{{ route('welcome') }}">
        <span class="rail" aria-hidden="true"></span>
        <span>
            <b>%%PIB_SHORT%%</b>
            кабінет власника сайту
        </span>
    </a>

    <nav class="menu" aria-label="Кабінет">
        <a href="{{ route('welcome') }}">Сайт</a>
        <a href="{{ route('dashboard') }}" @if (request()->routeIs('dashboard', 'projects.*')) aria-current="page" @endif>Мої роботи</a>
        <a href="{{ route('messages.index') }}" @if (request()->routeIs('messages.*')) aria-current="page" @endif>Повідомлення</a>
        <a href="{{ route('profile.edit') }}" @if (request()->routeIs('profile.*')) aria-current="page" @endif>{{ Auth::user()->name }}</a>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit">Вийти</button>
        </form>
    </nav>
</header>
