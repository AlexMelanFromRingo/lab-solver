<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Таблиця робіт. Кожна робота пов’язана з користувачем через user_id:
     * один користувач – багато робіт.
     */
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            // Власник роботи; разом із користувачем видаляються і його роботи
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 120);
            $table->string('stack', 160);
            $table->text('description');
            $table->unsignedSmallInteger('year');
            $table->string('url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Скасування міграції.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
