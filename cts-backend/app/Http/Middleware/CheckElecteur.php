<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckElecteur
{
    /**
     * Restrict voter-only endpoints using the authenticated JWT user.
     * Never rely on a role submitted by the client.
     * Also checks that the voter account is active (status = 'Validé').
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth('api')->user();

        if (!$user || $user->role !== 'electeur') {
            return response()->json([
                'error' => 'Accès réservé aux électeurs.',
            ], 403);
        }

        if ($user->status !== 'Validé') {
            return response()->json([
                'error' => 'Votre compte est suspendu. Contactez l\'administration.',
            ], 403);
        }

        return $next($request);
    }
}
