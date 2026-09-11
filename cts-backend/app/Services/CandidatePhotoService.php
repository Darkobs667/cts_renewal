<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Gestion des photos de candidats.
 *
 * Principe BDD alphanumérique uniquement :
 *  - Le fichier binaire (image) n'est JAMAIS stocké en base de données.
 *  - En production (driver = cloudinary) : le binaire part sur Cloudinary,
 *    seule l'URL HTTPS retournée (string) est persistée dans photo_path.
 *  - En développement (driver = local) : le binaire est écrit sur le disque
 *    local ; le chemin relatif (string) est stocké dans photo_path.
 *  Dans les deux cas, photo_path et photo_public_id sont de simples chaînes.
 */
class CandidatePhotoService
{
    private function isCloudinary(): bool
    {
        return config('cloudinary.driver') === 'cloudinary';
    }

    private function client(): Cloudinary
    {
        $url = config('cloudinary.url');

        if (blank($url)) {
            throw new RuntimeException(
                'CLOUDINARY_URL doit être configurée pour stocker les photos en production.'
            );
        }

        return new Cloudinary($url);
    }

    /**
     * Upload une photo et retourne les métadonnées à stocker en BDD (strings uniquement).
     *
     * @return array{public_id: string|null, secure_url: string}
     */
    public function upload(UploadedFile $photo): array
    {
        if (!$this->isCloudinary()) {
            // Dev local : chemin relatif (string alphanumérique) stocké en BDD.
            $path = $photo->store('candidates', 'public');

            return ['public_id' => null, 'secure_url' => $path];
        }

        $asset = $this->client()->uploadApi()->upload($photo->getRealPath(), [
            'resource_type'   => 'image',
            'folder'          => config('cloudinary.folder'),
            'public_id'       => (string) Str::uuid(),
            'overwrite'       => false,
            'unique_filename' => false,
        ]);

        // Seules des strings sont retournées — jamais de binaire.
        return [
            'public_id'  => (string) $asset['public_id'],
            'secure_url' => (string) $asset['secure_url'],
        ];
    }

    /**
     * Supprimer une photo sur Cloudinary via son public_id (string alphanumérique).
     */
    public function delete(?string $publicId): void
    {
        if (filled($publicId) && $this->isCloudinary()) {
            $this->client()->uploadApi()->destroy($publicId, [
                'resource_type' => 'image',
                'invalidate'    => true,
            ]);
        }
    }

    /**
     * Retourne l'URL de livraison optimisée (f_auto, q_auto, recadrage auto).
     * En dev (chemin local), retourne l'URL de stockage telle quelle.
     * Résultat : toujours une string ou null — jamais de binaire.
     */
    public static function deliveryUrl(?string $photoPath): ?string
    {
        if (blank($photoPath)) {
            return null;
        }

        // URL Cloudinary : on injecte les transformations.
        if (str_starts_with($photoPath, 'https://res.cloudinary.com/')) {
            return str_replace(
                '/image/upload/',
                '/image/upload/f_auto/q_auto/c_fill,g_auto,w_256,h_256/',
                $photoPath,
            );
        }

        // URL externe déjà complète (https://) → retournée telle quelle.
        if (str_starts_with($photoPath, 'https://') || str_starts_with($photoPath, 'http://')) {
            return $photoPath;
        }

        // Chemin local (dev) : construit l'URL publique via le storage.
        $backendUrl  = rtrim(config('app.url'), '/');
        $storageBase = rtrim(config('app.storage_url', $backendUrl . '/storage'), '/');

        return $storageBase . '/' . ltrim($photoPath, '/');
    }
}
