<?php

namespace App\Services;

use App\Models\Position;
use App\Models\Vote;
use Illuminate\Database\Eloquent\Collection;

class PositionService
{
    /**
     * Créer un nouveau poste (réservé à l'admin).
     * La vérification du rôle est déjà faite par le middleware CheckAdmin ;
     * on la conserve ici comme garde-fou défensif.
     */
    public function create(array $data): Position
    {
        $this->requireAdmin();

        return Position::create([
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'is_active'   => $data['is_active'] ?? true,
        ]);
    }

    /**
     * Récupérer tous les postes avec leurs candidats validés et l'utilisateur associé.
     */
    public function getAll(): Collection
    {
        return Position::with([
            'candidates' => fn ($q) => $q->where('status', 'valide')->with('user'),
        ])->get();
    }

    /**
     * Mettre à jour un poste.
     */
    public function update(Position $position, array $data): bool
    {
        $this->requireAdmin();

        return $position->update($data);
    }

    /**
     * Basculer l'état actif/inactif d'un poste.
     */
    public function toggleStatus(Position $position): void
    {
        $this->requireAdmin();

        $position->is_active = !$position->is_active;

        if ($position->is_active && !$position->started_at) {
            $position->started_at = now();
        } elseif (!$position->is_active) {
            $position->started_at = null;
        }

        $position->save();
    }

    /**
     * Supprimer un poste et toutes ses données associées.
     * Ordre : votes → candidats → position (évite les erreurs de FK).
     */
    public function delete(Position $position): bool
    {
        $this->requireAdmin();

        // 1. Supprimer les votes liés aux candidats de ce poste.
        Vote::where('position_id', $position->id)->delete();

        // 2. Supprimer les candidatures.
        $position->candidates()->delete();

        // 3. Supprimer le poste.
        return (bool) $position->delete();
    }

    /**
     * Postes actuellement ouverts aux votes.
     */
    public function getActivePositions(): Collection
    {
        return Position::where('is_active', true)->get();
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function requireAdmin(): void
    {
        $user = auth('api')->user();
        if (!$user || $user->role !== 'admin') {
            throw new \Exception('Action réservée aux administrateurs.', 403);
        }
    }
}
