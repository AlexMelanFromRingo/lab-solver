@props(['status'])

@if ($status)
    <div {{ $attributes->merge(['class' => 'status']) }}>
        {{ $status }}
    </div>
@endif
