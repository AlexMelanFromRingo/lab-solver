<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Повідомлення, надіслане відвідувачем через форму зворотного зв'язку.
 */
class Message extends Model
{
    /**
     * Поля, які дозволено заповнювати масово.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'text',
    ];
}
