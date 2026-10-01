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

    // ─── Private ──────────────────────────────────────────────────────────────

    /**
     * Journal d'audit — 100 dernières entrées.
     */
    public function auditLogs(): JsonResponse
    {
        $logs = \App\Models\AuditLog::with('user:id,first_name,last_name,email')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get()
            ->map(fn ($l) => [
                'id'          => $l->id,
                'action'      => $l->action,
                'target_type' => $l->target_type,
                'target_id'   => $l->target_id,
                'metadata'    => $l->metadata,
                'ip_address'  => $l->ip_address,
                'created_at'  => $l->created_at?->toIso8601String(),
                'admin'       => $l->user
                    ? $l->user->first_name . ' ' . $l->user->last_name
                    : 'Système',
            ]);

        return response()->json(['success' => true, 'data' => $logs]);
    }

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
