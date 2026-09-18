<x-site-layout :theme="$theme" :options="$options">

    {{-- Перший екран: ім'я власника, коротке пояснення і три показники --}}
    <section class="mx-auto max-w-sheet px-6 pb-16 pt-20">
        <p class="mb-5 text-sm text-faint">{{ $theme['hero']['eyebrow'] }}</p>
        <h1 class="max-w-[16ch] text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            {{ $theme['hero']['title'] }}
        </h1>
        <p class="mt-7 max-w-[60ch] text-lg leading-relaxed text-dim">{{ $theme['hero']['lede'] }}</p>

        <dl class="mt-12 grid gap-8 border-t hairline pt-8 sm:grid-cols-3">
            @foreach ($theme['hero']['stats'] as [$label, $value])
                <div>
                    <dt class="text-[0.8125rem] text-faint">{{ $label }}</dt>
                    <dd class="mt-1.5 font-mono text-2xl font-medium tabular-nums text-accent">{{ $value }}</dd>
                </div>
            @endforeach
        </dl>
    </section>

    {{-- Головний перелік. Набраний як реєстр: рядки з волосяними лініями --}}
    <section id="collection" class="mx-auto max-w-sheet px-6 py-16">
        <div class="mb-10 flex flex-wrap items-baseline justify-between gap-4">
            <h2 class="text-3xl font-semibold tracking-tight">{{ $theme['collection']['title'] }}</h2>
            <p class="text-sm text-faint">{{ $theme['collection']['lede'] }}</p>
        </div>

        @if ($items->isEmpty())
            <p class="text-dim">Записів ще немає.</p>
        @else
            <div class="border-t hairline">
                <div class="ledger-row hidden text-[0.8125rem] text-faint md:grid">
                    <span></span>
                    <span>{{ $theme['collection']['labels']['title'] }}</span>
                    <span>{{ $theme['collection']['labels']['meta'] }}</span>
                    <span class="text-right">{{ $theme['collection']['labels']['year'] }}</span>
                </div>

                @foreach ($items as $index => $item)
                    <article class="ledger-row">
                        <span class="text-right font-mono text-sm tabular-nums text-faint">
                            {{ str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) }}
                        </span>
                        <div class="min-w-0">
                            <h3 class="text-xl font-semibold tracking-tight">
                                <a href="{{ route('item.show', $item) }}" class="hover:text-accent">{{ $item->title }}</a>
                            </h3>
                            <p class="mt-1 text-sm text-faint">{{ $item->subtitle }}</p>
                            <p class="mt-2 max-w-[70ch] text-dim">{{ $item->description }}</p>
                        </div>
                        <span class="text-sm text-dim">{{ $item->meta }}</span>
                        <span class="font-mono tabular-nums text-accent md:text-right">{{ $item->year }}</span>
                    </article>
                @endforeach
            </div>
        @endif
    </section>

    {{-- Блок «про»: текст ліворуч, короткі відомості праворуч --}}
    <section id="about" class="mx-auto max-w-sheet px-6 py-16">
        <div class="grid gap-12 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div>
                <h2 class="mb-6 text-3xl font-semibold tracking-tight">{{ $theme['about']['title'] }}</h2>
                @foreach ($theme['about']['paragraphs'] as $paragraph)
                    <p class="mb-5 max-w-[68ch] leading-relaxed text-dim">{{ $paragraph }}</p>
                @endforeach
            </div>

            <dl class="panel h-fit px-7 py-6 text-sm">
                @foreach ($theme['about']['facts'] as [$label, $value])
                    <dt class="text-faint">{{ $label }}</dt>
                    <dd class="mb-4 last:mb-0">{{ $value }}</dd>
                @endforeach
            </dl>
        </div>
    </section>

    {{-- Форма зворотного зв'язку --}}
    <section id="contact" class="mx-auto max-w-sheet px-6 py-16">
        <div class="panel px-9 py-9">
            <h2 class="mb-2 text-3xl font-semibold tracking-tight">{{ $theme['contact']['title'] }}</h2>
            <p class="mb-8 max-w-[60ch] text-dim">{{ $theme['contact']['lede'] }}</p>

            <form method="POST" action="{{ route('contact.store') }}" class="grid max-w-3xl gap-5">
                @csrf
                <div class="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label for="name" class="mb-1.5 block text-[0.8125rem] text-faint">Як до вас звертатися</label>
                        <input id="name" name="name" type="text" class="field-input" value="{{ old('name') }}" required>
                        @error('name') <p class="mt-1.5 text-[0.8125rem] text-[#d9634e]">{{ $message }}</p> @enderror
                    </div>
                    <div>
                        <label for="email" class="mb-1.5 block text-[0.8125rem] text-faint">Адреса для відповіді</label>
                        <input id="email" name="email" type="email" class="field-input" value="{{ old('email') }}" required>
                        @error('email') <p class="mt-1.5 text-[0.8125rem] text-[#d9634e]">{{ $message }}</p> @enderror
                    </div>
                </div>
                <div>
                    <label for="body" class="mb-1.5 block text-[0.8125rem] text-faint">Повідомлення</label>
                    <textarea id="body" name="body" rows="5" class="field-input" required>{{ old('body') }}</textarea>
                    @error('body') <p class="mt-1.5 text-[0.8125rem] text-[#d9634e]">{{ $message }}</p> @enderror
                </div>
                <div>
                    <button type="submit" class="btn">Надіслати</button>
                </div>
            </form>
        </div>
    </section>

</x-site-layout>
