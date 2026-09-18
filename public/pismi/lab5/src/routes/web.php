<?php

declare(strict_types=1);

use App\Http\Controllers\ItemController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SiteController;
use Illuminate\Support\Facades\Route;

/*
 * Маршрути сайту.
 *
 * Публічна частина доступна всім, керування записами та скринька – лише
 * після входу. Автентифікацію забезпечує Laravel Breeze, її власні маршрути
 * підключаються в кінці файла.
 */

Route::get('/', [SiteController::class, 'index'])->name('home');
Route::get('/item/{item}', [SiteController::class, 'show'])->name('item.show');
Route::post('/contact', [MessageController::class, 'store'])->name('contact.store');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::resource('items', ItemController::class)->except(['show']);

    Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
    Route::patch('/messages/{message}', [MessageController::class, 'markRead'])->name('messages.read');
    Route::delete('/messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');
});

Route::middleware('auth')->group(function (): void {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';
