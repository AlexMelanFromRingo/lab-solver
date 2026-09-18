<?php

declare(strict_types=1);

use App\Http\Controllers\NoteController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
 * Маршрути веб-додатку.
 *
 * Маршрутизація ставить у відповідність адресу запиту й дію контролера.
 * Спільна дошка доступна всім, особиста сторінка та зміна нотаток – лише
 * автентифікованим користувачам, тому вони загорнуті в посередників
 * auth та verified.
 */

Route::get('/', [NoteController::class, 'index'])->name('welcome');

Route::get('/dashboard', [NoteController::class, 'usernotes'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::resource('notes', NoteController::class)
    ->only(['store', 'destroy'])
    ->middleware(['auth', 'verified']);

Route::middleware('auth')->group(function (): void {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
