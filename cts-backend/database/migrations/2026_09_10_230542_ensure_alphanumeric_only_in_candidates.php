<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migration de nettoyage : garantit que la table candidates ne contient
 * que des données alphanumériques (strings/URLs) — jamais de binaires.
 *
 * - photo_path      : conservé tel quel si c'est une URL HTTPS, sinon mis à NULL.
 * - photo_public_id : conservé tel quel s'il est alphanumérique (ID Cloudinary),
 *                     sinon mis à NULL.
 *
 * Les colonnes restent en VARCHAR (alphanumérique) ; aucun type BLOB n'est introduit.
 */
return new class extends Migration
{
    public function up(): void
    {
        // S'assurer que les colonnes sont bien en VARCHAR (pas BLOB/TEXT long).
        Schema::table('candidates', function (Blueprint $table) {
            $table->string('photo_path', 512)->nullable()->change();
            $table->string('photo_public_id', 255)->nullable()->change();
        });

        // Nullifier les photo_path qui ne sont pas des URLs HTTPS valides.
        // (ex : anciens chemins locaux de type "candidates/abc.jpg" sans domaine)
        DB::table('candidates')
            ->whereNotNull('photo_path')
            ->where(function ($q) {
                $q->where('photo_path', 'not like', 'https://%')
                  ->where('photo_path', 'not like', 'http://%');
            })
            ->update(['photo_path' => null, 'photo_public_id' => null]);

        // Nullifier les photo_public_id qui contiendraient des caractères non-alphanumériques
        // autres que les séparateurs courants Cloudinary (/, -, _).
        // NOTE : REGEXP n'est pas disponible nativement en SQLite (dev) ; on filtre en mémoire.
        $driver = DB::getDriverName();
        if ($driver === 'pgsql' || $driver === 'mysql') {
            $regexpOp = $driver === 'pgsql' ? '~' : 'REGEXP';
            $pattern  = $driver === 'pgsql' ? '[^a-zA-Z0-9/_-]' : '[^a-zA-Z0-9/_-]';
            DB::table('candidates')
                ->whereNotNull('photo_public_id')
                ->whereRaw("photo_public_id {$regexpOp} ?", [$pattern])
                ->update(['photo_public_id' => null]);
        } else {
            // SQLite (dev local) : filtrage en mémoire via PHP.
            DB::table('candidates')
                ->whereNotNull('photo_public_id')
                ->get(['id', 'photo_public_id'])
                ->each(function ($row) {
                    if (!preg_match('/^[a-zA-Z0-9\/_-]+$/', (string) $row->photo_public_id)) {
                        DB::table('candidates')
                            ->where('id', $row->id)
                            ->update(['photo_public_id' => null]);
                    }
                });
        }
    }

    public function down(): void
    {
        // Pas de rollback destructif : les données nullifiées ne peuvent être restaurées.
        // On remet simplement les colonnes en TEXT nullable.
        Schema::table('candidates', function (Blueprint $table) {
            $table->text('photo_path')->nullable()->change();
            $table->text('photo_public_id')->nullable()->change();
        });
    }
};
