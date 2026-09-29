<x-app-layout>
    <x-slot name="header">
        <h1>Зміна роботи</h1>
        <p>{{ $project->title }}</p>
    </x-slot>

    <section class="panel">
        <form method="POST" action="{{ route('projects.update', $project) }}" class="form-grid">
            @csrf
            @method('put')
            @include('projects.fields', ['project' => $project])
            <div class="form-actions">
                <x-primary-button>Зберегти зміни</x-primary-button>
                <a class="btn btn-quiet" href="{{ route('dashboard') }}">Скасувати</a>
            </div>
        </form>
    </section>
</x-app-layout>
