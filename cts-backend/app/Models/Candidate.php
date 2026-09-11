<?php

namespace App\Models;

use App\Services\CandidatePhotoService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Candidate extends Model
{
    use HasFactory;

    /**
     * La BDD ne stocke que des données alphanumériques :
     * - photo_path    → URL HTTPS Cloudinary (string)
     * - photo_public_id → identifiant Cloudinary (string alphanumérique)
     * Aucun blob binaire, aucun fichier n'est stocké en base.
     */
    protected $fillable = [
        'user_id',
        'position_id',
        'bio',
        'slogan',
        'status',
        'photo_path',
        'photo_public_id',
    ];

    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return [
            'user_id'     => 'integer',
            'position_id' => 'integer',
        ];
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Retourne l'URL de livraison optimisée (Cloudinary f_auto/q_auto)
     * ou null si aucune photo n'est associée.
     * La valeur calculée est une simple chaîne alphanumérique/URL.
     */
    public function getPhotoUrlAttribute(): ?string
    {
        return CandidatePhotoService::deliveryUrl($this->photo_path);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    /**
     * Utilisée avec withCount('votes') pour optimiser les résultats.
     */
    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class);
    }
}
