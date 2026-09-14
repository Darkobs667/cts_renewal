<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    |
    | Autorise uniquement le frontend Vercel à appeler l'API.
    | En développement local, http://localhost:5173 est également autorisé.
    |
    | FRONTEND_URL doit être défini dans le dashboard Render sans slash final.
    | Exemple : https://cts-frontend.vercel.app
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),           // Production : URL Vercel
        'http://localhost:5173',        // Développement local Vite
        'http://127.0.0.1:5173',        // Développement local Vite (alt)
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,   // 24h de cache preflight

    'supports_credentials' => false,

];
