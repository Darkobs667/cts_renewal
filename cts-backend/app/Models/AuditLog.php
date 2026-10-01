<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'action',
        'target_type',
        'target_id',
        'metadata',
        'ip_address',
    ];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Enregistre une action admin dans le journal d'audit.
     */
    public static function record(
        string  $action,
        ?string $targetType = null,
        ?int    $targetId   = null,
        array   $metadata   = [],
    ): self {
        return static::create([
            'user_id'     => auth('api')->id(),
            'action'      => $action,
            'target_type' => $targetType,
            'target_id'   => $targetId,
            'metadata'    => $metadata ?: null,
            'ip_address'  => request()->ip(),
        ]);
    }
}
