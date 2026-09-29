<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Мої роботи
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            @if (session('status'))
                <div class="m-4 font-medium text-sm text-green-600">{{ session('status') }}</div>
            @endif

            <!-- Роботи користувача -->
            <div class="m-4 p-4 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="relative overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-4 py-2">N</th>
                                <th class="px-4 py-2">Назва</th>
                                <th class="px-4 py-2">Технології</th>
                                <th class="px-4 py-2">Рік</th>
                                <th class="px-4 py-2">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($projects as $project)
                                <tr class="border-b">
                                    <td class="px-4 py-2">{{ $project->id }}</td>
                                    <td class="px-4 py-2 text-gray-900">{{ $project->title }}</td>
                                    <td class="px-4 py-2">{{ $project->stack }}</td>
                                    <td class="px-4 py-2">{{ $project->year }}</td>
                                    <td class="px-4 py-2 whitespace-nowrap">
                                        <a href="{{ route('projects.edit', $project) }}" class="bg-gray-500 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md mr-1">Змінити</a>
                                        <form id="project{{ $project->id }}" method="POST" action="{{ route('projects.destroy', $project) }}" class="inline">
                                            @csrf
                                            @method('delete')
                                            <button type="button" onclick="deleteMyItem('{{ $project->id }}')" class="bg-pink-500 text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150">Видалити</button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="5" class="px-4 py-4">Робіт ще немає – додайте першу формою нижче.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Додавання роботи -->
            <div class="m-4 p-4 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Додати роботу</h3>
                <form method="POST" action="{{ route('projects.store') }}" class="space-y-4 w-2/3">
                    @csrf
                    @method('post')
                    @include('projects.fields', ['project' => null])
                    <button type="submit" class="bg-pink-500 text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150">Додати</button>
                </form>
            </div>
        </div>
    </div>
</x-app-layout>

<script>
    // Запит підтвердження перед видаленням (бібліотека SweetAlert2)
    function deleteMyItem(item) {
        Swal.fire({
            title: 'Ви впевнені?',
            html: 'Буде <b>видалено</b> роботу № ' + item + '.<br>Відновити її не вийде.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Так, видалити',
            cancelButtonText: 'Скасувати',
            confirmButtonColor: '#db2777',
            reverseButtons: false
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('project' + item).submit();
            }
        });
    }
</script>
