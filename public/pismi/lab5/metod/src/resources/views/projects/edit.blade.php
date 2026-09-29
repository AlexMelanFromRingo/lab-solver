<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-gray-800 leading-tight">
            Зміна роботи
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="m-4 p-4 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                <form method="POST" action="{{ route('projects.update', $project) }}" class="space-y-4 w-2/3">
                    @csrf
                    @method('put')
                    @include('projects.fields', ['project' => $project])
                    <button type="submit" class="bg-pink-500 text-white active:bg-pink-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none ease-linear transition-all duration-150">Зберегти</button>
                    <a href="{{ route('dashboard') }}" class="ms-2 text-sm text-gray-600 underline">Скасувати</a>
                </form>
            </div>
        </div>
    </div>
</x-app-layout>
