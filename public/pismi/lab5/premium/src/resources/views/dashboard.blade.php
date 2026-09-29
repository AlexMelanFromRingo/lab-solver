<x-app-layout>
    <x-slot name="header">
        <h1>Мої роботи</h1>
        <p>Усе, що є в цьому переліку, показується на головній сторінці сайту.</p>
    </x-slot>

    @if (session('status'))
        <p class="flash" role="status">{{ session('status') }}</p>
    @endif

    <section class="panel">
        @if ($projects->isEmpty())
            <p class="empty">Робіт ще немає. Додайте першу – форма нижче.</p>
        @else
            <div class="data-wrap">
                <table class="data">
                    <thead>
                        <tr>
                            <th>Назва</th>
                            <th>Технології</th>
                            <th class="num">Рік</th>
                            <th><span class="sr-only">Дії</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($projects as $project)
                            <tr>
                                <td>
                                    <b>{{ $project->title }}</b>
                                    <span class="note">{{ Str::limit($project->description, 110) }}</span>
                                </td>
                                <td>{{ $project->stack }}</td>
                                <td class="num">{{ $project->year }}</td>
                                <td class="row-actions">
                                    <a class="btn btn-quiet" href="{{ route('projects.edit', $project) }}">Змінити</a>
                                    <form method="POST" action="{{ route('projects.destroy', $project) }}"
                                          onsubmit="event.preventDefault(); confirmDelete(this, @js($project->title))">
                                        @csrf
                                        @method('delete')
                                        <button type="submit" class="btn btn-danger">Видалити</button>
                                    </form>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @endif
    </section>

    <section class="panel">
        <h2 class="panel-title">Додати роботу</h2>
        <form method="POST" action="{{ route('projects.store') }}" class="form-grid">
            @csrf
            @include('projects.fields', ['project' => null])
            <div class="form-actions">
                <x-primary-button>Додати роботу</x-primary-button>
            </div>
        </form>
    </section>
</x-app-layout>
