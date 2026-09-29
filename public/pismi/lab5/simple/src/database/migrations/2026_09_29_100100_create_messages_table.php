<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
    /**
     * Таблиця повідомлень із форми зворотного зв’язку.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('email', 150);
            $table->text('text');
            $table->timestamps();
        });
    }

    /**
     * Скасування міграції.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
