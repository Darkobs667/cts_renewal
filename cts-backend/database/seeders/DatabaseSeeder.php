<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Ordre intentionnel :
     *  1. AdminSeeder  — crée le compte admin (local ou prod selon APP_ENV)
     *
     * Ajouter d'autres seeders ici en dessous si nécessaire.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
        ]);
    }
}
