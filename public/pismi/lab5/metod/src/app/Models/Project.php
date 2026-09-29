<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Робота з переліку на сторінці-візитці.
 *
 * Кожна робота належить користувачу, який її додав: таблиці users та
 * projects пов’язані відношенням «один до багатьох».
 */
class Project extends Model
{
    /**
     * Поля, які дозволено заповнювати масово (Project::create, update).
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'title',
        'stack',
        'description',
        'year',
        'url',
    ];

    /**
     * Користувач, який додав роботу.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
