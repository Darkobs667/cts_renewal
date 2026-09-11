<?php

namespace App\Services;

use App\Models\Position;
use App\Models\Vote;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VoteService
{
    /**
     * Enregistrer un vote pour un candidat sur un poste spécifique.
     * Utilise exclusivement le hash HMAC de l'ID utilisateur — jamais l'email.
     */
    public function castVote(int $positionId, ?int $candidateId): Vote
    {
        $user = auth('api')->user();
        if (!$user) {
            throw new \Exception('Utilisateur non authentifié', 401);
        }

        $voteHash = $user->voteHash();

        $existing = Vote::where('position_id', $positionId)
                        ->where('hash_session', $voteHash)
                        ->exists();

        if ($existing) {
            throw new \Exception('Vous avez déjà voté pour ce poste.', 409);
        }

        return Vote::create([
            'position_id'  => $positionId,
            'candidate_id' => $candidateId,
            'hash_session' => $voteHash,
        ]);
    }

    /**
     * Résultats pour tous les postes actifs, ou pour un poste précis si $positionId est fourni.
     * Correction #9 : le filtre par position_id est maintenant effectif.
     */
    public function getResults(?int $positionId = null): Collection
    {
        $query = Position::with([
                'candidates' => function ($q) {
                    $q->where('status', 'valide')
                      ->withCount('votes')
                      ->with('user');
                },
            ])
            ->withCount('votes')
            ->where('is_active', true);

        if ($positionId !== null) {
            $query->where('id', $positionId);
        }

        return $query->get()
            ->map(function (Position $position) {
                return [
                    'id'          => $position->id,
                    'title'       => $position->title,
                    'is_active'   => $position->is_active,
                    'started_at'  => $position->started_at,
                    'total_votes' => $position->votes_count,
                    'candidates'  => $position->candidates
                        ->map(function ($candidate) {
                            $fullName = $candidate->user
                                ? trim($candidate->user->first_name . ' ' . $candidate->user->last_name)
                                : 'Candidat inconnu';

                            return [
                                'id'          => $candidate->id,
                                'name'        => $fullName,
                                'votes_count' => $candidate->votes_count,
                                'bio'         => $candidate->bio,
                                'slogan'      => $candidate->slogan,
                            ];
                        })
                        ->sortByDesc('votes_count')
                        ->values(),
                ];
            })
            ->sortByDesc('total_votes')
            ->values();
    }

    /**
     * Renvoie les IDs des postes pour lesquels l'utilisateur connecté a déjà voté.
     */
    public function getUserVotes(): Collection
    {
        $user = auth('api')->user();
        if (!$user) {
            return collect();
        }

        return Vote::where('hash_session', $user->voteHash())
                   ->pluck('position_id');
    }
}
