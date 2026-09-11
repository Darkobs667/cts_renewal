<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;
use App\Models\User;
use App\Models\Vote;
use App\Traits\Cacheable;
use Illuminate\Http\JsonResponse;

class AdminController extends Controller
{
    use Cacheable;

    protected int $statsCacheTtl = 300; // 5 minutes

    /**
     * Statistiques globales du tableau de bord admin (avec cache).
     */
    public function getStats(): JsonResponse
    {
        $stats = $this->rememberCache('admin_global_stats', function () {
            return $this->computeStats();
        }, $this->statsCacheTtl);

        return response()->json([
            'success' => true,
            'message' => 'Statistiques récupérées',
            'data'    => $stats,
        ]);
    }

    /**
     * Force le recalcul des statistiques en vidant le cache, puis les retourne.
     * Correction #14 : participation calculée correctement (était figée à 0).
     */
    public function refreshStats(): JsonResponse
    {
        $this->forgetCache('admin_global_stats');

        $stats = $this->computeStats();

        return response()->json([
            'success' => true,
            'message' => 'Cache des statistiques rafraîchi',
            'data'    => $stats,
        ]);
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function computeStats(): array
    {
        $totalInscrits      = User::where('role', 'electeur')->count();
        $votesEnCours       = Position::where('is_active', 1)->count();
        $votesClotures      = Position::where('is_active', 0)->count();
        $totalVotesUnique   = Vote::distinct('hash_session')->count('hash_session');

        $participation = $totalInscrits > 0
            ? round(($totalVotesUnique / $totalInscrits) * 100)
            : 0;

        return [
            'totalInscrits' => $totalInscrits,
            'votesClotures' => $votesClotures,
            'votesEnCours'  => $votesEnCours,
            'participation' => $participation,
        ];
    }
}
