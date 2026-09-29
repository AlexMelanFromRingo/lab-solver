<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;

/**
 * Роботи на сторінці-візитці.
 *
 * Відвідувачі бачать перелік усіх робіт на головній сторінці, а власник
 * після входу керує своїми роботами в кабінеті: додає, змінює, видаляє.
 */
class ProjectController extends Controller
{
    /**
     * Правила перевірки полів роботи, спільні для додавання та зміни.
     */
    private const RULES = [
        'title' => 'required|string|max:120',
        'stack' => 'required|string|max:160',
        'description' => 'required|string|max:2000',
        'year' => 'required|integer|between:2000,2100',
        'url' => 'nullable|url|max:255',
    ];

    /**
     * Головна сторінка: візитка з переліком робіт.
     */
    public function index(): View
    {
        $projects = Project::with('user')->orderBy('year')->orderBy('id')->get();

        return view('welcome', compact('projects'));
    }

    /**
     * Кабінет: роботи користувача, який увійшов, і форма додавання.
     */
    public function userProjects(): View
    {
        $user = User::findOrFail(Auth::id());
        $projects = Project::whereBelongsTo($user)->orderBy('year')->orderBy('id')->get();

        return view('dashboard', compact('projects'));
    }

    /**
     * Додавання роботи з форми в кабінеті.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(self::RULES);
        $data['user_id'] = Auth::id();

        Project::create($data);

        return redirect()->route('dashboard')->with('status', 'Роботу додано.');
    }

    /**
     * Форма зміни роботи.
     */
    public function edit(Project $project): View
    {
        $this->checkOwner($project);

        return view('projects.edit', compact('project'));
    }

    /**
     * Збереження змін у роботі.
     */
    public function update(Request $request, Project $project): RedirectResponse
    {
        $this->checkOwner($project);

        $project->update($request->validate(self::RULES));

        return redirect()->route('dashboard')->with('status', 'Зміни збережено.');
    }

    /**
     * Видалення роботи.
     */
    public function destroy(Project $project): RedirectResponse
    {
        $this->checkOwner($project);

        $project->delete();

        return redirect()->route('dashboard')->with('status', 'Роботу видалено.');
    }

    /**
     * Змінювати та видаляти роботу може лише той, хто її додав.
     */
    private function checkOwner(Project $project): void
    {
        abort_unless($project->user->is(Auth::user()), 403);
    }
}
