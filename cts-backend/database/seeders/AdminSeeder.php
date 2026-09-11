<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Crée (ou met à jour) le compte administrateur.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  LOCAL (APP_ENV=local)                                          │
 * │  Variables lues : ADMIN_LOCAL_EMAIL / ADMIN_LOCAL_PASSWORD      │
 * │  Définies dans .env uniquement — jamais committées.             │
 * │                                                                 │
 * │  PRODUCTION (APP_ENV=production)                                │
 * │  Variables lues : CTS_ADMIN_EMAIL / CTS_ADMIN_PASSWORD          │
 * │  Injectées dans le dashboard Render — jamais dans le repo.      │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * Le seeder est idempotent : relancer `db:seed` ne crée pas de doublon.
 */
class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $isLocal = app()->environment('local');

        $email    = $isLocal
            ? env('ADMIN_LOCAL_EMAIL')
            : env('CTS_ADMIN_EMAIL');

        $password = $isLocal
            ? env('ADMIN_LOCAL_PASSWORD')
            : env('CTS_ADMIN_PASSWORD');

        $email    = strtolower(trim((string) $email));
        $password = (string) $password;

        // Validation minimale : sans credentials valides on ne crée rien
        // plutôt que de planter le déploiement.
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->command->warn('[AdminSeeder] Email admin invalide ou absent — compte non créé.');
            $this->command->warn($isLocal
                ? '  → Définissez ADMIN_LOCAL_EMAIL dans votre .env local.'
                : '  → Définissez CTS_ADMIN_EMAIL dans les variables d\'environnement Render.');
            return;
        }

        if (mb_strlen($password) < 12) {
            $this->command->warn('[AdminSeeder] Mot de passe absent ou trop court (< 12 car.) — compte non créé.');
            $this->command->warn($isLocal
                ? '  → Définissez ADMIN_LOCAL_PASSWORD dans votre .env local.'
                : '  → Définissez CTS_ADMIN_PASSWORD dans les variables d\'environnement Render.');
            return;
        }

        // firstOrNew : pas de doublon si le seeder est relancé.
        $admin = User::firstOrNew(['email' => $email]);

        $isNew = !$admin->exists;

        $admin->first_name        = $admin->first_name ?: 'Admin';
        $admin->last_name         = $admin->last_name  ?: 'CTS';
        $admin->password          = Hash::make($password);
        $admin->role              = 'admin';
        $admin->status            = 'Validé';
        $admin->email_verified_at = $admin->email_verified_at ?? now();
        $admin->save();

        $label = $isLocal ? 'local' : 'production';
        $action = $isNew   ? 'créé'   : 'mis à jour';

        $this->command->info("[AdminSeeder] Compte admin {$action} ({$label}) : {$email}");
    }
}
