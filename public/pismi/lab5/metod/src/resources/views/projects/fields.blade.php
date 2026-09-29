{{-- Поля роботи: спільні для форми додавання (кабінет) і форми зміни --}}
<div>
    <x-input-label for="title" value="Назва" />
    <x-text-input id="title" name="title" type="text" class="mt-1 block w-full" :value="old('title', $project?->title)" required />
    <x-input-error :messages="$errors->get('title')" class="mt-2" />
</div>
<div>
    <x-input-label for="stack" value="Технології" />
    <x-text-input id="stack" name="stack" type="text" class="mt-1 block w-full" :value="old('stack', $project?->stack)" required />
    <x-input-error :messages="$errors->get('stack')" class="mt-2" />
</div>
<div>
    <x-input-label for="year" value="Рік" />
    <x-text-input id="year" name="year" type="number" class="mt-1 block w-full" :value="old('year', $project?->year ?? date('Y'))" required />
    <x-input-error :messages="$errors->get('year')" class="mt-2" />
</div>
<div>
    <x-input-label for="url" value="Посилання (необов’язково)" />
    <x-text-input id="url" name="url" type="url" class="mt-1 block w-full" :value="old('url', $project?->url)" />
    <x-input-error :messages="$errors->get('url')" class="mt-2" />
</div>
<div>
    <x-input-label for="description" value="Опис" />
    <textarea id="description" name="description" rows="3" required class="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm">{{ old('description', $project?->description) }}</textarea>
    <x-input-error :messages="$errors->get('description')" class="mt-2" />
</div>
