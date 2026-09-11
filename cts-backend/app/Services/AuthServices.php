<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;

class AuthServices
{
    /**
     * Inscrire un nouvel utilisateur.
     *
     * Correction #15 : browserId peut être une chaîne vide si FingerprintJS échoue
     * côté client. On n'applique la contrainte d'unicité que si un browserId
     * non-vide est fourni, pour ne pas bloquer l'inscription.
     */
    public function register(array $data): array
    {
        $browserId = trim($data['browserId'] ?? '');

        // Unicité du browserId seulement s'il est renseigné.
        if ($browserId !== '' && User::where('browserId', $browserId)->exists()) {
            return ['errors' => 'Un compte existe déjà sur cet appareil.'];
        }

        if (User::where('email', $data['email'])->exists()) {
            return ['errors' => 'Cette adresse e-mail est déjà utilisée.'];
        }

        DB::beginTransaction();
        try {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name'  => $data['last_name'],
                'code'       => $data['code'] ?? null,
                'email'      => strtolower(trim($data['email'])),
                'browserId'  => $browserId !== '' ? $browserId : null,
                'password'   => Hash::make($data['password']),
            ]);

            DB::commit();

            return ['user' => $user];
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Authentifier un utilisateur et retourner les tokens.
     */
    public function login(array $credentials): array
    {
        if (empty($credentials['email'])) {
            throw new \Exception('L\'adresse e-mail est requise.', 422);
        }

        $user = User::where('email', strtolower(trim($credentials['email'])))->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw new \Exception('Identifiants invalides.', 401);
        }

        $tokens = $this->generateTokens($user);

        return [
            'user'          => $user->fresh(),
            'access_token'  => $tokens['access_token'],
            'refresh_token' => $tokens['refresh_token'],
        ];
    }

    /**
     * Invalider le token JWT courant.
     */
    public function logout(): bool
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
            return true;
        } catch (JWTException) {
            return false;
        }
    }

    /**
     * Rafraîchir l'access token.
     */
    public function refresh(): array
    {
        try {
            $user     = auth('api')->user();
            $newToken = JWTAuth::refresh(JWTAuth::getToken());

            return [
                'access_token'  => $newToken,
                'refresh_token' => $this->generateRefreshToken($user),
            ];
        } catch (JWTException $e) {
            throw new JWTException('Impossible de rafraîchir le token.');
        }
    }

    /**
     * Utilisateur actuellement authentifié.
     */
    public function me(): ?User
    {
        try {
            return auth('api')->user();
        } catch (JWTException) {
            return null;
        }
    }

    /**
     * Valider un refresh token et retourner l'utilisateur associé.
     */
    public function validateRefreshToken(string $refreshToken): ?User
    {
        try {
            $payload = JWTAuth::setToken($refreshToken)->getPayload();

            if ($payload->get('type') !== 'refresh') {
                return null;
            }

            return User::find($payload->get('user_id'));
        } catch (JWTException) {
            return null;
        }
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private function generateTokens(User $user): array
    {
        return [
            'access_token'  => JWTAuth::fromUser($user),
            'refresh_token' => $this->generateRefreshToken($user),
        ];
    }

    private function generateRefreshToken(User $user): string
    {
        return JWTAuth::customClaims([
            'type'    => 'refresh',
            'user_id' => $user->id,
            'exp'     => now()->addDays(30)->timestamp,
        ])->fromUser($user);
    }
}
