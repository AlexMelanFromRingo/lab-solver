<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Нотатка на спільній дошці повідомлень.
 *
 * Модель у схемі MVC відповідає за дані та правила роботи з ними: вона не
 * знає ні про сторінки, ні про запити. Тут це зводиться до двох речей –
 * переліку полів, які дозволено заповнювати масово, та зв'язку з автором.
 */
class Note extends Model
{
    use HasFactory;

    /**
     * Поля, які можна заповнити одним викликом create().
     *
     * Перелік навмисно короткий: якщо дозволити заповнювати все, форма з
     * підробленим полем могла б підмінити, наприклад, ідентифікатор автора.
     *
     * @var list<string>
     */
    protected $fillable = ['user_id', 'text'];

    /**
     * Автор нотатки.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
