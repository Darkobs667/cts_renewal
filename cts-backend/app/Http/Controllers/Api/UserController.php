<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 50), 10), 100);
        $search  = $request->get('search', '');

        $query = User::select('id', 'first_name', 'last_name', 'email', 'role', 'status');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name',  'like', "%{$search}%")
                  ->orWhere('email',      'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => collect($paginated->items())->map(fn (User $user) => [
                'id'     => $user->id,
                'nom'    => trim($user->first_name . ' ' . $user->last_name),
                'email'  => $user->email,
                'role'   => $user->role,
                'status' => $user->status ?? 'Validé',
            ]),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

    /**
     * Modifier le statut d'un utilisateur (admin seulement).
     * Valeurs acceptées : 'Validé' | 'Suspendu'
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => 'required|string|in:Validé,Suspendu',
        ]);

        $user = User::findOrFail($id);
        $user->status = $request->status;
        $user->save();

        \App\Models\AuditLog::record('user.status_update', 'User', $user->id, [
            'status' => $request->status,
            'email'  => $user->email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Statut mis à jour.',
            'data'    => ['id' => $user->id, 'status' => $user->status],
        ]);
    }

    /**
     * Réinitialiser le mot de passe d'un utilisateur (admin seulement).
     * Retourne le mot de passe temporaire dans la réponse — l'admin
     * doit le communiquer à l'électeur par un canal sécurisé (oral, messagerie privée).
     * Ce comportement est acceptable car la route est réservée aux admins authentifiés.
     */
    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $newPassword = Str::random(12);
        $user->password = Hash::make($newPassword);
        $user->save();

        \App\Models\AuditLog::record('user.password_reset', 'User', $user->id, [
            'email' => $user->email,
        ]);

        return response()->json([
            'message'            => 'Mot de passe réinitialisé avec succès.',
            'temporary_password' => $newPassword,
        ]);
    }

    /**
     * Supprimer un utilisateur et toutes ses données associées.
     */
    public function destroy(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Calcule le même hash que celui utilisé lors du vote.
        $voteHash = $user->voteHash();

        // Supprimer les votes liés via le hash HMAC (et non l'email).
        Vote::where('hash_session', $voteHash)->delete();

        // Supprimer les candidatures de l'utilisateur.
        Candidate::where('user_id', $user->id)->delete();

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }
}
