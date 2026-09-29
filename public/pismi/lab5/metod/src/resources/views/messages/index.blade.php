<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Повідомлення
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            @if (session('status'))
                <div class="m-4 font-medium text-sm text-green-600">{{ session('status') }}</div>
            @endif

            <div class="m-4 p-4 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <div class="relative overflow-x-auto">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-4 py-2">Дата</th>
                                <th class="px-4 py-2">Від кого</th>
                                <th class="px-4 py-2">Текст</th>
                                <th class="px-4 py-2">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse ($messages as $message)
                                <tr class="border-b">
                                    <td class="px-4 py-2 whitespace-nowrap">{{ $message->created_at->format('d.m.Y H:i') }}</td>
                                    <td class="px-4 py-2">
                                        <div class="text-gray-900">{{ $message->name }}</div>
                                        <a href="mailto:{{ $message->email }}" class="underline">{{ $message->email }}</a>
                                    </td>
                                    <td class="px-4 py-2">{{ $message->text }}</td>
                                    <td class="px-4 py-2">
                                        <form id="message{{ $message->id }}" method="POST" action="{{ route('messages.destroy', $message) }}">
                                            @csrf
                                            @method('delete')
                                            <button type="button" onclick="deleteMyItem('{{ $message->id }}')" class="bg-pink-500 text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150">Видалити</button>
                                        </form>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="4" class="px-4 py-4">Повідомлень поки немає.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</x-app-layout>

<script>
    // Запит підтвердження перед видаленням (бібліотека SweetAlert2)
    function deleteMyItem(item) {
        Swal.fire({
            title: 'Ви впевнені?',
            html: 'Буде <b>видалено</b> повідомлення № ' + item + '.<br>Відновити його не вийде.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Так, видалити',
            cancelButtonText: 'Скасувати',
            confirmButtonColor: '#db2777',
            reverseButtons: false
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('message' + item).submit();
            }
        });
    }
</script>
