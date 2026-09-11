<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    use HasFactory;

    protected $fillable = [
        'position_id',
        'candidate_id',
        'hash_session',
    ];

    protected function casts(): array
    {
        return [
            'position_id'  => 'integer',
            'candidate_id' => 'integer',
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    /**
     * Le candidat pour lequel le vote a été exprimé (nullable = vote blanc).
     */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(Candidate::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }
}
