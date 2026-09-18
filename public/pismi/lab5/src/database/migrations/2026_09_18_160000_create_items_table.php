<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Записи головного переліку сайту.
 *
 * Таблиця спільна для всіх тем: стовпець theme відділяє записи одного сайту
 * від іншого. Підписи стовпців задає тема, тому «title» – це і назва проєкту
 * в портфоліо, і прізвище пілота в довіднику Формули-1.
 */
return new class () extends Migration {
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table): void {
            $table->id();
            $table->string('theme', 32)->index();
            $table->string('title', 160);
            $table->string('subtitle', 160);
            $table->string('meta', 80);
            $table->integer('year');
            $table->text('description');
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
