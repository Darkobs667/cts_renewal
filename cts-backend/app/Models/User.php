<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'code',
        'email',
        'role',
        'password',
        'browserId',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ─── JWT ──────────────────────────────────────────────────────────────────

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Calcule le hash_session utilisé dans la table votes.
     * Centralisé ici pour éviter toute divergence entre services.
     *
     * Utilise VOTE_HASH_KEY (config('vote.hash_key')) — indépendante de APP_KEY.
     * Ainsi, une rotation de APP_KEY n'invalide pas les votes existants.
     * Fallback sur APP_KEY uniquement si VOTE_HASH_KEY n'est pas configurée
     * (rétro-compatibilité avec les votes existants en base).
     */
    public function voteHash(): string
    {
        $key = config('vote.hash_key') ?: config('app.key');
        return hash_hmac('sha256', (string) $this->id, $key);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function candidate(): HasOne
    {
        return $this->hasOne(Candidate::class);
    }

    /**
     * Retourne les votes de l'utilisateur via son hash HMAC.
     * NOTE : la table `votes` ne stocke pas `user_id` mais `hash_session` (hash HMAC de l'id).
     * Eloquent ne peut pas résoudre cette relation directement avec hasMany.
     * Utilisez Vote::where('hash_session', $user->voteHash()) à la place.
     *
     * @deprecated Utilisez $user->getVotes() ou Vote::where('hash_session', $user->voteHash())
     */
    public function getVotes(): \Illuminate\Database\Eloquent\Collection
    {
        return \App\Models\Vote::where('hash_session', $this->voteHash())->get();
    }
}
