<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Таблиця нотаток.
 *
 * Зв'язок із користувачами – «один до багатьох»: у кожного користувача може
 * бути скільки завгодно нотаток, кожна нотатка належить одному користувачеві.
 * Зовнішній ключ оголошений з каскадним видаленням, тому разом із обліковим
 * записом зникають і його нотатки – інакше в таблиці лишалися б записи, що
 * посилаються в нікуди.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('notes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('text', 500);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notes');
    }
};
