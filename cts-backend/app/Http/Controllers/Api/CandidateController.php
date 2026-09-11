<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Services\CandidatService;
use App\Services\CandidatePhotoService;
use App\Traits\Cacheable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Gestion des candidatures.
 *
 * Principe BDD alphanumérique uniquement :
 *  - photo_path      → URL HTTPS Cloudinary stockée en VARCHAR
 *  - photo_public_id → identifiant Cloudinary stocké en VARCHAR
 * Aucun blob binaire n'est jamais inséré en base. Les fichiers binaires
 * sont envoyés directement à Cloudinary ; seule l'URL retournée est persistée.
 */
class CandidateController extends Controller
{
    use Cacheable;

    protected int $cacheTtl = 300; // 5 minutes

    public function __construct(
        private readonly CandidatService       $candidatService,
        private readonly CandidatePhotoService $photoService,
    ) {}

    // ─── Lecture ──────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $positionId = $request->get('position_id', 'all');
        $perPage    = min(max($request->integer('per_page', 20), 1), 50);
        $page       = max($request->integer('page', 1), 1);
        $status     = $request->get('status', 'valide');

        if (!in_array($status, ['valide', 'en_attente', 'refuse'], true)) {
            return response()->json(['message' => 'Statut de candidature invalide.'], 422);
        }

        if ($status !== 'valide' && auth('api')->user()?->role !== 'admin') {
            return response()->json(['message' => 'Accès administrateur requis.'], 403);
        }

        $cacheKey = 'candidates:v' . $this->cacheVersion('candidates')
            . ":pos_{$positionId}:status_{$status}:page_{$page}:per_page_{$perPage}";

        $candidates = $this->rememberCache($cacheKey, function () use ($request, $status, $perPage) {
            $query = Candidate::with('user', 'position');

            if ($request->has('position_id')) {
                $query->where('position_id', $request->integer('position_id'));
            }

            return $query->where('status', $status)
                         ->orderByDesc('id')
                         ->paginate($perPage)
                         ->toArray();
        }, $this->cacheTtl);

        return response()->json([
            'success' => true,
            'data'    => $candidates['data'],
            'meta'    => collect($candidates)->except('data')->all(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $candidate = Candidate::with(['user', 'position'])->findOrFail($id);

        if ($candidate->status !== 'valide' && auth('api')->user()?->role !== 'admin') {
            abort(404);
        }

        return response()->json(['success' => true, 'data' => $candidate]);
    }

    // ─── Écriture (admin) ─────────────────────────────────────────────────────

    /**
     * Créer une candidature (admin).
     * La photo est uploadée sur Cloudinary ; seule l'URL (string) est stockée en BDD.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'     => 'required|exists:users,id',
            'position_id' => 'required|exists:positions,id',
            'slogan'      => 'nullable|string|max:255',
            'bio'         => 'nullable|string|max:5000',
            'photo'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('photo')) {
            $data = array_merge($data, $this->uploadPhoto($request->file('photo')));
        }

        $candidate = $this->candidatService->create($data);

        $this->invalidateCandidateCache();
        $this->forgetCache('admin_global_stats');

        return response()->json(['message' => 'Candidat créé avec succès.', 'data' => $candidate], 201);
    }

    /**
     * Mettre à jour une candidature (admin).
     * Si une nouvelle photo est fournie, l'ancienne est supprimée sur Cloudinary
     * avant d'être remplacée — la BDD ne conserve que la nouvelle URL.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);

        $data = $request->validate([
            'user_id'     => 'sometimes|exists:users,id',
            'position_id' => 'sometimes|exists:positions,id',
            'slogan'      => 'nullable|string|max:255',
            'bio'         => 'nullable|string|max:5000',
            'photo'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $oldPublicId = $candidate->photo_public_id;

        if ($request->hasFile('photo')) {
            $data = array_merge($data, $this->uploadPhoto($request->file('photo')));
        }

        $this->candidatService->update($candidate, $data);

        // Supprimer l'ancienne photo Cloudinary après mise à jour réussie.
        if ($request->hasFile('photo') && $oldPublicId) {
            $this->photoService->delete($oldPublicId);
        }

        $this->invalidateCandidateCache($id);
        $this->forgetCache('admin_global_stats');

        return response()->json([
            'message' => 'Candidat mis à jour avec succès.',
            'data'    => $candidate->fresh(['user', 'position']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);
        $result    = $this->candidatService->delete($candidate);

        if ($result) {
            $this->invalidateCandidateCache($id);
            $this->forgetCache('admin_global_stats');
            return response()->json(['message' => 'Candidat supprimé avec succès.']);
        }

        return response()->json(['message' => 'Erreur lors de la suppression.'], 500);
    }

    public function approve(int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);

        if ($candidate->status !== 'en_attente') {
            return response()->json(['message' => 'Ce candidat n\'est pas en attente.'], 400);
        }

        $candidate->status = 'valide';
        $candidate->save();

        $this->invalidateCandidateCache($id);
        $this->forgetCache('admin_global_stats');

        return response()->json(['message' => 'Candidature validée.']);
    }

    public function reject(int $id): JsonResponse
    {
        $candidate = Candidate::findOrFail($id);

        if ($candidate->status !== 'en_attente') {
            return response()->json(['message' => 'Ce candidat n\'est pas en attente.'], 400);
        }

        $candidate->status = 'refuse';
        $candidate->save();

        $this->invalidateCandidateCache($id);
        $this->forgetCache('admin_global_stats');

        return response()->json(['message' => 'Candidature refusée.']);
    }

    // ─── Postuler (électeur) ──────────────────────────────────────────────────

    /**
     * Un électeur soumet sa propre candidature.
     * Si une photo est jointe, elle est envoyée à Cloudinary ; seule l'URL est stockée.
     */
    public function apply(Request $request): JsonResponse
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'position_id' => 'required|exists:positions,id',
            'bio'         => 'nullable|string|max:5000',
            'slogan'      => 'nullable|string|max:255',
            'photo'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $existing = Candidate::where('user_id', $user->id)
                              ->where('position_id', $request->integer('position_id'))
                              ->exists();

        if ($existing) {
            return response()->json(['message' => 'Vous avez déjà postulé à ce poste.'], 409);
        }

        $data = $request->only('position_id', 'bio', 'slogan');
        $data['user_id'] = $user->id;
        $data['status']  = 'en_attente';

        if ($request->hasFile('photo')) {
            $data = array_merge($data, $this->uploadPhoto($request->file('photo')));
        }

        $candidate = Candidate::create($data);

        $this->invalidateCandidateCache();
        $this->forgetCache('admin_global_stats');

        return response()->json([
            'message' => 'Votre candidature a été enregistrée. Elle sera examinée par l\'administration.',
            'data'    => $candidate,
        ], 201);
    }

    // ─── Helpers privés ───────────────────────────────────────────────────────

    /**
     * Upload la photo sur Cloudinary et retourne les champs BDD (strings alphanumériques).
     * Aucun binaire n'est jamais inséré en base.
     *
     * @return array{photo_path: string, photo_public_id: string|null}
     */
    private function uploadPhoto(\Illuminate\Http\UploadedFile $photo): array
    {
        $asset = $this->photoService->upload($photo);

        return [
            'photo_path'      => $asset['secure_url'],  // URL HTTPS (string)
            'photo_public_id' => $asset['public_id'],   // ID Cloudinary (string)
        ];
    }

    /**
     * Correction #8 : invalide le cache versionné ET la clé individuelle si fournie.
     */
    private function invalidateCandidateCache(?int $id = null): void
    {
        $this->bumpCacheVersion('candidates');

        if ($id !== null) {
            $this->forgetCache("candidate_{$id}");
        }
    }
}
