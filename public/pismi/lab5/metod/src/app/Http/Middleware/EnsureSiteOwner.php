<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Пропускає до кабінету лише власника сайту.
 *
 * Будь-хто інший, хто якимось чином увійшов, одразу виходить і бачить
 * сторінку входу з поясненням.
 */
class EnsureSiteOwner
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->isOwner()) {
            return $next($request);
        }

        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')
            ->withErrors(['email' => 'Кабінет доступний лише власнику сайту.']);
    }
}
