<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
     */
    public function voteHash(): string
    {
        return hash_hmac('sha256', (string) $this->id, config('app.key'));
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function candidate(): HasOne
    {
        return $this->hasOne(Candidate::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(Vote::class, 'hash_session', 'id');
        // NOTE : Vote ne stocke pas user_id ; utiliser Vote::where('hash_session', $user->voteHash())
    }
}
