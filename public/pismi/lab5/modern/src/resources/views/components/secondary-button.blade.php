<button {{ $attributes->merge(['type' => 'button', 'class' => 'btn btn-quiet']) }}>
    {{ $slot }}
</button>
