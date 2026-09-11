<?php

namespace App\Http\Controllers\Auth;

// Ce contrôleur est conservé pour compatibilité mais ses fonctionnalités
// sont couvertes par AuthController::verifyRole() et AuthController::checkAdmin().
// Il utilise le bon package JWT du projet : php-open-source-saver/jwt-auth.

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class RoleVerificationController extends Controller
{
    public function verifyRole(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            return response()->json([
                'success' => true,
                'data'    => [
                    'id'         => $user->id,
                    'role'       => $user->role,
                    'first_name' => $user->first_name,
                    'last_name'  => $user->last_name,
                    'email'      => $user->email,
                    'is_admin'   => $user->role === 'admin',
                ],
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'error' => 'Token invalide ou expiré'], 401);
        }
    }

    public function checkAdmin(Request $request): JsonResponse
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();

            return response()->json([
                'success'  => true,
                'is_admin' => $user->role === 'admin',
            ]);
        } catch (JWTException $e) {
            return response()->json(['success' => false, 'is_admin' => false], 401);
        }
    }
}
