<?php

use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Middleware\EnsureSiteOwner;
use Illuminate\Support\Facades\Route;

// Головна сторінка – візитка з переліком робіт
Route::get('/', [ProjectController::class, 'index'])->name('welcome');

// Форма зворотного зв’язку відкрита всім; не частіше 5 повідомлень за хвилину
Route::post('/messages', [MessageController::class, 'store'])
    ->middleware('throttle:5,1')->name('messages.store');

// Кабінет – лише для власника сайту (першого зареєстрованого користувача)
Route::middleware(['auth', 'verified', EnsureSiteOwner::class])->group(function () {
    // власні роботи та форма додавання
    Route::get('/dashboard', [ProjectController::class, 'userProjects'])->name('dashboard');

    // керування роботами та повідомленнями
    Route::resource('projects', ProjectController::class)
        ->only(['store', 'edit', 'update', 'destroy']);
    Route::resource('messages', MessageController::class)
        ->only(['index', 'destroy']);
});

Route::middleware(['auth', EnsureSiteOwner::class])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
