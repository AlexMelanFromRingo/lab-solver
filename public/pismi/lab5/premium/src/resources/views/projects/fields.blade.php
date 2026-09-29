{{-- Поля роботи: спільні для форми додавання (кабінет) і форми зміни --}}
<div class="field">
    <x-input-label for="title" value="Назва" />
    <x-text-input id="title" name="title" type="text" :value="old('title', $project?->title)" required maxlength="120" />
    <x-input-error :messages="$errors->get('title')" />
</div>

<div class="field">
    <x-input-label for="stack" value="Технології (через кому)" />
    <x-text-input id="stack" name="stack" type="text" :value="old('stack', $project?->stack)" required maxlength="160" />
    <x-input-error :messages="$errors->get('stack')" />
</div>

<div class="field field-short">
    <x-input-label for="year" value="Рік" />
    <x-text-input id="year" name="year" type="number" min="2000" max="2100" :value="old('year', $project?->year ?? date('Y'))" required />
    <x-input-error :messages="$errors->get('year')" />
</div>

<div class="field">
    <x-input-label for="url" value="Посилання (необов’язково)" />
    <x-text-input id="url" name="url" type="url" :value="old('url', $project?->url)" placeholder="https://" />
    <x-input-error :messages="$errors->get('url')" />
</div>

<div class="field field-wide">
    <x-input-label for="description" value="Опис" />
    <textarea id="description" name="description" rows="4" required maxlength="2000" class="input">{{ old('description', $project?->description) }}</textarea>
    <x-input-error :messages="$errors->get('description')" />
</div>
