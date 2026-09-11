<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\Vote;
use Illuminate\Database\Eloquent\Collection;

class CandidatService
{
    public function __construct(private readonly CandidatePhotoService $photoService) {}

    // ─── Écriture ─────────────────────────────────────────────────────────────

    /**
     * Créer un candidat (admin uniquement).
     * photo_path et photo_public_id sont des chaînes alphanumériques/URLs Cloudinary.
     */
    public function create(array $data): Candidate
    {
        $this->requireAdmin();

        return Candidate::create([
            'user_id'         => $data['user_id'],
            'position_id'     => $data['position_id'],
            'bio'             => $data['bio'] ?? null,
            'slogan'          => $data['slogan'] ?? null,
            'status'          => $data['status'] ?? 'valide',
            'photo_path'      => $data['photo_path'] ?? null,      // URL Cloudinary (string)
            'photo_public_id' => $data['photo_public_id'] ?? null, // ID Cloudinary (string)
        ]);
    }

    /**
     * Mettre à jour un candidat (admin ou propriétaire).
     */
    public function update(Candidate $candidate, array $data): bool
    {
        $user = auth('api')->user();

        if (!$user) {
            throw new \Exception('Non authentifié.', 401);
        }

        if ($candidate->user_id !== $user->id && $user->role !== 'admin') {
            throw new \Exception('Action non autorisée.', 403);
        }

        return $candidate->update($data);
    }

    /**
     * Profil candidat de l'utilisateur connecté.
     */
    public function getProfile(): ?Candidate
    {
        $user = auth('api')->user();

        if (!$user) {
            throw new \Exception('Non authentifié.', 401);
        }

        return Candidate::with(['user', 'position'])
            ->where('user_id', $user->id)
            ->first();
    }

    /**
     * Liste complète des candidats (admin = tous, autres = validés).
     */
    public function getAll(): Collection
    {
        $user = auth('api')->user();

        if (!$user) {
            throw new \Exception('Non authentifié.', 401);
        }

        $query = Candidate::with(['user', 'position']);

        if ($user->role !== 'admin') {
            $query->where('status', 'valide');
        }

        return $query->get();
    }

    /**
     * Supprimer un candidat et ses votes.
     * La photo Cloudinary est supprimée via son public_id (alphanumérique).
     * Aucun fichier local n'est manipulé : tout passe par Cloudinary.
     */
    public function delete(Candidate $candidate): bool
    {
        $this->requireAdmin();

        // Supprimer les votes liés à ce candidat.
        Vote::where('candidate_id', $candidate->id)->delete();

        // Supprimer la photo sur Cloudinary si un public_id est enregistré.
        if ($candidate->photo_public_id) {
            $this->photoService->delete($candidate->photo_public_id);
        }

        return (bool) $candidate->delete();
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
