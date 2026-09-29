@php
    // Знак сайту – ініціали власника: перші літери прізвища та імені
    $initials = collect(preg_split('/\s+/u', trim("%%PIB%%")))
        ->take(2)
        ->map(fn ($word) => mb_substr($word, 0, 1))
        ->implode('');
@endphp
<span {{ $attributes->merge(['class' => 'logo']) }} aria-hidden="true">{{ $initials }}</span>
