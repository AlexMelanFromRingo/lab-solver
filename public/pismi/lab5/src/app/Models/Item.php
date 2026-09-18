<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Запис головного переліку сайту.
 *
 * Модель однакова для всіх тем: що саме означає кожне поле, вирішує тема.
 * Тут лише дані й правила доступу до них.
 */
class Item extends Model
{
    use HasFactory;

    /** @var list<string> */
    protected $fillable = ['theme', 'title', 'subtitle', 'meta', 'year', 'description', 'position'];

    /** @var array<string, string> */
    protected $casts = ['year' => 'integer', 'position' => 'integer'];

    /**
     * Записи однієї теми, у порядку показу.
     */
    public function scopeOfTheme(Builder $query, string $theme): Builder
    {
        return $query->where('theme', $theme)->orderBy('position')->orderBy('id');
    }
}
