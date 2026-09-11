<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\CandidateController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VoteController;
use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ── Health / utilitaires ─────────────────────────────────────────────────────

Route::get('/health', function () {
    return response()->json([
        'status'   => 'ok',
        'time'     => now()->toIso8601String(),
        'memory'   => memory_get_usage(),
        'database' => DB::connection()->getPdo() ? 'connected' : 'error',
    ]);
});

Route::get('/ping', fn () => response()->json(['message' => 'pong']));

// Keep-alive pour Render (évite la mise en veille du free tier).
// Correction #12 : une seule déclaration (GET + HEAD).
Route::match(['GET', 'HEAD'], '/keep-alive', fn () => response('OK', 200)
    ->header('Content-Type', 'text/plain')
    ->header('Cache-Control', 'no-cache'));

// ── Publiques ─────────────────────────────────────────────────────────────────

Route::get('/votes/results/all', [VoteController::class, 'allResults']);
Route::get('/votes/results/pdf', [VoteController::class, 'exportPDF']);

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/refresh',  [AuthController::class, 'refresh'])->middleware('throttle:refresh');

Route::get('/positions', [PositionController::class, 'index']);
Route::get('/candidates', [CandidateController::class, 'index']);
Route::get('/votes/results', [VoteController::class, 'results']);

// ── Protégées (JWT) ───────────────────────────────────────────────────────────

Route::middleware('auth:api')->group(function () {

    // Auth
    Route::post('/logout',           [AuthController::class, 'logout']);
    Route::get('/auth/me',           [AuthController::class, 'me']);
    Route::get('/auth/verify-role',  [AuthController::class, 'verifyRole']);
    Route::get('/auth/check-admin',  [AuthController::class, 'checkAdmin']);

    // Stats globales (admin)
    Route::get('/admin/stats-globales', [AdminController::class, 'getStats'])->middleware('admin');

    // Positions (lecture libre, écriture admin)
    Route::get('/positions/{id}',    [PositionController::class, 'show']);
    Route::post('/positions',        [PositionController::class, 'store'])->middleware(['admin', 'throttle:admin-write']);
    Route::put('/positions/{id}',    [PositionController::class, 'update'])->middleware(['admin', 'throttle:admin-write']);
    Route::delete('/positions/{id}', [PositionController::class, 'destroy'])->middleware(['admin', 'throttle:admin-write']);

    // Candidats (lecture libre, écriture admin)
    Route::get('/candidates/{id}',            [CandidateController::class, 'show']);
    Route::post('/candidates',                [CandidateController::class, 'store'])->middleware(['admin', 'throttle:upload']);
    Route::put('/candidates/{id}',            [CandidateController::class, 'update'])->middleware(['admin', 'throttle:upload']);
    Route::delete('/candidates/{id}',         [CandidateController::class, 'destroy'])->middleware(['admin', 'throttle:admin-write']);
    Route::put('/candidates/{id}/approve',    [CandidateController::class, 'approve'])->middleware(['admin', 'throttle:admin-write']);
    Route::put('/candidates/{id}/reject',     [CandidateController::class, 'reject'])->middleware(['admin', 'throttle:admin-write']);

    // Postuler (électeur)
    Route::post('/apply', [CandidateController::class, 'apply'])->middleware(['electeur', 'throttle:application', 'throttle:upload']);

    // Utilisateurs (admin)
    Route::get('/users',                       [UserController::class, 'index'])->middleware('admin');
    Route::put('/users/{id}/reset-password',   [UserController::class, 'resetPassword'])->middleware('admin');
    // Correction #7 : route pour modifier le statut d'un électeur
    Route::put('/users/{id}/status',           [UserController::class, 'updateStatus'])->middleware('admin');
    Route::delete('/users/{id}',               [UserController::class, 'destroy'])->middleware('admin');

    // Votes
    Route::post('/votes',                     [VoteController::class, 'store'])->middleware(['electeur', 'throttle:vote']);
    Route::post('/votes/batch',               [VoteController::class, 'batchStore'])->middleware(['electeur', 'throttle:vote']);
    Route::get('/votes/my',                   [VoteController::class, 'myVotes'])->middleware('electeur');
    Route::get('/votes/check/{positionId}',   [VoteController::class, 'checkVote'])->middleware('electeur');
    Route::get('/voter/receipt/{voteId}',     [VoteController::class, 'receipt'])->middleware('electeur');
});
